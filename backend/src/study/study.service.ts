import { Injectable, NotFoundException } from '@nestjs/common';
import { addDays, diffDays, vnDate } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';

// Hộp Leitner: level 0-5, số ngày đến lần ôn kế tiếp
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15];

@Injectable()
export class StudyService {
  constructor(private prisma: PrismaService) {}

  private accessibleWords(userId: number) {
    return { deck: { OR: [{ isPublic: true }, { ownerId: userId }] } };
  }

  private dueFilter(userId: number) {
    const now = new Date();
    return {
      OR: [
        { progress: { none: { userId } } },
        { progress: { some: { userId, nextReviewAt: null } } },
        { progress: { some: { userId, nextReviewAt: { lte: now } } } },
      ],
    };
  }

  // Danh sách từ cần học/ôn hôm nay (từ ôn trước, từ mới sau)
  async session(userId: number, deckId?: number, limit = 20) {
    const words = await this.prisma.word.findMany({
      where: {
        ...(deckId ? { deckId } : {}),
        ...this.accessibleWords(userId),
        ...this.dueFilter(userId),
      },
      include: { progress: { where: { userId } } },
      take: limit * 2,
    });

    const mapped = words.map(({ progress, ...w }) => {
      const p = progress[0];
      return {
        ...w,
        isFavorite: p?.isFavorite ?? false,
        level: p?.level ?? 0,
        isNew: !p || p.correctCount + p.wrongCount === 0,
      };
    });
    mapped.sort((a, b) => Number(a.isNew) - Number(b.isNew));
    return mapped.slice(0, limit);
  }

  async dueCount(userId: number) {
    const count = await this.prisma.word.count({
      where: { ...this.accessibleWords(userId), progress: { some: { userId, nextReviewAt: { lte: new Date() } } } },
    });
    return { due: count };
  }

  // Ghi kết quả 1 lần học/ôn: cập nhật SRS + nhật ký ngày + streak
  async applyReview(userId: number, wordId: number, correct: boolean) {
    const word = await this.prisma.word.findUnique({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Không tìm thấy từ');

    const key = { userId_wordId: { userId, wordId } };
    const cur = await this.prisma.progress.findUnique({ where: key });
    const isNew = !cur || cur.correctCount + cur.wrongCount === 0;

    const level = correct ? Math.min((cur?.level ?? 0) + 1, 5) : 0;
    const now = new Date();
    const nextReviewAt = addDays(now, INTERVAL_DAYS[level]);

    await this.prisma.progress.upsert({
      where: key,
      update: {
        level,
        nextReviewAt,
        lastReviewedAt: now,
        ...(correct ? { correctCount: { increment: 1 } } : { wrongCount: { increment: 1 } }),
      },
      create: {
        userId,
        wordId,
        level,
        nextReviewAt,
        lastReviewedAt: now,
        correctCount: correct ? 1 : 0,
        wrongCount: correct ? 0 : 1,
      },
    });

    const streak = await this.touchDaily(userId, isNew);
    return { wordId, level, nextReviewAt, streak };
  }

  private async touchDaily(userId: number, isNew: boolean) {
    const today = vnDate();
    await this.prisma.studyLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: isNew ? { wordsLearned: { increment: 1 } } : { wordsReview: { increment: 1 } },
      create: { userId, date: today, wordsLearned: isNew ? 1 : 0, wordsReview: isNew ? 0 : 1 },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const last = user.lastStudyAt ? vnDate(user.lastStudyAt) : null;
    const gap = last ? diffDays(today, last) : null;

    let streak = user.streak;
    if (gap === null || gap > 1) streak = 1;
    else if (gap === 1) streak = user.streak + 1;
    // gap === 0: đã học hôm nay, giữ nguyên

    if (gap !== 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { streak, longestStreak: Math.max(user.longestStreak, streak), lastStudyAt: new Date() },
      });
    }
    return streak;
  }
}