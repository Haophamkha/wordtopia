import { Injectable, NotFoundException } from '@nestjs/common';
import { addDays, diffDays, vnDate } from '../common/date.util';
import { accessibleWords } from '../common/word-access';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

// Hộp Leitner: level 0-5, số ngày đến lần ôn kế tiếp
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15];

// Điểm kinh nghiệm (chỉnh tại đây)
export const XP = {
  WORD_CORRECT: 2, // mỗi từ đúng ở Review/Quiz
  LESSON_BASE: 10, // hoàn thành bài
  LESSON_PER_STAR: 5, // mỗi sao
  DAILY_GOAL: 10, // thưởng khi đạt mục tiêu ngày
};

@Injectable()
export class StudyService {
  private readonly milestones = [3, 7, 14, 30, 50, 100, 200, 365];
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  private accessibleWords(userId: number) {
    return accessibleWords(userId);
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
      where: {
        ...this.accessibleWords(userId),
        progress: { some: { userId, nextReviewAt: { lte: new Date() } } },
      },
    });
    return { due: count };
  }

  // Ảnh chụp trạng thái hôm nay (dùng để so trước/sau khi nộp bài)
  async today(userId: number) {
    const day = vnDate();
    const [user, log] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { streak: true, dailyGoal: true, lastStudyAt: true, xp: true },
      }),
      this.prisma.studyLog.findUnique({ where: { userId_date: { userId, date: day } } }),
    ]);
    const last = user.lastStudyAt ? vnDate(user.lastStudyAt) : null;
    return {
      studiedToday: !!last && diffDays(day, last) === 0,
      streak: user.streak,
      xp: user.xp,
      dailyGoal: user.dailyGoal,
      wordsToday: (log?.wordsLearned ?? 0) + (log?.wordsReview ?? 0),
    };
  }

  async notifyProgress(
    userId: number,
    e: { streakIncreased: boolean; streak: number; dailyGoalReached: boolean; dailyGoal: number },
  ) {
    try {
      if (e.streakIncreased && this.milestones.includes(e.streak)) {
        await this.notifications.create(
          userId,
          'STREAK_MILESTONE',
          `${e.streak} ngày liên tiếp! 🔥`,
          `Bạn đã học liên tục ${e.streak} ngày. Giữ vững nhé!`,
          { streak: e.streak },
        );
      }
      if (e.dailyGoalReached) {
        await this.notifications.create(
          userId,
          'DAILY_GOAL_DONE',
          'Đạt mục tiêu hôm nay! 🎯',
          `Bạn đã hoàn thành ${e.dailyGoal} từ trong ngày.`,
          { goal: e.dailyGoal },
        );
      }
    } catch {
      // thông báo lỗi không được làm hỏng việc nộp bài
    }
  }

  async addXp(userId: number, amount: number) {
    if (amount <= 0) return;
    const day = vnDate();
    await this.prisma.$transaction([
      this.prisma.studyLog.upsert({
        where: { userId_date: { userId, date: day } },
        update: { xp: { increment: amount } },
        create: { userId, date: day, xp: amount },
      }),
      this.prisma.user.update({ where: { id: userId }, data: { xp: { increment: amount } } }),
    ]);
  }

  // Người dùng đã xem hiệu ứng mất streak: đặt streak về 0 (chỉ khi thật sự đã lỡ ngày)
  async ackStreakLost(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const last = user.lastStudyAt ? vnDate(user.lastStudyAt) : null;
    const gap = last ? diffDays(vnDate(), last) : null;
    if ((gap === null || gap > 1) && user.streak > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: { streak: 0 } });
      await this.notifications
        .create(userId, 'STREAK_LOST', 'Chuỗi ngày học đã bị ngắt 💔', `Bạn đã mất chuỗi ${user.streak} ngày. Bắt đầu lại hôm nay nhé!`, { previous: user.streak })
        .catch(() => undefined);
    }
    return { ok: true };
  }

  // Ghi kết quả 1 lần học/ôn: cập nhật SRS + nhật ký ngày + streak + XP
  async applyReview(userId: number, wordId: number, correct: boolean, xp: number = correct ? XP.WORD_CORRECT : 0) {
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

    const day = await this.touchDaily(userId, isNew, xp);
    return { wordId, level, nextReviewAt, streak: day.streak, streakIncreased: day.streakIncreased, xpGained: xp };
  }

  markStudied(userId: number) {
    return this.touchDaily(userId, false, 0, false);
  }

  private async touchDaily(userId: number, isNew: boolean, xp: number, count = true) {
    const today = vnDate();
    await this.prisma.studyLog.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        ...(count ? (isNew ? { wordsLearned: { increment: 1 } } : { wordsReview: { increment: 1 } }) : {}),
        ...(xp ? { xp: { increment: xp } } : {}),
      },
      create: { userId, date: today, wordsLearned: count && isNew ? 1 : 0, wordsReview: count && !isNew ? 1 : 0, xp },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const last = user.lastStudyAt ? vnDate(user.lastStudyAt) : null;
    const gap = last ? diffDays(today, last) : null;

    let streak = user.streak;
    if (gap === null || gap > 1) streak = 1;
    else if (gap === 1) streak = user.streak + 1;
    // gap === 0: đã học hôm nay, giữ nguyên

    const data = {
      ...(gap !== 0 ? { streak, longestStreak: Math.max(user.longestStreak, streak), lastStudyAt: new Date() } : {}),
      ...(xp ? { xp: { increment: xp } } : {}),
    };
    if (Object.keys(data).length) await this.prisma.user.update({ where: { id: userId }, data });

    return { streak, streakIncreased: gap !== 0 };
  }
}