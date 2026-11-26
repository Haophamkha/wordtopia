import { Injectable } from '@nestjs/common';
import { addDays, vnDate } from '../common/date.util';
import { FriendsService } from '../friends/friends.service';
import { PrismaService } from '../prisma/prisma.service';

export type LeaderboardPeriod = 'week' | 'all';
export type LeaderboardScope = 'all' | 'friends';
const TOP = 20;

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService, private friends: FriendsService) {}

  // Thứ Hai đầu tuần theo giờ VN (lưu dạng 00:00 UTC như cột @db.Date)
  private weekStart(): Date {
    const today = vnDate();
    const dow = today.getUTCDay(); // 0 = Chủ nhật
    return addDays(today, -((dow + 6) % 7));
  }

  // (userId, xp) đã sắp xếp: XP giảm dần, bằng nhau thì tài khoản cũ hơn xếp trước.
  // ids = null: bảng chung (bỏ người đã ẩn). ids = [...]: bảng bạn bè (hiện cả người 0 XP).
  private async rows(period: LeaderboardPeriod, ids: number[] | null): Promise<{ userId: number; xp: number }[]> {
    let rows: { userId: number; xp: number }[];
    if (period === 'week') {
      const g = await this.prisma.studyLog.groupBy({
        by: ['userId'],
        where: {
          date: { gte: this.weekStart() },
          ...(ids ? { userId: { in: ids } } : { user: { hideFromLeaderboard: false } }),
        },
        _sum: { xp: true },
      });
      rows = g.map((x) => ({ userId: x.userId, xp: x._sum.xp ?? 0 }));
    } else {
      const u = await this.prisma.user.findMany({
        where: ids ? { id: { in: ids } } : { hideFromLeaderboard: false },
        select: { id: true, xp: true },
      });
      rows = u.map((x) => ({ userId: x.id, xp: x.xp }));
    }

    if (ids) {
      const have = new Set(rows.map((r) => r.userId));
      for (const id of ids) if (!have.has(id)) rows.push({ userId: id, xp: 0 });
    } else {
      rows = rows.filter((r) => r.xp > 0);
    }
    return rows.sort((a, b) => b.xp - a.xp || a.userId - b.userId);
  }

  async get(userId: number, period: LeaderboardPeriod, scope: LeaderboardScope) {
    const ids = scope === 'friends' ? [userId, ...(await this.friends.friendIds(userId))] : null;
    const rows = await this.rows(period, ids);
    const myIdx = rows.findIndex((r) => r.userId === userId);
    const top = rows.slice(0, TOP);

    const users = await this.prisma.user.findMany({
      where: { id: { in: top.map((r) => r.userId) } },
      select: { id: true, name: true, avatar: true, streak: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    let hidden = false;
    if (scope === 'all') {
      const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { hideFromLeaderboard: true } });
      hidden = !!me?.hideFromLeaderboard;
    }

    return {
      period,
      scope,
      weekStart: period === 'week' ? this.weekStart().toISOString().slice(0, 10) : null,
      entries: top.map((r, i) => {
        const u = byId.get(r.userId);
        return {
          rank: i + 1,
          userId: r.userId,
          name: u?.name ?? 'Người dùng',
          avatar: u?.avatar ?? null,
          streak: u?.streak ?? 0,
          xp: r.xp,
          isMe: r.userId === userId,
        };
      }),
      me: { rank: myIdx >= 0 ? myIdx + 1 : null, xp: myIdx >= 0 ? rows[myIdx].xp : 0, hidden },
      total: rows.length,
    };
  }
}
