import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const data = JSON.parse(fs.readFileSync('data/content.preview.json', 'utf8'));
const reset = process.argv.includes('--reset');

if ((await prisma.unit.count()) > 0) {
  if (!reset) {
    console.log('DB đã có nội dung. Chạy lại với --reset để xóa và nạp lại.');
    process.exit(0);
  }
  await prisma.unit.deleteMany();
  console.log('Đã xóa nội dung cũ.');
}

let lessons = 0, words = 0;
for (const [level, units] of Object.entries(data.levels)) {
  for (const u of units) {
    await prisma.unit.create({
      data: {
        level, order: u.order, title: u.title, titleVi: u.titleVi, emoji: u.emoji,
        lessons: {
          create: u.lessons.map((l) => ({
            order: l.order,
            title: l.title,
            words: { create: l.words },
          })),
        },
      },
    });
    lessons += u.lessons.length;
    words += u.lessons.reduce((s, l) => s + l.words.length, 0);
  }
  console.log(`${level}: xong`);
}
console.log(`Xong: ${lessons} lesson, ${words} từ.`);
await prisma.$disconnect();