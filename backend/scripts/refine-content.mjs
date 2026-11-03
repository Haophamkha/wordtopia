import fs from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
if (!KEY) throw new Error('Thiếu GEMINI_API_KEY');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gemini(prompt) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
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
const ORDER = {
  BEGINNER: ['family', 'daily_life', 'food', 'body_health', 'time', 'describing', 'school', 'actions', 'nature', 'shopping', 'travel', 'transport', 'work', 'feelings', 'sports', 'tech', 'society', 'abstract'],
  INTERMEDIATE: ['daily_life', 'work', 'travel', 'shopping', 'feelings', 'body_health', 'school', 'food', 'transport', 'nature', 'society', 'tech', 'sports', 'actions', 'describing', 'abstract', 'family', 'time'],
  ADVANCED: ['abstract', 'society', 'work', 'tech', 'feelings', 'nature', 'describing', 'actions', 'body_health', 'school', 'shopping', 'travel', 'transport', 'food', 'sports', 'family', 'daily_life', 'time'],
};

const cache = JSON.parse(fs.readFileSync('data/enriched.cache.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('data/content.preview.json', 'utf8'));
fs.copyFileSync('data/content.preview.json', 'data/content.preview.v1.json');

const flat = {};
for (const [lv, units] of Object.entries(data.levels)) {
  flat[lv] = units.flatMap((u) => u.lessons).flatMap((l) => l.words);
}

// (b) bỏ chính tả Anh trùng chính tả Mỹ
const all = new Set(Object.values(flat).flat().map((w) => w.term.toLowerCase()));
const isUk = (t) => t.length >= 6 && ((t.endsWith('our') && all.has(t.slice(0, -3) + 'or')) || (t.endsWith('tre') && all.has(t.slice(0, -2) + 'er')));
let removedUk = 0;
for (const lv of Object.keys(flat)) {
  flat[lv] = flat[lv].filter((w) => { const bad = isUk(w.term.toLowerCase()); if (bad) removedUk++; return !bad; });
}

// (a) kiểm tra câu Tatoeba
const tatWords = Object.values(flat).flat().filter((w) => String(w.exampleSource).startsWith('tatoeba'));
let replaced = 0;
for (let i = 0; i < tatWords.length; i += 40) {
  const batch = tatWords.slice(i, i + 40);
  console.log(`Kiểm tra câu ${i + 1}-${i + batch.length}/${tatWords.length}`);
  const out = await gemini(
    'For each item decide whether the English sentence uses the given word with the SAME sense and part of speech as given (pos and Vietnamese meaning). ' +
    'Return a JSON array of objects {"i": number, "ok": boolean}, one per item. Items: ' +
    JSON.stringify(batch.map((w, k) => ({ i: k, word: w.term, pos: w.partOfSpeech, meaning: w.meaning, sentence: w.example }))),
  );
  const ok = new Map((Array.isArray(out) ? out : []).map((o) => [o.i, o.ok]));
  batch.forEach((w, k) => {
    if (ok.get(k) === true) return;
    const c = cache[w.term.toLowerCase()];
    replaced++;
    if (c?.example) { w.example = c.example; w.exampleMeaning = c.exampleVi || null; w.exampleSource = 'ai'; }
    else { w.example = null; w.exampleMeaning = null; w.exampleSource = null; }
  });
  await sleep(1200);
}

// (c) dựng lại: mỗi unit một chủ đề
function lessonize(ws) {
  const n = Math.max(1, Math.round(ws.length / 5));
  const base = Math.floor(ws.length / n), extra = ws.length % n;
  const out = []; let p = 0;
  for (let i = 0; i < n; i++) { const sz = base + (i < extra ? 1 : 0); out.push(ws.slice(p, p + sz)); p += sz; }
  return out;
}

const result = { generatedAt: new Date().toISOString(), model: MODEL, levels: {} };
const txt = [];
let totalLessons = 0, totalWords = 0;
for (const level of ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']) {
  const byTopic = {};
  for (const w of flat[level]) {
    let t = cache[w.term.toLowerCase()]?.topic;
    if (!TOPICS[t]) t = 'abstract';
    (byTopic[t] ??= []).push(w);
  }
  const order = [...ORDER[level].filter((t) => byTopic[t]), ...Object.keys(byTopic).filter((t) => !ORDER[level].includes(t))];
  const groups = []; const small = [];
  for (const t of order) {
    const arr = byTopic[t];
    if (arr.length < 8) { small.push(...arr); continue; }
    const parts = Math.ceil(arr.length / 30);
    const size = Math.ceil(arr.length / parts);
    for (let p = 0; p < parts; p++) groups.push({ t, part: p + 1, parts, words: arr.slice(p * size, (p + 1) * size) });
  }
  if (small.length) groups.push({ t: null, words: small });

  const units = [];
  txt.push(`\n=== ${level} ===`);
  groups.forEach((g, idx) => {
    const [title0, titleVi, emoji] = g.t ? TOPICS[g.t] : ['More Words', 'Từ vựng bổ sung', '📚'];
    const title = g.t && g.parts > 1 ? `${title0} ${g.part}` : title0;
    const lessons = lessonize(g.words).map((ws, li) => ({ order: li + 1, title: `${title} - ${li + 1}`, words: ws }));
    units.push({ order: idx + 1, title, titleVi, emoji, lessons });
    txt.push(`\n# Unit ${idx + 1}: ${title} (${titleVi}) ${emoji}`);
    lessons.forEach((l) => txt.push(`  Lesson ${l.order}: ` + l.words.map((w) => `${w.term}=${w.meaning}`).join(' | ')));
    totalLessons += lessons.length; totalWords += g.words.length;
  });
  result.levels[level] = units;
  console.log(`${level}: ${units.length} unit, ${units.reduce((s, u) => s + u.lessons.length, 0)} lesson, ${flat[level].length} từ`);
}

fs.writeFileSync('data/content.preview.json', JSON.stringify(result, null, 2));
fs.writeFileSync('data/content.preview.txt', txt.join('\n'), 'utf8');
console.log(`\nXong: ${totalLessons} lesson, ${totalWords} từ. Bỏ ${removedUk} từ trùng chính tả Anh, thay ${replaced}/${tatWords.length} câu Tatoeba sai nghĩa.`);