import { Injectable } from '@nestjs/common';
import { addDays, diffDays, vnDate } from '../common/date.util';
import { accessibleWords } from '../common/word-access';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async overview(userId: number) {
    const today = vnDate();
    const [user, learned, mastered, due, todayLog, quiz] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.progress.count({
        where: { userId, OR: [{ correctCount: { gt: 0 } }, { wrongCount: { gt: 0 } }] },
      }),
      this.prisma.progress.count({ where: { userId, level: { gte: 4 } } }),
      this.prisma.word.count({ where: { ...accessibleWords(userId), progress: { some: { userId, nextReviewAt: { lte: new Date() } } } } }),
      this.prisma.studyLog.findUnique({ where: { userId_date: { userId, date: today } } }),
      this.prisma.quizAttempt.aggregate({
        where: { userId },
        _count: true,
        _sum: { totalQuestions: true, correctAnswers: true },
      }),
    ]);

    const totalQ = quiz._sum.totalQuestions ?? 0;
    const totalC = quiz._sum.correctAnswers ?? 0;

    // streak đã đứt nếu quá 1 ngày chưa học
    const last = user.lastStudyAt ? vnDate(user.lastStudyAt) : null;
    const gap = last ? diffDays(today, last) : null;
    const missed = gap === null || gap > 1;

    return {
      streak: missed ? 0 : user.streak,
      longestStreak: user.longestStreak,
      studiedToday: gap === 0,
      streakAtRisk: gap === 1 && user.streak > 0,
      streakLost: missed && user.streak > 0 ? { previous: user.streak } : null,
      xp: user.xp,
      todayXp: todayLog?.xp ?? 0,
      dailyGoal: user.dailyGoal,
      todayLearned: todayLog?.wordsLearned ?? 0,
      todayReviewed: todayLog?.wordsReview ?? 0,
      totalLearned: learned,
      mastered,
      dueToday: due,
      quizCount: quiz._count,
      avgScore: totalQ ? Math.round((totalC / totalQ) * 100) : 0,
    };
  }

  // 7 ngày gần nhất cho biểu đồ
  async weekly(userId: number) {
    const today = vnDate();
    const start = addDays(today, -6);
    const logs = await this.prisma.studyLog.findMany({
      where: { userId, date: { gte: start, lte: today } },
    });
    const byDate = new Map(logs.map((l) => [l.date.toISOString().slice(0, 10), l]));

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const key = d.toISOString().slice(0, 10);
      const l = byDate.get(key);
      return {
        date: key,
        wordsLearned: l?.wordsLearned ?? 0,
        wordsReview: l?.wordsReview ?? 0,
        total: (l?.wordsLearned ?? 0) + (l?.wordsReview ?? 0),
      };
    });
  }
}