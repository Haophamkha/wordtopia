import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto, UpdateDeckDto } from './dto/deck.dto';

@Injectable()
export class DecksService {
  constructor(private prisma: PrismaService) {}

  list(userId: number, q?: string, topic?: string) {
    return this.prisma.deck.findMany({
      where: {
        OR: [{ isPublic: true }, { ownerId: userId }],
        ...(topic ? { topic } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: { _count: { select: { words: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  mine(userId: number) {
    return this.prisma.deck.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { words: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: number, userId: number) {
    const deck = await this.prisma.deck.findUnique({
      where: { id },
      include: {
        words: {
          orderBy: { id: 'asc' },
          include: { progress: { where: { userId } } },
        },
      },
    });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    if (!deck.isPublic && deck.ownerId !== userId) throw new ForbiddenException();

    return {
      ...deck,
      words: deck.words.map(({ progress, ...w }) => ({
        ...w,
        isFavorite: progress[0]?.isFavorite ?? false,
        level: progress[0]?.level ?? 0,
      })),
    };
  }

  create(userId: number, dto: CreateDeckDto) {
    return this.prisma.deck.create({ data: { ...dto, ownerId: userId } });
  }

  async update(id: number, userId: number, dto: UpdateDeckDto) {
    await this.assertOwner(id, userId);
    return this.prisma.deck.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    await this.assertOwner(id, userId);
    await this.prisma.deck.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertOwner(id: number, userId: number) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    if (deck.ownerId !== userId) throw new ForbiddenException('Bạn không có quyền sửa bộ từ này');
  }
}