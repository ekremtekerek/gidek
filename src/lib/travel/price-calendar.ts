/**
 * Tarih bazlı fiyat üretici — bir deal için gelecek günlerde tahminî fiyat.
 *
 * V1'de gerçek dinamik fiyat altyapımız yok (rezervasyon/doluluk DB'si yok).
 * Bu yüzden deterministic random walk + sezon ağırlığı + hafta sonu primi +
 * tatil günü spike'larıyla "gerçeğe yakın" fiyat eğrisi üretiyoruz.
 *
 * Aynı deal+tarih için her zaman aynı fiyatı döner (seed-based hash).
 */

const DAY_MS = 86400000;

/** Yılbaşı, bayram dönemleri (yaklaşık + 7 günlük pencere) — +%20-40 spike */
const HOLIDAY_RANGES: Array<{ start: string; end: string; weight: number; label: string }> = [
  { start: '2026-06-15', end: '2026-06-22', weight: 1.25, label: 'Kurban Bayramı' },
  { start: '2026-08-25', end: '2026-09-01', weight: 1.15, label: 'Okul açılışı öncesi' },
  { start: '2026-10-26', end: '2026-11-02', weight: 1.2, label: 'Cumhuriyet Bayramı' },
  { start: '2026-12-29', end: '2027-01-03', weight: 1.35, label: 'Yılbaşı' },
  { start: '2027-01-19', end: '2027-01-26', weight: 1.15, label: 'Yarıyıl tatili' },
];

const SEASON_WEIGHTS: Record<number, number> = {
  // Ay 0-tabanlı (0 = Ocak)
  0: 0.78,  // Ocak
  1: 0.8,   // Şubat
  2: 0.85,  // Mart
  3: 0.92,  // Nisan
  4: 1.0,   // Mayıs
  5: 1.15,  // Haziran
  6: 1.3,   // Temmuz — yüksek sezon
  7: 1.35,  // Ağustos — pik
  8: 1.1,   // Eylül
  9: 0.95,  // Ekim
  10: 0.85, // Kasım
  11: 1.05, // Aralık (yılbaşı etkisi)
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function holidayBoost(dateIso: string): number {
  for (const r of HOLIDAY_RANGES) {
    if (dateIso >= r.start && dateIso <= r.end) return r.weight;
  }
  return 1.0;
}

function holidayLabel(dateIso: string): string | null {
  for (const r of HOLIDAY_RANGES) {
    if (dateIso >= r.start && dateIso <= r.end) return r.label;
  }
  return null;
}

export interface DailyPrice {
  date: string;
  price: number;
  /** Bu fiyatın deal'ın taban fiyatına göre değişim oranı (-0.2 = %20 ucuz) */
  delta: number;
  /** Bayram/festival etiketi (varsa) */
  eventLabel: string | null;
  /** İsteğe uygun mu? (cuma-pazar daha pahalı olsa da hâlâ ulaşılabilir) */
  level: 'low' | 'mid' | 'high';
}

/**
 * Verilen deal için, bugünden itibaren N gün boyunca tahmini fiyatları döner.
 *
 * @param basePrice — deal'ın baz fiyatı (kişi başı)
 * @param dealId — deterministic seed
 * @param days — kaç gün hesapla (default 60)
 * @param startDate — başlangıç (default bugün)
 */
export function generateDailyPrices(
  basePrice: number,
  dealId: string,
  days = 60,
  startDate?: Date,
): DailyPrice[] {
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);
  const seedBase = hash(dealId);

  const prices: DailyPrice[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * DAY_MS);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay(); // 0 Sun, 6 Sat
    const month = d.getMonth();

    // Multiplier — sezon × bayram × hafta sonu × seed-based jitter
    const seasonW = SEASON_WEIGHTS[month] ?? 1;
    const holidayW = holidayBoost(iso);
    const weekendW = dow === 5 || dow === 6 ? 1.18 : dow === 0 ? 1.08 : 1.0;

    // ±%5 random jitter (deterministic)
    const jitterSeed = (seedBase + i * 2654435761) >>> 0;
    const jitter = 1 + ((jitterSeed % 100) - 50) / 1000; // -0.05 .. +0.05

    const mult = seasonW * holidayW * weekendW * jitter;
    const price = Math.round((basePrice * mult) / 10) * 10;
    const delta = mult - 1;
    const level: DailyPrice['level'] =
      delta < -0.05 ? 'low' : delta > 0.12 ? 'high' : 'mid';

    prices.push({
      date: iso,
      price,
      delta,
      eventLabel: holidayLabel(iso),
      level,
    });
  }

  return prices;
}

/**
 * Bir fiyat dizisinde en ucuz / en pahalı + ortalama.
 */
export function analysePrices(prices: DailyPrice[]): {
  min: DailyPrice;
  max: DailyPrice;
  avg: number;
} {
  let min = prices[0];
  let max = prices[0];
  let sum = 0;
  for (const p of prices) {
    if (p.price < min.price) min = p;
    if (p.price > max.price) max = p;
    sum += p.price;
  }
  return { min, max, avg: Math.round(sum / prices.length / 10) * 10 };
}
