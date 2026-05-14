/**
 * Merchant working_hours şeması:
 *   {
 *     "mon": [{ "open": "09:00", "close": "23:00" }, ...],
 *     "tue": [...],
 *     ...
 *     "sun": [...]
 *   }
 *
 * Boş array → o gün kapalı. Anahtar yoksa → bilgi yok.
 */

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface TimeRange {
  open: string;
  close: string;
}

export type WorkingHours = Partial<Record<DayKey, TimeRange[]>> | null | undefined;

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS_TR: Record<DayKey, string> = {
  mon: 'Pzt',
  tue: 'Sal',
  wed: 'Çar',
  thu: 'Per',
  fri: 'Cum',
  sat: 'Cmt',
  sun: 'Paz',
};

/**
 * JavaScript Date getDay() → 0=Pazar … 6=Cumartesi. ISO mon=1 sun=7. Bizim
 * şemamızda haftanın günleri mon-sun ile başlıyor.
 */
function dateToDayKey(d: Date): DayKey {
  // Türkiye saatine (UTC+3) sabit shift uygulayıp gün karşılığı bulalım.
  // Tarayıcı/sunucu yerel saat dilimi farklı olabilir; production'da Vercel
  // UTC çalışır.
  const istanbulOffset = 3 * 60 * 60 * 1000;
  const local = new Date(d.getTime() + istanbulOffset);
  const day = local.getUTCDay(); // 0=Sun..6=Sat
  return day === 0 ? 'sun' : DAY_ORDER[day - 1];
}

function nowIstanbulMinutes(d: Date): number {
  const istanbulOffset = 3 * 60 * 60 * 1000;
  const local = new Date(d.getTime() + istanbulOffset);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

function parseClockToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 26 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Verilen saat dakika cinsinden ranges'tan birine düşüyor mu?
 * close < open ise gece yarısını geçtiği varsayılır (ör. 22:00-02:00).
 */
function inRanges(nowMin: number, ranges: TimeRange[]): boolean {
  for (const r of ranges) {
    const open = parseClockToMinutes(r.open);
    let close = parseClockToMinutes(r.close);
    if (open === null || close === null) continue;
    if (close < open) close += 24 * 60; // gece yarısı geçişi
    const cur = nowMin < open && close > 24 * 60 ? nowMin + 24 * 60 : nowMin;
    if (cur >= open && cur < close) return true;
  }
  return false;
}

export function isOpenNow(hours: WorkingHours, now: Date = new Date()): boolean | null {
  if (!hours || typeof hours !== 'object') return null;
  const todayKey = dateToDayKey(now);
  const todayRanges = hours[todayKey];
  if (!Array.isArray(todayRanges)) return null;
  if (todayRanges.length === 0) return false;
  const cur = nowIstanbulMinutes(now);
  return inRanges(cur, todayRanges);
}

/** Bugünün ilk açılışı (ör. "11:00 - 23:00") — UI rozeti yanına özet */
export function todaySummary(hours: WorkingHours, now: Date = new Date()): string | null {
  if (!hours || typeof hours !== 'object') return null;
  const todayKey = dateToDayKey(now);
  const todayRanges = hours[todayKey];
  if (!Array.isArray(todayRanges) || todayRanges.length === 0) return null;
  return todayRanges.map((r) => `${r.open}–${r.close}`).join(', ');
}
