import { type MatchedDeal } from '@/lib/ai/search-core';
import { getServiceClient } from '@/lib/db/service';

export type DayPlanStep = {
  /** Display time like "10:00". */
  time: string;
  emoji: string;
  category: string;
  deal: MatchedDeal | null;
  rationale: string;
};

/**
 * Sabit slot metadatası — replaceStep aynı sıraya yeni deal yerleştirir.
 * `categories`: bu slota uygun ana kategori slug'ları. Adaylar DOĞRUDAN bu
 * kategorilerden çekilir; RAG (semantik) kullanılmaz — "akşam yemeği ailecek"
 * sorgusu benzerlikle bir tiyatroyu çekip yemek slotuna koyuyordu. Kategori
 * bazlı çekim kategori doğruluğunu garanti eder.
 */
const PLAN_SLOTS = [
  {
    time: '10:00',
    emoji: '☕',
    category: 'Kahvaltı',
    categories: ['kahvalti'],
    rationale: 'Güne yavaş başlamak için sakin bir kahvaltı.',
  },
  {
    time: '14:00',
    emoji: '🚶',
    category: 'Aktivite',
    categories: ['aktivite', 'turlar', 'masaj', 'guzellik'],
    rationale: 'Sindirim sonrası hareketli bir bölüm.',
  },
  {
    time: '19:00',
    emoji: '🍽',
    category: 'Akşam yemeği',
    categories: ['yemek'],
    rationale: 'Günü güzel bir yemekle kapat.',
  },
] as const;

/**
 * Bir slotun adaylarını DOĞRUDAN kategoriden çeker (aktif + yayında + geçerli,
 * şehir filtreli), öne çıkan/popüler önce. shapeDeal ile uyumlu MatchedDeal
 * şekline map'lenir (similarity/distance bu yolda yok → 0/null).
 */
async function fetchSlotCandidates(
  categories: readonly string[],
  city: string,
  limit = 12,
): Promise<MatchedDeal[]> {
  const supabase = getServiceClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('deals')
    .select(
      `id, slug, title, subtitle, description, cover_image, city, district,
       venue_name, duration_minutes, original_price, discounted_price,
       discount_percent, audience, tags, lat, lng,
       deal_categories!inner ( category:categories!inner ( slug ) )`,
    )
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso)
    .eq('city', city)
    .in('deal_categories.category.slug', [...categories])
    .order('is_featured', { ascending: false })
    .order('sort_priority', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('fetchSlotCandidates failed:', error);
    return [];
  }

  return (data ?? []).map(
    (d): MatchedDeal => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      subtitle: d.subtitle,
      description: d.description,
      cover_image: d.cover_image,
      city: d.city,
      district: d.district,
      venue_name: d.venue_name,
      duration_minutes: d.duration_minutes,
      original_price: Number(d.original_price),
      discounted_price: Number(d.discounted_price),
      discount_percent: d.discount_percent,
      audience: d.audience ?? [],
      tags: d.tags ?? [],
      lat: d.lat as number | null,
      lng: d.lng as number | null,
      similarity: 0,
      distance_km: null,
    }),
  );
}

/** İstenen kitleye uyan adayları öne al (popülerlik sırasını korur — stable sort). */
function preferAudience(list: MatchedDeal[], audience?: string): MatchedDeal[] {
  if (!audience) return list;
  return [...list].sort(
    (a, b) => (b.audience.includes(audience) ? 1 : 0) - (a.audience.includes(audience) ? 1 : 0),
  );
}

export type DayPlan = {
  steps: DayPlanStep[];
  totalPrice: number;
};

export interface BuildDayPlanInput {
  description?: string;
  audience?: 'couple' | 'family' | 'solo' | 'group';
  city?: string;
  budgetTotal?: number;
}

/**
 * Sabah kahvaltı → öğleden sonra aktivite → akşam yemeği planı kurar. Her slot
 * KENDİ kategorisinden çekilir; bütçe varsa 3'e bölünür, kitleye uyanlar öne
 * alınır, aynı deal iki slota düşmez. Kategoriye uygun aday yoksa slot boş kalır.
 */
export async function buildDayPlan(input: BuildDayPlanInput): Promise<DayPlan> {
  const audience = input.audience;
  const city = input.city ?? 'İstanbul';

  const [breakfast, activity, dinner] = await Promise.all([
    fetchSlotCandidates(PLAN_SLOTS[0].categories, city),
    fetchSlotCandidates(PLAN_SLOTS[1].categories, city),
    fetchSlotCandidates(PLAN_SLOTS[2].categories, city),
  ]);

  const perStepBudget =
    input.budgetTotal && input.budgetTotal > 0 ? input.budgetTotal / 3 : undefined;

  // Slotlar arası aynı deal'ı iki kez koymamak için.
  const used = new Set<string>();

  const pickForSlot = (list: MatchedDeal[]): MatchedDeal | null => {
    const pool = preferAudience(
      list.filter((d) => !used.has(d.id)),
      audience,
    );
    if (pool.length === 0) return null;
    const chosen = perStepBudget
      ? (pool.find((x) => Number(x.discounted_price) <= perStepBudget) ?? pool[0])
      : pool[0];
    used.add(chosen.id);
    return chosen;
  };

  const b = pickForSlot(breakfast);
  const a = pickForSlot(activity);
  const d = pickForSlot(dinner);

  const totalPrice =
    (b ? Number(b.discounted_price) : 0) +
    (a ? Number(a.discounted_price) : 0) +
    (d ? Number(d.discounted_price) : 0);

  return {
    steps: PLAN_SLOTS.map((slot, i) => ({
      time: slot.time,
      emoji: slot.emoji,
      category: slot.category,
      deal: [b, a, d][i],
      rationale: slot.rationale,
    })),
    totalPrice,
  };
}

export interface ReplaceDayPlanStepInput {
  /** 0=kahvaltı, 1=aktivite, 2=akşam yemeği. */
  stepIndex: number;
  /** Kullanıcının "neyi değiştirmek istiyor" ipucu (kayıt amaçlı; retrieval kategori bazlı). */
  whatToChange: string;
  audience?: BuildDayPlanInput['audience'];
  city?: string;
  /** Tek slot için bütçe TL — verilmezse kısıt yok. */
  budget?: number;
  /** Aynı turda atlanacak deal id'ler — önceki seçimi tekrar önermesin. */
  excludeDealIds?: string[];
}

/**
 * Plan'ın TEK bir adımını yeniden seçer (aynı kategoriden farklı bir deal).
 * Kullanıcı "2. adımı değiştir, biraz daha cep dostu olsun" dediğinde çağrılır;
 * bütçe + kitle tercihi uygulanır, önceki seçim(ler) hariç tutulur.
 */
export async function replaceDayPlanStep(
  input: ReplaceDayPlanStepInput,
): Promise<DayPlanStep | null> {
  const idx = Math.max(0, Math.min(PLAN_SLOTS.length - 1, Math.trunc(input.stepIndex)));
  const slot = PLAN_SLOTS[idx];
  const city = input.city ?? 'İstanbul';

  const candidates = await fetchSlotCandidates(slot.categories, city, 16);
  const exclude = new Set(input.excludeDealIds ?? []);
  const usable = preferAudience(
    candidates.filter((c) => !exclude.has(c.id)),
    input.audience,
  );
  if (usable.length === 0) return null;

  const pick = input.budget
    ? (usable.find((d) => Number(d.discounted_price) <= input.budget!) ?? usable[0])
    : usable[0];

  return {
    time: slot.time,
    emoji: slot.emoji,
    category: slot.category,
    deal: pick,
    rationale: slot.rationale,
  };
}
