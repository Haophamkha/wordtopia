import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordDto, UpdateWordDto } from './dto/word.dto';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, deckId: number, dto: CreateWordDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy bộ từ');
    if (deck.ownerId !== userId) throw new ForbiddenException('Bạn không có quyền thêm từ vào bộ này');
    return this.prisma.word.create({ data: { ...dto, deckId } });
  }

  async update(userId: number, id: number, dto: UpdateWordDto) {
    await this.assertOwner(userId, id);
    return this.prisma.word.update({ where: { id }, data: dto });
  }

  async remove(userId: number, id: number) {
    await this.assertOwner(userId, id);
    await this.prisma.word.delete({ where: { id } });
    return { deleted: true };
  }

  async favorites(userId: number) {
    const rows = await this.prisma.progress.findMany({
      where: { userId, isFavorite: true },
      include: { word: true },
      orderBy: { id: 'desc' },
    });
    return rows.map((r) => ({ ...r.word, isFavorite: true }));
  }

  async toggleFavorite(userId: number, wordId: number) {
    const word = await this.prisma.word.findUnique({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Không tìm thấy từ');

    const key = { userId_wordId: { userId, wordId } };
    const current = await this.prisma.progress.findUnique({ where: key });
    const isFavorite = !(current?.isFavorite ?? false);

    await this.prisma.progress.upsert({
      where: key,
      update: { isFavorite },
      create: { userId, wordId, isFavorite },
    });
    return { wordId, isFavorite };
  }

  search(userId: number, q?: string) {
    if (!q || !q.trim()) return [];
    return this.prisma.word.findMany({
      where: {
        deck: { OR: [{ isPublic: true }, { ownerId: userId }] },
        OR: [
          { term: { contains: q, mode: 'insensitive' } },
          { meaning: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { deck: { select: { id: true, title: true } } },
      take: 30,
    });
  }

  private async assertOwner(userId: number, id: number) {
    const word = await this.prisma.word.findUnique({ where: { id }, include: { deck: true } });
    if (!word) throw new NotFoundException('Không tìm thấy từ');
    if (word.deck.ownerId !== userId) throw new ForbiddenException('Bạn không có quyền sửa từ này');
  }
}