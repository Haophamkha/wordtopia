import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const GT = 'Grammar: To be';

const Q = (question: string, options: string[], answer: string, explanationVi: string) => ({
  type: 'grammar_choice',
  payload: { question, options, answer },
  explanationVi,
});

// Cho user đã học qua phía sau coi như đã hoàn thành bài mới chèn vào
async function grandfather(lessonId: number, unitOrder: number) {
  const rows = await p.lessonProgress.findMany({
    where: {
      completedAt: { not: null },
      lesson: {
        unit: {
          OR: [{ level: 'BEGINNER', order: { gt: unitOrder } }, { level: { in: ['INTERMEDIATE', 'ADVANCED'] } }],
        },
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  if (!rows.length) return 0;
  const r = await p.lessonProgress.createMany({
    data: rows.map((x) => ({ userId: x.userId, lessonId, stars: 0, bestScore: 0, attempts: 0, completedAt: new Date() })),
    skipDuplicates: true,
  });
  return r.count;
}

async function main() {
  // 1. Đặt unit ngữ pháp làm chặng số 2 của BEGINNER
  const res = await p.$transaction(
    async (tx) => {
      let g = await tx.unit.findFirst({ where: { level: 'BEGINNER', title: GT } });
      if (g && g.order === 2) return { g, changed: false, created: false };
      const others = await tx.unit.findMany({
        where: { level: 'BEGINNER', ...(g ? { id: { not: g.id } } : {}) },
        orderBy: { order: 'asc' },
      });
      await tx.unit.updateMany({ where: { level: 'BEGINNER' }, data: { order: { increment: 1000 } } });
      const created = !g;
      if (!g) {
        g = await tx.unit.create({
          data: { level: 'BEGINNER', order: 9000, title: GT, titleVi: 'Ngữ pháp: động từ to be', emoji: '📘' },
        });
      }
      const ids = [...others.slice(0, 1).map((u) => u.id), g.id, ...others.slice(1).map((u) => u.id)];
      for (let i = 0; i < ids.length; i++) {
        await tx.unit.update({ where: { id: ids[i] }, data: { order: i + 1 } });
      }
      return { g, changed: true, created };
    },
    { timeout: 60000, maxWait: 20000 },
  );

  // 2. Bài ngữ pháp + câu hỏi (chỉ khi unit mới tạo)
  let grammarLessonId: number | undefined;
  if (res.created) {
    const lesson = await p.lesson.create({
      data: {
        unitId: res.g.id,
        order: 1,
        title: 'Am / is / are',
        type: 'GRAMMAR',
        noteMd:
          '**to be** nghĩa là "là, thì, ở".\n\nI **am** · He/She/It **is** · You/We/They **are**\n\nVí dụ: She **is** a teacher. (Cô ấy là giáo viên.)',
      },
    });
    grammarLessonId = lesson.id;
    const items = [
      Q('I ___ a student.', ['am', 'is', 'are'], 'am', 'Chủ ngữ "I" luôn đi với "am".'),
      Q('She ___ my sister.', ['am', 'is', 'are'], 'is', 'He/She/It đi với "is".'),
      Q('They ___ at home.', ['am', 'is', 'are'], 'are', 'You/We/They đi với "are".'),
      Q('Chọn câu đúng.', ['He are tall.', 'He is tall.', 'He am tall.'], 'He is tall.', '"He" đi với "is".'),
    ];
    await p.exercise.createMany({ data: items.map((e, i) => ({ lessonId: lesson.id, order: i + 1, ...e })) });
    console.log('Đã tạo unit ngữ pháp (chặng 2)');
  } else {
    const l = await p.lesson.findFirst({ where: { unitId: res.g.id, type: 'GRAMMAR' } });
    grammarLessonId = l?.id;
  }
  if (res.changed && grammarLessonId) {
    console.log('Bù tiến độ bài ngữ pháp cho', await grandfather(grammarLessonId, 2), 'user');
  }

  // 3. Checkpoint cuối chặng 1
  const u1 = await p.unit.findFirst({ where: { level: 'BEGINNER', order: 1 }, include: { lessons: true } });
  if (u1 && !u1.lessons.some((l) => l.type === 'CHECKPOINT')) {
    const max = Math.max(0, ...u1.lessons.map((l) => l.order));
    const cp = await p.lesson.create({
      data: { unitId: u1.id, order: max + 1, title: 'Kiểm tra chặng 1', type: 'CHECKPOINT' },
    });
    console.log('Đã tạo checkpoint chặng 1; bù tiến độ cho', await grandfather(cp.id, 1), 'user');
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());