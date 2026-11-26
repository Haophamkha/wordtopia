import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Chạy lại nhiều lần được: upsert theo (level, order) của unit và (unitId, order) của lesson.
async function main() {
  const data = JSON.parse(readFileSync(join(__dirname, 'video-data.json'), 'utf8'));
  let n = 0;
  for (const u of data) {
    const unit = await prisma.unit.upsert({
      where: { level_order: { level: u.level, order: u.order } },
      update: { title: u.title, titleVi: u.titleVi, emoji: u.emoji },
      create: { level: u.level, order: u.order, title: u.title, titleVi: u.titleVi, emoji: u.emoji },
    });
    for (const l of u.lessons) {
      if (!l.mediaUrl || String(l.mediaUrl).includes('PASTE')) {
        console.warn(`Bỏ qua "${l.title}": chưa điền mediaUrl`);
        continue;
      }
      const lesson = await prisma.lesson.upsert({
        where: { unitId_order: { unitId: unit.id, order: l.order } },
        update: { title: l.title, type: 'VIDEO', noteMd: l.noteMd ?? null },
        create: { unitId: unit.id, order: l.order, title: l.title, type: 'VIDEO', noteMd: l.noteMd ?? null },
      });
      await prisma.exercise.deleteMany({ where: { lessonId: lesson.id } });
      // order 1 = clip; order 2.. = câu hỏi trắc nghiệm sau clip (dùng lại loại bài grammar_choice)
      const rows: any[] = [{ order: 1, type: 'video', mediaUrl: l.mediaUrl, payload: { subtitles: l.subtitles } }];
      (l.quiz ?? []).forEach((q: any, i: number) => {
        if (!q.options.includes(q.answer)) throw new Error(`Câu hỏi "${q.question}": answer không nằm trong options`);
        rows.push({
          order: i + 2,
          type: 'grammar_choice',
          mediaUrl: null,
          payload: { question: q.question, options: q.options, answer: q.answer },
          explanationVi: q.explanationVi ?? null,
        });
      });
      await prisma.exercise.createMany({ data: rows.map((r) => ({ lessonId: lesson.id, ...r })) });
      n++;
    }
  }
  console.log('Seed video xong:', n, 'bài');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
