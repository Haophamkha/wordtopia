import fs from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
if (!KEY) throw new Error('Thiếu GEMINI_API_KEY trong .env');

const TARGET = { BEGINNER: 400, INTERMEDIATE: 400, ADVANCED: 200 };
const POOL = {
  BEGINNER: [['A1', 500], ['A2', 400]],
  INTERMEDIATE: [['B1', 700]],
  ADVANCED: [['B2', 300], ['C1', 100]],
};
const TOPICS = {
  daily_life: ['Daily Life', 'Cuộc sống hằng ngày', '🏠'],
  food: ['Food & Drink', 'Ăn uống', '🍜'],
  family: ['Family & People', 'Gia đình & con người', '👨‍👩‍👧'],
  body_health: ['Body & Health', 'Cơ thể & sức khỏe', '🩺'],
  school: ['School & Study', 'Trường học', '🎓'],
  work: ['Work & Jobs', 'Công việc', '💼'],
  travel: ['Travel & Places', 'Du lịch & địa điểm', '✈️'],
  transport: ['Transport', 'Giao thông', '🚌'],
  shopping: ['Shopping & Money', 'Mua sắm & tiền bạc', '🛍️'],
  nature: ['Nature & Weather', 'Thiên nhiên & thời tiết', '🌿'],
  time: ['Time & Numbers', 'Thời gian & số', '⏰'],
  feelings: ['Feelings & Personality', 'Cảm xúc & tính cách', '😊'],
  actions: ['Common Actions', 'Hành động thường gặp', '🏃'],
  describing: ['Describing Things', 'Miêu tả', '🎨'],
  tech: ['Technology & Media', 'Công nghệ & truyền thông', '💻'],
  society: ['Society & Culture', 'Xã hội & văn hóa', '🌏'],
  sports: ['Sports & Hobbies', 'Thể thao & sở thích', '⚽'],
  abstract: ['Ideas & Thinking', 'Ý tưởng & suy nghĩ', '💡'],
};
const POS = ['NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PREPOSITION', 'CONJUNCTION', 'PRONOUN', 'INTERJECTION', 'PHRASE', 'OTHER'];
const CACHE_FILE = 'data/enriched.cache.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- đọc LexiCore ----------
const rows = fs.readFileSync('data/LexiCore_5000.csv', 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((l) => {
  const c = l.split(',');
  return { rank: Number(c[1]), word: c[2], cefr: c[4] };
}).filter((r) => /^[a-z]+$/i.test(r.word));

function pool(level) {
  const out = [];
  for (const [cefr, n] of POOL[level]) {
    out.push(...rows.filter((r) => r.cefr === cefr).sort((a, b) => a.rank - b.rank).slice(0, n));
  }
  return out;
}

// ---------- Gemini ----------
async function gemini(prompt) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      }),
    });
    if (res.status === 429 || res.status >= 500) { console.log(`  Gemini ${res.status}, chờ 20s...`); await sleep(20000); continue; }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { console.log('  JSON lỗi, thử lại'); await sleep(3000); }
  }
  throw new Error('Gemini lỗi quá nhiều lần');
}

const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const save = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

async function enrich(words, level) {
  const todo = words.filter((w) => !(w.word in cache));
  for (let i = 0; i < todo.length; i += 40) {
    const batch = todo.slice(i, i + 40);
    console.log(`[${level}] Gemini ${i + 1}-${i + batch.length}/${todo.length}`);
    const prompt =
      'You are preparing an English vocabulary course for Vietnamese learners. ' +
      'For each word below return a JSON array in the same order, objects: ' +
      '{"word","keep","meaning","phonetic","pos","topic","synonym","example","exampleVi"}. Rules: ' +
      'keep=false if the word is a function word (article, auxiliary verb, simple pronoun, preposition or conjunction), a proper noun, an abbreviation, an inflected form of another word, or not useful for learners (other fields may then be empty strings). ' +
      'meaning: short Vietnamese meaning of the most common sense. phonetic: IPA in slashes. ' +
      `pos: one of ${POS.join('|')}. topic: one of ${Object.keys(TOPICS).join('|')}. ` +
      'synonym: one simple English synonym at the same level or easier, or "" if none. ' +
      'example: a simple natural English sentence (5-10 words) containing the exact word. exampleVi: its Vietnamese translation. ' +
      `Level: ${level}. Words: ${batch.map((b) => b.word).join(', ')}`;
    const out = await gemini(prompt);
    for (const o of Array.isArray(out) ? out : []) {
      if (o?.word) cache[String(o.word).toLowerCase()] = o;
    }
    save();
    await sleep(1200);
  }
}

// ---------- Tatoeba ----------
const tat = fs.readFileSync('data/eng-vie.tsv', 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).map((l) => {
  const c = l.split('\t');
  return { id: c[0], en: c[1], vi: c[3] };
}).filter((s) => s.en && s.vi);

const index = new Map();
tat.forEach((s, i) => {
  if (/["\d]/.test(s.en)) return;
  const raw = s.en.match(/[A-Za-z']+/g) || [];
  if (raw.length < 4 || raw.length > 10) return;
  if (raw.slice(1).some((t) => /^[A-Z]/.test(t) && t !== 'I' && !/^I'/.test(t))) return;
  for (const t of new Set(raw.map((x) => x.toLowerCase()))) {
    if (!index.has(t)) index.set(t, []);
    index.get(t).push(i);
  }
});
const usedSent = new Set();
function tatoebaFor(word) {
  const ids = [...(index.get(word) || []), ...(index.get(word + 's') || [])].filter((i) => !usedSent.has(i));
  if (!ids.length) return null;
  const len = (i) => (tat[i].en.match(/[A-Za-z']+/g) || []).length;
  ids.sort((a, b) => Math.abs(len(a) - 7) - Math.abs(len(b) - 7));
  usedSent.add(ids[0]);
  return tat[ids[0]];
}

// ---------- dựng khóa học ----------
const result = { generatedAt: new Date().toISOString(), model: MODEL, levels: {} };
let fromTat = 0, total = 0;

for (const level of ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']) {
  const candidates = pool(level);
  await enrich(candidates, level);
  const kept = [];
  for (const c of candidates) {
    const o = cache[c.word.toLowerCase()];
    if (o && o.keep === true && o.meaning && TOPICS[o.topic]) kept.push({ ...c, o });
    if (kept.length >= TARGET[level]) break;
  }
  console.log(`[${level}] giữ ${kept.length}/${TARGET[level]} từ`);

  // gom theo chủ đề (chủ đề dễ hơn xếp trước)
  const avg = {};
  for (const k of kept) (avg[k.o.topic] ??= []).push(k.rank);
  const order = Object.keys(avg).sort((a, b) => mean(avg[a]) - mean(avg[b]));
  const sorted = order.flatMap((t) => kept.filter((k) => k.o.topic === t).sort((a, b) => a.rank - b.rank));

  const words = sorted.map((k) => {
    const t = tatoebaFor(k.word.toLowerCase());
    if (t) fromTat++;
    total++;
    return {
      term: k.word,
      meaning: k.o.meaning,
      phonetic: k.o.phonetic || null,
      partOfSpeech: POS.includes(String(k.o.pos).toUpperCase()) ? String(k.o.pos).toUpperCase() : 'OTHER',
      example: t ? t.en : k.o.example || null,
      exampleMeaning: t ? t.vi : k.o.exampleVi || null,
      exampleSource: t ? `tatoeba:${t.id}` : 'ai',
      synonym: k.o.synonym || null,
      topic: k.o.topic,
    };
  });

  const units = [];
  const seenTitle = {};
  for (let u = 0; u * 25 < words.length; u++) {
    const uw = words.slice(u * 25, u * 25 + 25);
    const cnt = {};
    uw.forEach((w) => (cnt[w.topic] = (cnt[w.topic] || 0) + 1));
    const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    const [title, titleVi, emoji] = TOPICS[main];
    seenTitle[title] = (seenTitle[title] || 0) + 1;
    const suffix = seenTitle[title] > 1 ? ` ${seenTitle[title]}` : '';
    const lessons = [];
    for (let l = 0; l * 5 < uw.length; l++) {
      lessons.push({
        order: l + 1,
        title: `${title}${suffix} - ${l + 1}`,
        words: uw.slice(l * 5, l * 5 + 5).map(({ topic, ...w }) => w),
      });
    }
    units.push({ order: u + 1, title: title + suffix, titleVi, emoji, lessons });
  }
  result.levels[level] = units;
}

function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }

fs.writeFileSync('data/content.preview.json', JSON.stringify(result, null, 2));
const txt = [];
for (const [lv, units] of Object.entries(result.levels)) {
  txt.push(`\n=== ${lv} ===`);
  for (const u of units) {
    txt.push(`\n# Unit ${u.order}: ${u.title} (${u.titleVi}) ${u.emoji}`);
    for (const l of u.lessons) {
      txt.push(`  Lesson ${l.order}: ` + l.words.map((w) => `${w.term}=${w.meaning}`).join(' | '));
    }
  }
}
fs.writeFileSync('data/content.preview.txt', txt.join('\n'));

const lessonCount = Object.values(result.levels).reduce((s, us) => s + us.reduce((a, u) => a + u.lessons.length, 0), 0);
console.log(`\nXong: ${lessonCount} lesson, ${total} từ, ${fromTat} câu ví dụ từ Tatoeba.`);
console.log('Xem: data\\content.preview.txt và data\\content.preview.json');