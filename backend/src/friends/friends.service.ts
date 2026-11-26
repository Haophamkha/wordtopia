import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { BadgesService } from '../badges/badges.service';
import { PrismaService } from '../prisma/prisma.service';

// Bỏ các ký tự dễ nhầm (0/O, 1/I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () =>
  'WT-' + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

const publicUser = { id: true, name: true, avatar: true, streak: true, xp: true } as const;

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService, private badges: BadgesService) {}

  // Tạo mã bạn bè khi cần (lần đầu mở màn Bạn bè), nên không phải sửa luồng đăng ký.
  async ensureCode(userId: number): Promise<string> {
    const cur = await this.prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } });
    if (cur?.friendCode) return cur.friendCode;
    for (let i = 0; i < 8; i++) {
      try {
        await this.prisma.user.updateMany({ where: { id: userId, friendCode: null }, data: { friendCode: makeCode() } });
        break;
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e; // trùng mã thì thử mã khác
      }
    }
    const after = await this.prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } });
    if (!after?.friendCode) throw new BadRequestException('Không tạo được mã bạn bè, hãy thử lại');
    return after.friendCode;
  }

  async friendIds(userId: number): Promise<number[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
  }

  private notify(userId: number, title: string, body: string, data: Record<string, unknown>) {
    return this.prisma.notification
      .create({ data: { userId, type: 'SYSTEM', title, body, data: data as any } })
      .catch(() => undefined);
  }

  async list(userId: number) {
    const code = await this.ensureCode(userId);
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { hideFromLeaderboard: true } });
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: { requester: { select: publicUser }, addressee: { select: publicUser } },
      orderBy: { createdAt: 'desc' },
    });

    const friends: any[] = [];
    const incoming: any[] = [];
    const outgoing: any[] = [];
    for (const r of rows) {
      const other = r.requesterId === userId ? r.addressee : r.requester;
      const item = { id: r.id, userId: other.id, name: other.name, avatar: other.avatar, streak: other.streak, xp: other.xp };
      if (r.status === 'ACCEPTED') friends.push(item);
      else if (r.addresseeId === userId) incoming.push(item);
      else outgoing.push(item);
    }
    friends.sort((a, b) => b.xp - a.xp);
    return { code, hide: me?.hideFromLeaderboard ?? false, friends, incoming, outgoing };
  }

  async request(userId: number, rawCode?: string) {
    let code = (rawCode ?? '').trim().toUpperCase().replace(/\s+/g, '');
    if (!code) throw new BadRequestException('Hãy nhập mã bạn bè');
    code = 'WT-' + code.replace(/^WT-?/, '');

    const target = await this.prisma.user.findUnique({ where: { friendCode: code }, select: { id: true, name: true } });
    if (!target) throw new NotFoundException('Không tìm thấy mã bạn bè này');
    if (target.id === userId) throw new BadRequestException('Đó là mã của chính bạn');

    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') throw new BadRequestException('Hai bạn đã là bạn bè');
      if (existing.requesterId === userId) throw new BadRequestException('Bạn đã gửi lời mời cho người này rồi');
      // Người kia đã mời mình trước: bấm kết bạn nghĩa là chấp nhận luôn
      await this.prisma.friendship.update({ where: { id: existing.id }, data: { status: 'ACCEPTED' } });
      await this.notify(target.id, 'Lời mời được chấp nhận', `${me?.name ?? 'Một người bạn'} đã chấp nhận lời mời kết bạn của bạn.`, { kind: 'FRIEND_ACCEPTED', userId });
      await this.badges.evaluate(userId);
      await this.badges.evaluate(target.id);
      return { status: 'accepted' as const, name: target.name };
    }

    await this.prisma.friendship.create({ data: { requesterId: userId, addresseeId: target.id } });
    await this.notify(target.id, 'Lời mời kết bạn mới', `${me?.name ?? 'Ai đó'} muốn kết bạn với bạn. Mở màn Bạn bè để chấp nhận.`, { kind: 'FRIEND_REQUEST', userId });
    return { status: 'sent' as const, name: target.name };
  }

  async accept(userId: number, id: number) {
    const r = await this.prisma.friendship.findUnique({ where: { id } });
    if (!r || r.addresseeId !== userId || r.status !== 'PENDING') throw new NotFoundException('Không tìm thấy lời mời');
    await this.prisma.friendship.update({ where: { id }, data: { status: 'ACCEPTED' } });
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await this.notify(r.requesterId, 'Lời mời được chấp nhận', `${me?.name ?? 'Một người bạn'} đã chấp nhận lời mời kết bạn của bạn.`, { kind: 'FRIEND_ACCEPTED', userId });
    await this.badges.evaluate(userId);
    await this.badges.evaluate(r.requesterId);
    return { ok: true };
  }

  // Từ chối (người nhận) hoặc hủy lời mời đã gửi (người gửi)
  async cancel(userId: number, id: number) {
    const r = await this.prisma.friendship.findUnique({ where: { id } });
    if (!r || r.status !== 'PENDING' || (r.requesterId !== userId && r.addresseeId !== userId)) {
      throw new NotFoundException('Không tìm thấy lời mời');
    }
    await this.prisma.friendship.delete({ where: { id } });
    return { ok: true };
  }

  async remove(userId: number, otherId: number) {
    await this.prisma.friendship.deleteMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId, addresseeId: otherId },
          { requesterId: otherId, addresseeId: userId },
        ],
      },
    });
    return { ok: true };
  }

  async setHide(userId: number, hide: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { hideFromLeaderboard: !!hide } });
    return { hide: !!hide };
  }
}
