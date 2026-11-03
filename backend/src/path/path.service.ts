import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { shuffle } from '../common/array.util';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService } from '../study/study.service';
import { CompleteLessonDto, PlacementSubmitDto } from './dto/path.dto';

const RANK: Record<Difficulty, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type Pair = { id: number; term: string; meaning: string };
type W = Pair & {
  phonetic: string | null;
  example: string | null;
  exampleMeaning: string | null;
  synonym: string | null;
};

@Injectable()
export class PathService {
  constructor(
    private prisma: PrismaService,
    private study: StudyService,
  ) {}

  private async sequence() {
    const lessons = await this.prisma.lesson.findMany({
      select: {
        id: true,
        order: true,
        title: true,
        unit: { select: { id: true, level: true, order: true, title: true, titleVi: true, emoji: true } },
        _count: { select: { words: true } },
      },
    });
    return lessons.sort(
      (a, b) =>
        RANK[a.unit.level] - RANK[b.unit.level] || a.unit.order - b.unit.order || a.order - b.order,
    );
  }

  // ---------- lộ trình ----------
  async getPath(userId: number) {
    const [user, seq, prog] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { level: true, onboarded: true } }),
      this.sequence(),
      this.prisma.lessonProgress.findMany({ where: { userId } }),
    ]);
    const byLesson = new Map(prog.map((p) => [p.lessonId, p]));
    const startRank = RANK[user.level];
    const firstIdx = seq.findIndex((l) => RANK[l.unit.level] >= startRank);

    let nextLessonId: number | null = null;
    const units: any[] = [];
    const unitMap = new Map<number, any>();

    seq.forEach((l, i) => {
      const p = byLesson.get(l.id);
      const completed = !!p?.completedAt;
      const below = RANK[l.unit.level] < startRank;
      const prevDone = i > 0 && !!byLesson.get(seq[i - 1].id)?.completedAt;
      const locked = !(below || i === firstIdx || prevDone);
      if (!locked && !completed && !below && nextLessonId === null) nextLessonId = l.id;

      let u = unitMap.get(l.unit.id);
      if (!u) {
        u = { ...l.unit, lessons: [], completedLessons: 0, totalLessons: 0 };
        unitMap.set(l.unit.id, u);
        units.push(u);
      }
      u.lessons.push({
        id: l.id,
        order: l.order,
        title: l.title,
        wordCount: l._count.words,
        stars: p?.stars ?? 0,
        completed,
        locked,
      });
      u.totalLessons++;
      if (completed) u.completedLessons++;
    });

    return {
      level: user.level,
      onboarded: user.onboarded,
      nextLessonId,
      totalLessons: seq.length,
      completedLessons: prog.filter((p) => p.completedAt).length,
      units,
    };
  }

  // ---------- chi tiết bài + bài tập ----------
  async getLesson(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: true, words: { orderBy: { id: 'asc' } } },
    });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');

    const pool = await this.prisma.word.findMany({
      where: { lesson: { unit: { level: lesson.unit.level } }, id: { notIn: lesson.words.map((w) => w.id) } },
      select: { id: true, term: true, meaning: true },
      take: 400,
    });

    return {
      id: lesson.id,
      title: lesson.title,
      unit: {
        id: lesson.unit.id,
        level: lesson.unit.level,
        title: lesson.unit.title,
        titleVi: lesson.unit.titleVi,
        emoji: lesson.unit.emoji,
      },
      words: lesson.words.map((w) => ({
        id: w.id,
        term: w.term,
        meaning: w.meaning,
        phonetic: w.phonetic,
        partOfSpeech: w.partOfSpeech,
        example: w.example,
        exampleMeaning: w.exampleMeaning,
        synonym: w.synonym,
      })),
      exercises: this.buildExercises(lesson.words, pool),
    };
  }

  private buildExercises(words: W[], pool: Pair[]) {
    const all: Pair[] = [...words, ...pool];

    const meaningOpts = (w: Pair) =>
      shuffle([
        w.meaning,
        ...shuffle(all.filter((x) => x.id !== w.id && x.meaning !== w.meaning))
          .slice(0, 3)
          .map((x) => x.meaning),
      ]);

    const termOpts = (w: Pair, avoid: string[] = []) => {
      const bad = new Set([w.term.toLowerCase(), ...avoid.map((a) => a.toLowerCase())]);
      const pick = shuffle(all.filter((x) => !bad.has(x.term.toLowerCase())))
        .slice(0, 3)
        .map((x) => x.term);
      return shuffle([w.term, ...pick]);
    };

    const fillBlank = (w: W) => {
      if (!w.example || !w.exampleMeaning) return null;
      const re = new RegExp(`\\b${esc(w.term)}\\b`, 'i');
      if (!re.test(w.example)) return null;
      return {
        type: 'fill_blank',
        wordId: w.id,
        sentence: w.example.replace(re, '____'),
        translation: w.exampleMeaning,
        options: termOpts(w),
        answer: w.term,
      };
    };

    const orderSentence = (w: W) => {
      if (!w.example || !w.exampleMeaning) return null;
      const tokens = w.example.trim().split(/\s+/);
      if (tokens.length < 3 || tokens.length > 12) return null;
      return {
        type: 'order_sentence',
        wordId: w.id,
        translation: w.exampleMeaning,
        tokens: shuffle(tokens),
        answer: tokens.join(' '),
      };
    };

    const synonym = (w: W) => {
      if (!w.synonym) return null;
      const syn = w.synonym;
      const bad = new Set([w.term.toLowerCase(), syn.toLowerCase()]);
      const pick = shuffle(all.filter((x) => !bad.has(x.term.toLowerCase())))
        .slice(0, 3)
        .map((x) => x.term);
      return { type: 'synonym', wordId: w.id, term: w.term, options: shuffle([syn, ...pick]), answer: syn };
    };

    let n = 0;
    const id = () => `e${++n}`;
    const ex: any[] = [];

    ex.push({
      id: id(),
      type: 'match_pairs',
      pairs: words.map((w) => ({ wordId: w.id, term: w.term, meaning: w.meaning })),
    });

    for (const w of shuffle(words)) {
      ex.push({
        id: id(),
        type: 'choose_meaning',
        wordId: w.id,
        term: w.term,
        phonetic: w.phonetic,
        options: meaningOpts(w),
        answer: w.meaning,
      });
    }

    for (const w of shuffle(words).slice(0, 2)) {
      ex.push({ id: id(), type: 'listen_choose', wordId: w.id, term: w.term, options: termOpts(w), answer: w.term });
    }

    const builders = [fillBlank, orderSentence, synonym];
    let k = 0;
    for (const w of shuffle(words).slice(0, Math.min(3, words.length))) {
      for (let t = 0; t < builders.length; t++) {
        const made = builders[(k + t) % builders.length](w);
        if (made) {
          ex.push({ id: id(), ...made });
          break;
        }
      }
      k++;
    }

    for (const w of shuffle(words).slice(0, 2)) {
      ex.push({
        id: id(),
        type: 'type_word',
        wordId: w.id,
        meaning: w.meaning,
        hint: `${w.term[0]}${'_'.repeat(Math.max(0, w.term.length - 1))}`,
        answer: w.term,
      });
    }

    return ex;
  }

  // ---------- nộp kết quả bài ----------
  async complete(userId: number, lessonId: number, dto: CompleteLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');
    const total = dto.answers.length;
    if (total === 0) throw new BadRequestException('Chưa có câu trả lời');

    const correct = dto.answers.filter((a) => a.correct).length;
    const score = Math.round((correct / total) * 100);
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

    const perWord = new Map<number, boolean>();
    for (const a of dto.answers) perWord.set(a.wordId, (perWord.get(a.wordId) ?? true) && a.correct);
    const valid = await this.prisma.word.findMany({
      where: { lessonId, id: { in: [...perWord.keys()] } },
      select: { id: true },
    });
    const ok = new Set(valid.map((w) => w.id));
    for (const [wordId, right] of perWord) {
      if (ok.has(wordId)) await this.study.applyReview(userId, wordId, right);
    }

    const key = { userId_lessonId: { userId, lessonId } };
    const prev = await this.prisma.lessonProgress.findUnique({ where: key });
    const passed = stars >= 1;
    const bestStars = Math.max(prev?.stars ?? 0, stars);
    await this.prisma.lessonProgress.upsert({
      where: key,
      create: { userId, lessonId, stars, bestScore: score, attempts: 1, completedAt: passed ? new Date() : null },
      update: {
        stars: bestStars,
        bestScore: Math.max(prev?.bestScore ?? 0, score),
        attempts: { increment: 1 },
        completedAt: prev?.completedAt ?? (passed ? new Date() : null),
      },
    });

    const seq = await this.sequence();
    const i = seq.findIndex((l) => l.id === lessonId);
    return {
      score,
      stars,
      bestStars,
      correct,
      total,
      passed,
      nextLessonId: seq[i + 1]?.id ?? null,
    };
  }

  // ---------- bài test đầu vào ----------
  async placement() {
    const get = async (level: Difficulty, n: number) => {
      const ws = await this.prisma.word.findMany({
        where: { lesson: { unit: { level } } },
        select: { id: true, term: true, phonetic: true, meaning: true },
        take: 300,
      });
      return { level, picked: shuffle(ws).slice(0, n), pool: ws };
    };
    const parts = [await get('BEGINNER', 4), await get('INTERMEDIATE', 3), await get('ADVANCED', 3)];
    const questions = parts.flatMap((p) =>
      p.picked.map((w) => ({
        wordId: w.id,
        level: p.level,
        term: w.term,
        phonetic: w.phonetic,
        options: shuffle([
          w.meaning,
          ...shuffle(p.pool.filter((x) => x.id !== w.id && x.meaning !== w.meaning))
            .slice(0, 3)
            .map((x) => x.meaning),
        ]),
      })),
    );
    return { total: questions.length, questions };
  }

  async submitPlacement(userId: number, dto: PlacementSubmitDto) {
    const words = await this.prisma.word.findMany({
      where: { id: { in: dto.answers.map((a) => a.wordId) }, lessonId: { not: null } },
      select: { id: true, meaning: true, lesson: { select: { unit: { select: { level: true } } } } },
    });
    const by = new Map(words.map((w) => [w.id, w]));
    const stat: Record<Difficulty, { correct: number; total: number }> = {
      BEGINNER: { correct: 0, total: 0 },
      INTERMEDIATE: { correct: 0, total: 0 },
      ADVANCED: { correct: 0, total: 0 },
    };
    for (const a of dto.answers) {
      const w = by.get(a.wordId);
      if (!w?.lesson) continue;
      const lv = w.lesson.unit.level;
      stat[lv].total++;
      if (a.selected === w.meaning) stat[lv].correct++;
    }

    const b = stat.BEGINNER.correct;
    const i = stat.INTERMEDIATE.correct;
    const ad = stat.ADVANCED.correct;
    const level: Difficulty = ad >= 2 && i >= 2 ? 'ADVANCED' : i >= 2 && b >= 3 ? 'INTERMEDIATE' : 'BEGINNER';

    await this.prisma.user.update({ where: { id: userId }, data: { level, onboarded: true } });
    return {
      level,
      correct: b + i + ad,
      total: stat.BEGINNER.total + stat.INTERMEDIATE.total + stat.ADVANCED.total,
      byLevel: stat,
    };
  }
}