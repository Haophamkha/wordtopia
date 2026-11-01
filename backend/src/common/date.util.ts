const VN_OFFSET = 7 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// Ngày theo giờ Việt Nam, lưu dạng 00:00 UTC (hợp với cột @db.Date)
export function vnDate(d: Date = new Date()): Date {
  const t = new Date(d.getTime() + VN_OFFSET);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY);
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY);
}