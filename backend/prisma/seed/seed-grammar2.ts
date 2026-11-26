import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const Q = (question: string, options: string[], answer: string, explanationVi: string) => ({
  type: 'grammar_choice',
  payload: { question, options, answer },
  explanationVi,
});

const UNITS = [
  {
    pos: 6, title: 'Grammar: A / An & Plurals', titleVi: 'Ngữ pháp: a/an và số nhiều', emoji: '📗',
    lesson: 'A / an & plurals',
    note: '**a** dùng trước phụ âm, **an** dùng trước nguyên âm (a, e, i, o, u).\n\na book · an apple · an hour\n\nSố nhiều: thêm **-s** (cats), **-es** sau s/x/ch/sh (boxes). Bất quy tắc: man → men, child → children.',
    items: [
      Q('I have ___ apple.', ['a', 'an'], 'an', '"apple" bắt đầu bằng nguyên âm nên dùng "an".'),
      Q('She is ___ teacher.', ['a', 'an'], 'a', '"teacher" bắt đầu bằng phụ âm nên dùng "a".'),
      Q('He waits for ___ hour.', ['a', 'an'], 'an', '"hour" đọc là /aʊə/ (âm h câm) nên dùng "an".'),
      Q('Số nhiều của "box" là gì?', ['boxs', 'boxes', 'boxies'], 'boxes', 'Từ tận cùng x thêm -es.'),
      Q('Số nhiều của "child" là gì?', ['childs', 'childes', 'children'], 'children', 'Child là danh từ bất quy tắc: children.'),
      Q('Chọn câu đúng.', ['I have two cat.', 'I have two cats.', 'I have two cates.'], 'I have two cats.', 'Sau "two" danh từ phải ở dạng số nhiều.'),
    ],
  },
  {
    pos: 10, title: 'Grammar: Present Simple', titleVi: 'Ngữ pháp: thì hiện tại đơn', emoji: '📙',
    lesson: 'Present Simple',
    note: 'Hiện tại đơn dùng cho thói quen và sự thật.\n\nI/You/We/They + **động từ**: I **work**.\nHe/She/It + **động từ + s/es**: She **works**.\n\nPhủ định: **do not (don\'t)** / **does not (doesn\'t)** + động từ gốc.',
    items: [
      Q('She ___ English every day.', ['study', 'studies', 'studying'], 'studies', 'He/She/It thêm -s/-es; study đổi y thành -ies.'),
      Q('They ___ football on Sunday.', ['plays', 'play', 'playing'], 'play', 'They đi với động từ nguyên mẫu, không thêm s.'),
      Q('He ___ like coffee.', ['don\'t', 'doesn\'t', 'isn\'t'], 'doesn\'t', 'He/She/It dùng "doesn\'t" để phủ định.'),
      Q('I ___ at 7 a.m.', ['wake up', 'wakes up', 'waking up'], 'wake up', 'Chủ ngữ I dùng động từ nguyên mẫu.'),
      Q('Chọn câu đúng.', ['She go to school.', 'She goes to school.', 'She gos to school.'], 'She goes to school.', 'Go thêm -es khi đi với He/She/It.'),
      Q('___ you like music?', ['Do', 'Does', 'Are'], 'Do', 'Câu hỏi với You dùng "Do".'),
    ],
  },
  {
    pos: 14, title: 'Grammar: There is / There are', titleVi: 'Ngữ pháp: there is / there are', emoji: '📕',
    lesson: 'There is / There are',
    note: '**There is** + danh từ số ít/không đếm được: There **is** a book.\n**There are** + danh từ số nhiều: There **are** three books.\n\nPhủ định: There **isn\'t** / There **aren\'t**. Câu hỏi: **Is** there...? / **Are** there...?',
    items: [
      Q('There ___ a cat in the room.', ['is', 'are'], 'is', '"a cat" là số ít nên dùng "is".'),
      Q('There ___ five students here.', ['is', 'are'], 'are', '"five students" là số nhiều nên dùng "are".'),
      Q('There ___ any milk.', ['isn\'t', 'aren\'t'], 'isn\'t', '"milk" không đếm được nên dùng "isn\'t".'),
      Q('___ there a bank near here?', ['Is', 'Are'], 'Is', '"a bank" là số ít nên dùng "Is".'),
      Q('Chọn câu đúng.', ['There is two dogs.', 'There are two dogs.', 'There be two dogs.'], 'There are two dogs.', '"two dogs" là số nhiều nên dùng "There are".'),
      Q('Dịch: "Có một quả táo trên bàn."', ['There are an apple on the table.', 'There is an apple on the table.', 'It is an apple on the table.'], 'There is an apple on the table.', 'Số ít dùng "There is".'),
    ],
  },
  {
    pos: 18, title: 'Grammar: This / That', titleVi: 'Ngữ pháp: this/that/these/those', emoji: '📓',
    lesson: 'This / that / these / those',
    note: '**This** (cái này) và **these** (những cái này): ở gần.\n**That** (cái đó) và **those** (những cái đó): ở xa.\n\nSố ít: this/that. Số nhiều: these/those.\n\nThis **is** a pen. These **are** pens.',
    items: [
      Q('___ is my book. (ở gần, số ít)', ['This', 'These', 'Those'], 'This', 'Gần + số ít dùng "This".'),
      Q('___ are my shoes. (ở gần, số nhiều)', ['This', 'These', 'That'], 'These', 'Gần + số nhiều dùng "These".'),
      Q('Look at ___ bird over there.', ['this', 'these', 'that'], 'that', '"over there" là ở xa, số ít nên dùng "that".'),
      Q('___ are my parents. (ở xa)', ['That', 'Those', 'This'], 'Those', 'Xa + số nhiều dùng "Those".'),
      Q('Chọn câu đúng.', ['These is a pen.', 'This are pens.', 'These are pens.'], 'These are pens.', 'These đi với "are" và danh từ số nhiều.'),
      Q('Dịch: "Đó là xe của tôi."', ['That is my car.', 'Those is my car.', 'This are my car.'], 'That is my car.', 'Số ít ở xa dùng "That is".'),
    ],
  },
];

async function main() {
  // 1. tạo unit + lesson + exercise (bỏ qua unit đã có)
  const newIds: { id: number; pos: number; lessonId: number | null }[] = [];
  for (const d of UNITS) {
    let unit = await p.unit.findFirst({ where: { level: 'BEGINNER', title: d.title } });
    let lessonId: number | null = null;
    if (!unit) {
      unit = await p.unit.create({
        data: { level: 'BEGINNER', order: 9000 + d.pos, title: d.title, titleVi: d.titleVi, emoji: d.emoji },
      });
      const lesson = await p.lesson.create({
        data: { unitId: unit.id, order: 1, title: d.lesson, type: 'GRAMMAR', noteMd: d.note },
      });
      lessonId = lesson.id;
      await p.exercise.createMany({
        data: d.items.map((it, i) => ({
          lessonId: lesson.id, order: i + 1, type: it.type, payload: it.payload, explanationVi: it.explanationVi,
        })),
      });
      console.log('Đã tạo', d.title);
    }
    newIds.push({ id: unit.id, pos: d.pos, lessonId });
  }

  // 2. xếp lại thứ tự BEGINNER: unit mới vào đúng vị trí
  const all = await p.unit.findMany({ where: { level: 'BEGINNER' }, orderBy: { order: 'asc' } });
  const newSet = new Set(newIds.map((x) => x.id));
  const rest = all.filter((x) => !newSet.has(x.id));
  const finalIds = [...rest.map((x) => x.id)];
  for (const n of [...newIds].sort((a, b) => a.pos - b.pos)) {
    finalIds.splice(Math.min(n.pos - 1, finalIds.length), 0, n.id);
  }
  await p.$transaction(
    async (tx) => {
      await tx.unit.updateMany({ where: { level: 'BEGINNER' }, data: { order: { increment: 1000 } } });
      for (let i = 0; i < finalIds.length; i++) {
        await tx.unit.update({ where: { id: finalIds[i] }, data: { order: i + 1 } });
      }
    },
    { timeout: 60000, maxWait: 20000 },
  );

  // 3. Checkpoint ở unit từ vựng đứng ngay trước mỗi unit ngữ pháp mới
  for (const n of newIds) {
    const idx = finalIds.indexOf(n.id);
    const prevId = finalIds[idx - 1];
    if (!prevId) continue;
    const lessons = await p.lesson.findMany({ where: { unitId: prevId }, orderBy: { order: 'asc' } });
    if (!lessons.length || lessons.some((l) => l.type === 'CHECKPOINT' || l.type === 'GRAMMAR')) continue;
    const cp = await p.lesson.create({
      data: { unitId: prevId, order: lessons[lessons.length - 1].order + 1, title: 'Checkpoint', type: 'CHECKPOINT' },
    });
    console.log('Đã tạo Checkpoint cho unit', prevId);
    await grandfather(cp.id, idx);
  }

  // 4. user đã học qua phía sau coi như đã xong các bài ngữ pháp mới
  for (const n of newIds) if (n.lessonId) await grandfather(n.lessonId, finalIds.indexOf(n.id) + 1);
  console.log('Xong.');
}

async function grandfather(lessonId: number, unitOrder: number) {
  const rows = await p.lessonProgress.findMany({
    where: {
      completedAt: { not: null },
      lesson: {
        unit: { OR: [{ level: 'BEGINNER', order: { gt: unitOrder } }, { level: { in: ['INTERMEDIATE', 'ADVANCED'] } }] },
      },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  if (!rows.length) return;
  await p.lessonProgress.createMany({
    data: rows.map((x) => ({ userId: x.userId, lessonId, stars: 0, bestScore: 0, attempts: 0, completedAt: new Date() })),
    skipDuplicates: true,
  });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());