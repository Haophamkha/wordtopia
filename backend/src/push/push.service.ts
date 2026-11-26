import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const EXPO_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushItem {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface Ticket {
  status: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  register(userId: number, token: string, platform?: string) {
    // Token là duy nhất: đăng nhập tài khoản khác trên cùng máy thì token chuyển sang tài khoản đó.
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async unregister(userId: number, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
    return { ok: true };
  }

  async setReminder(userId: number, hour: number | null) {
    await this.prisma.user.update({ where: { id: userId }, data: { reminderHour: hour } });
    return { hour };
  }

  // Gửi qua Expo Push API theo lô 100, tự xóa token chết. Trả về số thông báo gửi thành công.
  async sendBatch(items: PushItem[]): Promise<number> {
    if (!items.length) return 0;
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: [...new Set(items.map((i) => i.userId))] } },
      select: { userId: true, token: true },
    });
    const byUser = new Map<number, string[]>();
    for (const t of tokens) byUser.set(t.userId, [...(byUser.get(t.userId) ?? []), t.token]);

    const msgs: { to: string; title: string; body: string; data: Record<string, unknown>; sound: 'default'; channelId: string }[] = [];
    for (const it of items) {
      for (const to of byUser.get(it.userId) ?? []) {
        msgs.push({ to, title: it.title, body: it.body, data: it.data ?? {}, sound: 'default', channelId: 'reminder' });
      }
    }

    const access = this.config.get<string>('EXPO_ACCESS_TOKEN');
    let sent = 0;
    const dead: string[] = [];
    for (let i = 0; i < msgs.length; i += 100) {
      const chunk = msgs.slice(i, i + 100);
      try {
        const res = await fetch(EXPO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
          },
          body: JSON.stringify(chunk),
        });
        if (!res.ok) {
          this.logger.warn(`Expo push ${res.status}: ${await res.text()}`);
          continue;
        }
        const json = (await res.json()) as { data?: Ticket[] };
        (json.data ?? []).forEach((t, k) => {
          if (t.status === 'ok') sent++;
          else if (t.details?.error === 'DeviceNotRegistered') dead.push(chunk[k].to);
          else this.logger.warn(`Push lỗi: ${t.message ?? t.details?.error ?? 'không rõ'}`);
        });
      } catch (e) {
        this.logger.warn(`Gọi Expo push lỗi: ${String(e)}`);
      }
    }
    if (dead.length) await this.prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
    return sent;
  }

  // Gửi thử cho chính người dùng (kiểm tra token đã đăng ký đúng chưa)
  async test(userId: number) {
    const tokens = await this.prisma.pushToken.count({ where: { userId } });
    const sent = await this.sendBatch([
      { userId, title: 'Wordtopia', body: 'Thông báo thử nghiệm: push hoạt động tốt ✅', data: { screen: '/(tabs)/home' } },
    ]);
    return { tokens, sent };
  }
}
