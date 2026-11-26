import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.unit.count()) > 0) {
    console.log('Đã có dữ liệu lộ trình, bỏ qua.');
    return;
  }
  const data = JSON.parse(readFileSync(join(__dirname, 'path-data.json'), 'utf8'));
  for (const u of data) {
    await prisma.unit.create({
      data: {
        level: u.level, order: u.order, title: u.title, titleVi: u.titleVi, emoji: u.emoji,
        lessons: {
          create: u.lessons.map((l: any) => ({
            order: l.order, title: l.title, words: { create: l.words },
          })),
        },
      },
    });
  }
  console.log('Seed lộ trình xong:', data.length, 'unit');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
