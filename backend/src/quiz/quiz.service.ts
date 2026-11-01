import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { shuffle } from '../common/array.util';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService } from '../study/study.service';
import { SubmitQuizDto } from './dto/quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private study: StudyService,
  ) {}

  private async getDeck(userId: number, deckId: number) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    if (!deck.isPublic && deck.ownerId !== userId) throw new ForbiddenException();
    return deck;
  }

  // Sinh câu hỏi: hiện từ tiếng Anh, chọn nghĩa đúng trong 4 đáp án
  async generate(userId: number, deckId: number, count = 10) {
    await this.getDeck(userId, deckId);
    const words = await this.prisma.word.findMany({ where: { deckId } });
    if (words.length === 0) throw new BadRequestException('Bộ từ chưa có từ nào');

    let pool = words;
    if (words.length < 4) {
      const extra = await this.prisma.word.findMany({
        where: { deckId: { not: deckId }, deck: { isPublic: true } },
        take: 30,
      });
      pool = [...words, ...extra];
    }

    const questions = shuffle(words)
      .slice(0, count)
      .map((w) => {
        const distractors = shuffle(pool.filter((x) => x.id !== w.id && x.meaning !== w.meaning))
          .slice(0, 3)
          .map((x) => x.meaning);
        return {
          wordId: w.id,
          term: w.term,
          phonetic: w.phonetic,
          options: shuffle([w.meaning, ...distractors]),
        };
      });

    return { deckId, total: questions.length, questions };
  }

  async submit(userId: number, deckId: number, dto: SubmitQuizDto) {
    await this.getDeck(userId, deckId);
    if (dto.answers.length === 0) throw new BadRequestException('Chưa có câu trả lời');

    const words = await this.prisma.word.findMany({
      where: { deckId, id: { in: dto.answers.map((a) => a.wordId) } },
    });
    const byId = new Map(words.map((w) => [w.id, w]));

    const results: {
      wordId: number; term: string; selected: string; correctMeaning: string; isCorrect: boolean;
    }[] = [];

    for (const a of dto.answers) {
      const w = byId.get(a.wordId);
      if (!w) continue;
      const isCorrect = a.selected === w.meaning;
      results.push({ wordId: w.id, term: w.term, selected: a.selected, correctMeaning: w.meaning, isCorrect });
      await this.study.applyReview(userId, w.id, isCorrect);
    }

    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        deckId,
        totalQuestions: results.length,
        correctAnswers,
        durationSec: dto.durationSec ?? 0,
      },
    });

    return {
      attemptId: attempt.id,
      total: results.length,
      correct: correctAnswers,
      score: results.length ? Math.round((correctAnswers / results.length) * 100) : 0,
      results,
    };
  }

  history(userId: number) {
    return this.prisma.quizAttempt.findMany({
      where: { userId },
      include: { deck: { select: { id: true, title: true, emoji: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }
}