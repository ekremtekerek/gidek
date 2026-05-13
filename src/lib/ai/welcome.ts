/**
 * Dynamic homepage welcome — saat + gün + şehir + öne çıkan fırsatlardan
 * kişiselleşmiş bir karşılama metni ve hızlı başlangıç chip'leri üretir.
 * AI çağrısı YOK — saf template + heuristic, böylece her sayfa yüklemesinde
 * çalışabilir, cost yok, latency sıfır.
 *
 * Konum bilgisi server'da yok (browser-only). Client tarafında `enrichForLocation`
 * ile semt-bilinçli chip eklenir.
 */

export interface WelcomeChip {
  /** Buton üstündeki kısa etiket. */
  label: string;
  /** Buton tıklanınca chat'e gönderilen tam metin. */
  text: string;
}

export interface WelcomeContent {
  greeting: string;
  subtitle: string;
  chips: WelcomeChip[];
}

const DAYS_LONG = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
];

type PartOfDay = 'gece' | 'sabah' | 'öğle' | 'oglesonra' | 'akşam';

function partOfDay(hour: number): PartOfDay {
  if (hour < 6) return 'gece';
  if (hour < 11) return 'sabah';
  if (hour < 15) return 'öğle';
  if (hour < 18) return 'oglesonra';
  if (hour < 22) return 'akşam';
  return 'gece';
}

function greetingFor(part: PartOfDay): string {
  switch (part) {
    case 'sabah':
      return 'Günaydın!';
    case 'öğle':
      return 'İyi günler!';
    case 'oglesonra':
      return 'İyi öğleden sonralar!';
    case 'akşam':
      return 'İyi akşamlar!';
    case 'gece':
      return 'İyi geceler!';
  }
}

interface FeaturedDeal {
  title: string;
  district?: string | null;
  category?: string | null;
  discountPct?: number | null;
}

function pickSpotlight(deals: FeaturedDeal[]): FeaturedDeal | null {
  if (!deals || deals.length === 0) return null;
  // En yüksek indirimliyi öne al; eşitse ilki.
  return [...deals].sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))[0];
}

/**
 * Subtitle — gün-saat-spotlight üçlüsünden organic bir cümle.
 * Örnek: "Cumartesi akşamı — Beyoğlu'nda %47 indirimli bir konser var,
 *        ya da ailecek pazar planını şimdiden kuralım mı?"
 */
function subtitleFor(opts: {
  today: string;
  tomorrow: string;
  part: PartOfDay;
  spotlight: FeaturedDeal | null;
  city: string;
}): string {
  const { today, tomorrow, part, spotlight } = opts;
  const isWeekendDay = today === 'Cumartesi' || today === 'Pazar';

  // Spotlight cümlesi — bir öne çıkan fırsat varsa onu refer et.
  let spotLine = '';
  if (spotlight && spotlight.discountPct && spotlight.discountPct >= 30) {
    const where = spotlight.district ? ` ${spotlight.district}'da` : '';
    spotLine = `${where} %${spotlight.discountPct} indirimli "${spotlight.title}" gibi şeyler var. `;
  }

  // Asıl yönlendirme cümlesi gün/saat'e göre.
  let prompt = '';
  if (isWeekendDay && part === 'sabah') {
    prompt = `${today} sabahı için bir kahvaltı önerisi alalım mı, yoksa baştan sona bir gün planı kurayım mı?`;
  } else if (isWeekendDay) {
    prompt = `${today} için ${part === 'akşam' ? 'akşam yemeği veya gece için' : 'bir aktivite için'} öneri istersen yazman yeter.`;
  } else if (part === 'akşam' && (today === 'Cuma' || today === 'Perşembe')) {
    prompt = `Hafta sonu (yarın ${tomorrow}) için ${today} akşamından bir plan kuralım mı?`;
  } else if (part === 'akşam' || part === 'oglesonra') {
    prompt = `Bu akşam için bir şey önereyim ya da yarın (${tomorrow}) için baştan plan kurayım mı?`;
  } else if (part === 'sabah' || part === 'öğle') {
    prompt = `Bugün için bir şey önereyim ya da hafta sonu için baştan plan kurayım mı?`;
  } else {
    prompt = `Aklındakini yaz, ben sana en uygun fırsatları çıkarıp neden uyduğunu anlatayım.`;
  }

  return `${spotLine}${prompt}`.trim();
}

function chipsFor(opts: {
  today: string;
  tomorrow: string;
  part: PartOfDay;
}): WelcomeChip[] {
  const { today, tomorrow, part } = opts;
  const chips: WelcomeChip[] = [];

  // 1) Şimdi/bu akşam için doğrudan öneri
  if (part === 'akşam' || part === 'gece') {
    chips.push({
      label: 'Bu akşam akşam yemeği',
      text: `Bu akşam (${today.toLowerCase()}) için akşam yemeği önerir misin?`,
    });
  } else if (part === 'sabah') {
    chips.push({
      label: 'Bu sabah kahvaltı',
      text: `Bugün (${today.toLowerCase()}) için güzel bir kahvaltı yeri önerir misin?`,
    });
  } else {
    chips.push({
      label: 'Bugün için bir şey öner',
      text: `${today} için bir aktivite önerir misin?`,
    });
  }

  // 2) Yarın için
  chips.push({
    label: `Yarın (${tomorrow.toLowerCase()}) için`,
    text: `Yarın ${tomorrow} için keyifli bir şey önerir misin?`,
  });

  // 3) Hafta sonu plan
  const isWeekend = today === 'Cumartesi' || today === 'Pazar';
  chips.push(
    isWeekend
      ? {
          label: 'Ailecek bir gün',
          text: `Ailecek bugün için baştan sona bir gün planı kurar mısın?`,
        }
      : {
          label: 'Hafta sonu plan kur',
          text: `Hafta sonu için baştan sona bir gün planı kurar mısın?`,
        },
  );

  // 4) Çift / romantik akşam
  if (part === 'akşam' || part === 'gece' || isWeekend) {
    chips.push({
      label: 'Çift için romantik',
      text: 'Eşimle romantik bir akşam yemeği önerir misin?',
    });
  } else {
    chips.push({
      label: 'Çocukla aktivite',
      text: 'Çocuğumla yapabileceğimiz bir aktivite önerir misin?',
    });
  }

  return chips;
}

export function buildWelcomeContent(args: {
  now?: Date;
  city: string;
  deals?: FeaturedDeal[];
}): WelcomeContent {
  const now = args.now ?? new Date();
  const today = DAYS_LONG[now.getDay()];
  const tomorrow = DAYS_LONG[(now.getDay() + 1) % 7];
  const part = partOfDay(now.getHours());

  const spotlight = pickSpotlight(args.deals ?? []);
  const greeting = greetingFor(part);
  const subtitle = subtitleFor({ today, tomorrow, part, spotlight, city: args.city });
  const chips = chipsFor({ today, tomorrow, part });

  return { greeting, subtitle, chips };
}

/**
 * Client-side enrich — kullanıcı tarayıcıdan konum izni verdiğinde ilk chip'i
 * "yakınımda" odaklı bir öneri ile değiştirir. Server'dan gelen statik
 * içeriği bozmadan yumuşak bir personalisation katmanı.
 */
export function enrichForLocation(
  content: WelcomeContent,
  district: string | null,
): WelcomeContent {
  if (!district) return content;
  const newChips = [...content.chips];
  newChips.splice(0, 0, {
    label: `Yakınımda (${district})`,
    text: `${district} çevresinde bana yakın şu an açık bir şey önerir misin?`,
  });
  return { ...content, chips: newChips.slice(0, 4) };
}
