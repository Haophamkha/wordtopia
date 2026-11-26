import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType, Prisma } from '@prisma/client';
import { vnDate } from '../common/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { PushItem, PushService } from './push.service';

const STREAK_RISK_HOUR = 20; // 20:00 giờ VN
const REVIEW_HOUR = 9; // 9:00 giờ VN
const REVIEW_MIN_DUE = 10;
const HOUR_MS = 60 * 60 * 1000;

// 00:00 giờ VN của hôm nay, tính ra thời điểm UTC thật
const startOfVnDay = () => new Date(vnDate().getTime() - 7 * HOUR_MS);

@Injectable()
export class PushScheduler {
  private readonly logger = new Logger(PushScheduler.name);

  constructor(
    private prisma: PrismaService,
    private push: PushService,
  ) {}

  // Chạy đầu mỗi giờ (giờ VN)
  @Cron('0 * * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async hourly() {
    const hour = (new Date().getUTCHours() + 7) % 24;
    try {
      await this.studyReminders(hour);
      if (hour === STREAK_RISK_HOUR) await this.streakRisk();
      if (hour === REVIEW_HOUR) await this.reviewDue();
    } catch (e) {
      this.logger.error(`Lỗi lịch push: ${String(e)}`);
    }
  }

  // Mỗi loại push chỉ gửi 1 lần/ngày/người: tra lại trong bảng Notification
  private async sentToday(userIds: number[], kind: string): Promise<Set<number>> {
    if (!userIds.length) return new Set();
    const rows = await this.prisma.notification.findMany({
      where: { userId: { in: userIds }, createdAt: { gte: startOfVnDay() }, data: { path: ['pushKind'], equals: kind } },
      select: { userId: true },
    });
    return new Set(rows.map((r) => r.userId));
  }

  private async dispatch(items: PushItem[], type: NotificationType) {
    if (!items.length) return;
    const sent = await this.push.sendBatch(items);
    await this.prisma.notification.createMany({
      data: items.map((i) => ({
        userId: i.userId,
        type,
        title: i.title,
        body: i.body,
        data: i.data as Prisma.InputJsonValue,
      })),
    });
    this.logger.log(`${type}: ${items.length} người, ${sent} thông báo gửi thành công`);
  }

  // Nhắc học theo giờ người dùng chọn; bỏ qua nếu hôm nay đã học
  private async studyReminders(hour: number) {
    const users = await this.prisma.user.findMany({
      where: {
        reminderHour: hour,
        pushTokens: { some: {} },
        OR: [{ lastStudyAt: null }, { lastStudyAt: { lt: startOfVnDay() } }],
      },
      select: { id: true, streak: true },
    });
    const done = await this.sentToday(users.map((u) => u.id), 'REMINDER');
    const items: PushItem[] = users
      .filter((u) => !done.has(u.id))
      .map((u) => ({
        userId: u.id,
        title: u.streak > 0 ? `Giữ chuỗi ${u.streak} ngày nào! 🔥` : 'Đến giờ học từ vựng rồi! 📚',
        body: 'Dành vài phút ôn tập để nhớ từ lâu hơn nhé.',
        data: { pushKind: 'REMINDER', screen: '/(tabs)/home' },
      }));
    await this.dispatch(items, 'SYSTEM');
  }

  // Tối: có streak, hôm qua đã học nhưng hôm nay chưa học
  private async streakRisk() {
    const start = startOfVnDay();
    const users = await this.prisma.user.findMany({
      where: {
        streak: { gt: 0 },
        pushTokens: { some: {} },
        lastStudyAt: { gte: new Date(start.getTime() - 24 * HOUR_MS), lt: start },
      },
      select: { id: true, streak: true },
    });
    const ids = users.map((u) => u.id);
    const [risk, reminded] = await Promise.all([this.sentToday(ids, 'STREAK_RISK'), this.sentToday(ids, 'REMINDER')]);
    const items: PushItem[] = users
      .filter((u) => !risk.has(u.id) && !reminded.has(u.id)) // vừa nhắc học xong thì khỏi nhắc thêm
      .map((u) => ({
        userId: u.id,
        title: `Sắp mất chuỗi ${u.streak} ngày! 🔥`,
        body: 'Học ít nhất 1 từ trước nửa đêm để giữ chuỗi nhé.',
        data: { pushKind: 'STREAK_RISK', screen: '/(tabs)/home' },
      }));
    await this.dispatch(items, 'SYSTEM');
  }

  // Sáng: có từ đến hạn ôn từ REVIEW_MIN_DUE trở lên (đếm theo tiến độ của từng người)
  private async reviewDue() {
    const withTokens = await this.prisma.pushToken.findMany({ distinct: ['userId'], select: { userId: true } });
    const ids = withTokens.map((t) => t.userId);
    if (!ids.length) return;
    const groups = await this.prisma.progress.groupBy({
      by: ['userId'],
      where: { userId: { in: ids }, nextReviewAt: { lte: new Date() } },
      _count: { _all: true },
    });
    const due = groups.filter((g) => g._count._all >= REVIEW_MIN_DUE);
    const done = await this.sentToday(due.map((g) => g.userId), 'REVIEW_DUE');
    const items: PushItem[] = due
      .filter((g) => !done.has(g.userId))
      .map((g) => ({
        userId: g.userId,
        title: `Có ${g._count._all} từ cần ôn 📖`,
        body: 'Ôn ngay để nhớ lâu hơn nhé.',
        data: { pushKind: 'REVIEW_DUE', screen: '/study' },
      }));
    await this.dispatch(items, 'REVIEW_DUE');
  }
}
