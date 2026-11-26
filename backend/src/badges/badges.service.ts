import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BADGES, BadgeMetric } from './badges.catalog';

type Metrics = Record<BadgeMetric, number>;

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  private async metrics(userId: number): Promise<Metrics> {
    const done = { userId, completedAt: { not: null } } as const;
    const [user, lessonsDone, threeStars, videosDone, checkpoints, wordsLearned, mastered, friends] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { streak: true, longestStreak: true, xp: true } }),
      this.prisma.lessonProgress.count({ where: done }),
      this.prisma.lessonProgress.count({ where: { userId, stars: 3 } }),
      this.prisma.lessonProgress.count({ where: { ...done, lesson: { type: 'VIDEO' } } }),
      this.prisma.lessonProgress.count({ where: { ...done, lesson: { type: 'CHECKPOINT' } } }),
      this.prisma.progress.count({ where: { userId, OR: [{ correctCount: { gt: 0 } }, { wrongCount: { gt: 0 } }] } }),
      this.prisma.progress.count({ where: { userId, level: { gte: 4 } } }),
      this.prisma.friendship.count({ where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] } }),
    ]);
    return {
      lessonsDone,
      threeStars,
      videosDone,
      checkpoints,
      wordsLearned,
      mastered,
      streak: Math.max(user?.streak ?? 0, user?.longestStreak ?? 0),
      xp: user?.xp ?? 0,
      friends,
    };
  }

  // Trao các huy hiệu vừa đủ điều kiện; trả về danh sách huy hiệu mới (để app hiện chúc mừng).
  private async award(userId: number, m: Metrics) {
    const have = new Set(
      (await this.prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } })).map((b) => b.badgeKey),
    );
    const fresh = BADGES.filter((b) => !have.has(b.key) && m[b.metric] >= b.target);
    if (!fresh.length) return [];

    await this.prisma.userBadge.createMany({
      data: fresh.map((b) => ({ userId, badgeKey: b.key })),
      skipDuplicates: true,
    });
    await this.prisma.notification
      .createMany({
        data: fresh.map((b) => ({
          userId,
          type: 'SYSTEM' as const,
          title: `Huy hiệu mới: ${b.emoji} ${b.title}`,
          body: b.description,
          data: { kind: 'BADGE', key: b.key },
        })),
      })
      .catch(() => undefined);
    return fresh.map((b) => ({ key: b.key, emoji: b.emoji, title: b.title, description: b.description }));
  }

  // Gọi sau khi người dùng hoàn thành bài / kết bạn...
  async evaluate(userId: number) {
    try {
      return await this.award(userId, await this.metrics(userId));
    } catch {
      return []; // huy hiệu lỗi không được làm hỏng luồng học
    }
  }

  async list(userId: number) {
    const m = await this.metrics(userId);
    await this.award(userId, m); // trao nốt các huy hiệu đạt được từ ôn tập/streak
    const rows = await this.prisma.userBadge.findMany({ where: { userId } });
    const at = new Map(rows.map((r) => [r.badgeKey, r.earnedAt]));
    const badges = BADGES.map((b) => ({
      key: b.key,
      emoji: b.emoji,
      title: b.title,
      description: b.description,
      target: b.target,
      progress: Math.min(m[b.metric], b.target),
      earned: at.has(b.key),
      earnedAt: at.get(b.key) ?? null,
    }));
    return { earned: badges.filter((b) => b.earned).length, total: badges.length, badges };
  }
}
