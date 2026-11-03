import * as Speech from 'expo-speech';

let voice: string | undefined;
let ready = false;

// Chọn giọng en-US chất lượng cao nhất có sẵn trên máy
async function pickVoice() {
  if (ready) return;
  ready = true;
  try {
    const all = await Speech.getAvailableVoicesAsync();
    const en = all.filter((v) => (v.language ?? '').toLowerCase().replace('_', '-') === 'en-us');
    const best =
      en.find((v) => v.quality === 'Enhanced' && !v.notInstalled) ??
      en.find((v) => !v.notInstalled);
    voice = best?.identifier;
    console.log('[speak] giọng:', best?.name ?? 'mặc định', '| số giọng en-US:', en.length);
  } catch (e) {
    console.log('[speak] không lấy được danh sách giọng', e);
  }
}

export async function speak(term: string) {
  await pickVoice();
  Speech.stop();
  Speech.speak(term, { language: 'en-US', voice, rate: 0.85, pitch: 1.0 });
}