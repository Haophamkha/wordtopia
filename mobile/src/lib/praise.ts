const PRAISE = ['Chính xác!', 'Tuyệt vời!', 'Giỏi quá!', 'Chuẩn rồi!', 'Xuất sắc!', 'Quá đỉnh!', 'Làm tốt lắm!'];

let combo = 0;
let last = -1;

export function resetCombo() {
  combo = 0;
}

// Gọi 1 lần cho mỗi câu đã trả lời. Trả về lời khen ngẫu nhiên và số câu đúng liên tiếp.
export function nextFeedback(correct: boolean): { text: string; combo: number } {
  if (!correct) {
    combo = 0;
    return { text: 'Chưa đúng', combo: 0 };
  }
  combo += 1;
  let i = Math.floor(Math.random() * PRAISE.length);
  if (i === last) i = (i + 1) % PRAISE.length;
  last = i;
  return { text: PRAISE[i], combo };
}

export function comboLabel(n: number): string | null {
  if (n === 3) return '3 câu liên tiếp! 🔥';
  if (n === 5) return '5 câu liên tiếp! 🔥🔥';
  if (n >= 10 && n % 5 === 0) return `${n} câu liên tiếp! 🚀`;
  return null;
}