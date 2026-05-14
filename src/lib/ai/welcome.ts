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

/**
 * Her saat dilimi için varyasyon havuzu. Sıkıcı tekrar olmasın diye her sayfa
 * yüklemesinde rastgele biri seçilir. Hepsi samimi, soru sorucu, davet edici
 * tonda — kullanıcıyı sohbete yumuşak bir şekilde çekmek için.
 */
const GREETINGS: Record<PartOfDay, string[]> = {
  sabah: [
    'Günün aydın olsun! Kahvaltını nerede yapacağına karar verdin mi?',
    'Sabah sabah enerji vakti! Şehrin en güzel kahvaltı tabaklarına bir göz atalım mı?',
    'İyi sabahlar! Güne lezzetli bir başlangıç yapalım mı?',
    'Uyandın, kahvenin kokusu geldi mi? Bekleyen kahvaltı yerleri sana göz kırpıyor.',
    'Günaydın! Brunch mı, klasik serpme mi — bugün hangi havadasın?',
    'Sabah keyfi başlasın! Sıcak bir kahve eşliğinde tatlı bir kaçamak ister misin?',
    'Tatlı bir uyanış! İlk işin nasıl bir kahvaltı olsun istiyorsun?',
    'Güne hangi semtle başlasak? Sabahın bu saatinde en güzel masalar seni bekliyor.',
  ],
  öğle: [
    'İyi günler! Öğle yemeğinde bugün kendine bir güzellik yapmaya ne dersin?',
    'Öğle arası! İş molasında zihnini dağıtacak güzel bir mekan arıyor musun?',
    'Gün ortası lezzetleri çağırıyor. Bugün hangi semt, hangi mutfak?',
    'Acıktın mı? Çevrendeki en hızlı ama lezzetli noktaları çıkarayım mı?',
    'Saat tam yerinde! Aklında bir mekan var mı, yoksa ben mi söyleyeyim?',
    'Brunch geç, yemek erken — sen ne dersin, hangisini seçelim?',
    'Öğle ışığı tam yerinde. Hangi köşede neyi yiyelim sence?',
    'Kısa bir öğle molası mı, uzun bir yemek mi — bugün hangisi yakışır?',
  ],
  oglesonra: [
    'Öğleden sonra enerjisi! Çevrendeki aktivite ve indirimleri kaçırma.',
    'İkindi vakti — bir kahve, bir tatlı, bir kaçamak — hangisi olsun?',
    'Bugün ne yapsam derken vakit geçmesin. Aklındakini söyle, sana göre çıkarayım.',
    'Tam fırsat saati! Kısa bir mola için seçtiğim yerlere bir göz at.',
    'İkindi keyfi vakti. Pasta-çay, masaj ya da kısa bir atölye — sen seç.',
    'Güneş eğilmeye başladı. Bugün ne yapsak diye düşünüyorsan, ben buradayım.',
    'Bir kahve molası kıvamı. Yakınında nereye gidesin var mı bakalım?',
    'Öğleden sonra biraz keyif lazım, kabul mü? Söyle, sana göre listeleyim.',
  ],
  akşam: [
    'İyi akşamlar! İş çıkışı stres atmak için harika önerilerim var.',
    'Gün bitti, eğlence başladı. Bu akşam için aklında ne var?',
    'Mesaiden kaçmak isteyenlere müjde — bu akşamın planı sende, ben listede.',
    'Akşam yemeği nereden olsun? Romantik, samimi, kalabalık — hangisi?',
    'İş çıkışı kaçamak vakti. Konser, tiyatro, masaj — seç beğen, ben bulayım.',
    'Bugün akşamı boşa harcama. Şehirde seni bekleyen yerler var!',
    'Hava kararıyor, ışıklar yanıyor. Hadi akşamı şenlendirecek bir şey bulalım.',
    'Akşamın tadını çıkar! Sen ne istediğini söyle, ben en uygunları çıkarayım.',
  ],
  gece: [
    'Geceyi boş geçme! Geç saatlere kadar süren eğlence ve lezzet durakları burada.',
    'Şehir uyumadı, sen de uyuma. Gece için planın ne?',
    'Geç saat mi? Tam zamanı. Hâlâ açık olan en iyi yerleri biliyorum.',
    'Yıldızlar çıktı, bar saatleri başladı. Bu gece hangi kafa?',
    'Uyuyamadın mı? Aç bir mekana, geceyi kıvama getirelim.',
    'Gece kuşları için: stand-up, canlı müzik, geç açık kahvaltı — seçimin?',
    'Saat ilerledi ama endişelenme — en güzel yerler hâlâ uyanık.',
    'Gece nöbetinde misin, yoksa eğlencede mi? İkisine de cevabım var.',
  ],
};

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function greetingFor(part: PartOfDay): string {
  return pickRandom(GREETINGS[part]);
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
