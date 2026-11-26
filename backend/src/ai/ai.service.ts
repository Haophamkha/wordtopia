import { HttpException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRole, PartOfSpeech } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto, ExplainDto, GenerateDeckDto } from './dto/ai.dto';
import { MistakeDto } from './dto/mistake.dto';
import { WritingDto } from './dto/writing.dto';
import { sanitizeWriting, SYSTEM_WRITING, WRITING_SHAPE, WritingResult } from './writing.util';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

interface AiWord {
  term: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
}

const POS = Object.values(PartOfSpeech) as string[];
const WORD_SHAPE = `{"term": "the word", "phonetic": "IPA, e.g. /dɪˈlɪʃəs/", "partOfSpeech": "one of ${POS.join('|')}", "meaning": "short Vietnamese meaning", "example": "simple English sentence", "exampleMeaning": "Vietnamese translation of the example"}`;

const SYSTEM_DICT =
  'You are an English-Vietnamese dictionary for Vietnamese learners. Reply with valid JSON only, no markdown.';
const SYSTEM_TUTOR =
  'You are Wordie, a friendly English tutor for a Vietnamese learner using the Wordtopia app. ' +
  'Answer mainly in Vietnamese with English examples. Be concise (under 150 words). ' +
  'Politely steer off-topic questions back to learning English.';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private readonly mistakeCache = new Map<string, string>();
  private readonly usage = new Map<string, number>();

  private limit(userId: number, kind: string, max: number) {
    const key = `${userId}:${kind}:${new Date().toISOString().slice(0, 10)}`;
    const n = (this.usage.get(key) ?? 0) + 1;
    if (n > max) throw new HttpException('Bạn đã dùng hết lượt AI hôm nay, mai quay lại nhé', 429);
    this.usage.set(key, n);
    if (this.usage.size > 5000) this.usage.clear();
  }

  async explainMistake(userId: number, dto: MistakeDto) {
    const key = `${dto.question}|${dto.answer}|${dto.picked ?? ''}`;
    const hit = this.mistakeCache.get(key);
    if (hit) return { explanation: hit };
    this.limit(userId, 'mistake', 30);
    const explanation = await this.call({
      systemInstruction: { parts: [{ text: 'You are an English tutor for Vietnamese learners. In Vietnamese, under 60 words, explain briefly why the learner is wrong and why the correct answer is right. No markdown.' }] },
      contents: [{ role: 'user', parts: [{ text: `Question: ${dto.question}\nCorrect answer: ${dto.answer}\nLearner chose: ${dto.picked || '(no answer)'}` }] }],
      generationConfig: { temperature: 0.3 },
    });
    if (this.mistakeCache.size > 500) this.mistakeCache.clear();
    this.mistakeCache.set(key, explanation);
    return { explanation };
  }

  private async call(body: object): Promise<string> {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key) throw new ServiceUnavailableException('Chưa cấu hình GEMINI_API_KEY');
    const model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Gemini ${res.status}: ${text}`);
      if (res.status === 429) {
        throw new HttpException('AI đang quá tải hoặc hết lượt miễn phí, thử lại sau ít phút', 429);
      }
      throw new ServiceUnavailableException('AI không phản hồi, thử lại sau');
    }

    const data = (await res.json()) as GeminiResponse;
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    if (!text) throw new ServiceUnavailableException('AI trả về rỗng, thử lại');
    return text;
  }

  private async json<T>(system: string, prompt: string): Promise<T> {
    const text = await this.call({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    });
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim()) as T;
    } catch {
      this.logger.error(`JSON lỗi: ${text}`);
      throw new ServiceUnavailableException('AI trả về sai định dạng, thử lại');
    }
  }

  private pos(v?: string): PartOfSpeech {
    const up = (v ?? '').toUpperCase().trim();
    return (POS.includes(up) ? up : 'OTHER') as PartOfSpeech;
  }

  // Giải nghĩa 1 từ (dùng khi thêm từ mới: tự điền nghĩa, phiên âm, ví dụ)
  async explain(dto: ExplainDto) {
    const w = await this.json<AiWord & { similar?: { word?: string; diffVi?: string }[] }>(
      SYSTEM_DICT,
      `Explain the English word or phrase "${dto.term}". Return JSON: ${WORD_SHAPE.slice(0, -1)}, "similar": [{"word": "a near-synonym or easily confused English word", "diffVi": "one short Vietnamese sentence on how it differs from the main word"}]}. Give 2-3 items in similar, or an empty array if none apply.`,
    );
    const similar = (Array.isArray(w.similar) ? w.similar : [])
      .filter((s) => s && typeof s.word === "string" && s.word.trim() && typeof s.diffVi === "string" && s.diffVi.trim())
      .slice(0, 3)
      .map((s) => ({ word: s.word!.trim(), diffVi: s.diffVi!.trim() }));
    return { ...w, similar, term: w.term || dto.term, partOfSpeech: this.pos(w.partOfSpeech) };
  }

  // Tạo cả bộ từ theo chủ đề và lưu cho user
  async generateDeck(userId: number, dto: GenerateDeckDto) {
    const count = dto.count ?? 10;
    const level = (dto.level ?? 'BEGINNER').toLowerCase();

    const g = await this.json<{ title?: string; emoji?: string; description?: string; words?: AiWord[] }>(
      SYSTEM_DICT,
      `Create an English vocabulary deck about "${dto.topic}" for ${level} learners with exactly ${count} useful, different words. ` +
        `Return JSON: {"title": "short English title", "emoji": "one emoji", "description": "one short Vietnamese sentence", "words": [${WORD_SHAPE}]}`,
    );

    const seen = new Set<string>();
    const words = (g.words ?? []).filter((w) => {
      const k = w.term?.toLowerCase().trim();
      if (!k || !w.meaning || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (words.length === 0) throw new ServiceUnavailableException('AI không tạo được từ nào, thử lại');

    return this.prisma.deck.create({
      data: {
        title: g.title || dto.topic,
        description: g.description,
        topic: dto.topic,
        emoji: g.emoji,
        difficulty: dto.level ?? 'BEGINNER',
        isPublic: false,
        ownerId: userId,
        words: {
          create: words.map((w) => ({
            term: w.term.trim(),
            meaning: w.meaning,
            phonetic: w.phonetic,
            partOfSpeech: this.pos(w.partOfSpeech),
            example: w.example,
            exampleMeaning: w.exampleMeaning,
          })),
        },
      },
      include: { _count: { select: { words: true } } },
    });
  }

  async chat(userId: number, dto: ChatDto) {
    const past = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: 10,
    });
    const history = past.reverse();
    while (history.length > 0 && history[0].role !== ChatRole.USER) history.shift();

    this.limit(userId, 'chat', 100);
    const [me, weak] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { level: true } }),
      this.prisma.progress.findMany({
        where: { userId, wrongCount: { gt: 0 } },
        orderBy: { lastReviewedAt: 'desc' },
        take: 5,
        include: { word: { select: { term: true } } },
      }),
    ]);
    const system =
      SYSTEM_TUTOR +
      ` Learner level: ${me?.level ?? 'BEGINNER'}.` +
      (weak.length ? ` Words they recently got wrong: ${weak.map((p) => p.word.term).join(', ')}. Prefer them in examples.` : '');

    const reply = await this.call({
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        ...history.map((m) => ({
          role: m.role === ChatRole.USER ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: dto.message }] },
      ],
      generationConfig: { temperature: 0.7 },
    });

    await this.prisma.chatMessage.createMany({
      data: [
        { userId, role: ChatRole.USER, content: dto.message },
        { userId, role: ChatRole.ASSISTANT, content: reply },
      ],
    });
    return { reply };
  }

  private readonly writingCache = new Map<string, WritingResult>();

  // Sửa câu viết: AI chỉ chấm và gợi ý, không ghi gì vào dữ liệu học của người dùng.
  async correctWriting(userId: number, dto: WritingDto): Promise<WritingResult> {
    const text = dto.text.trim().replace(/\s+/g, ' ');
    const key = text.toLowerCase();
    const hit = this.writingCache.get(key);
    if (hit) return hit;
    this.limit(userId, 'writing', 20);

    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { level: true } });
    const raw = await this.json<unknown>(
      SYSTEM_WRITING + ` Learner level: ${me?.level ?? 'BEGINNER'}.`,
      `Check the learner text between the <text> tags and return JSON: ${WRITING_SHAPE}.\n<text>${text}</text>`,
    );
    const result = sanitizeWriting(raw, text);
    if (this.writingCache.size > 300) this.writingCache.clear();
    this.writingCache.set(key, result);
    return result;
  }

  async history(userId: number) {
    const rows = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: 50,
    });
    return rows.reverse();
  }

  async clearHistory(userId: number) {
    await this.prisma.chatMessage.deleteMany({ where: { userId } });
    return { cleared: true };
  }
}