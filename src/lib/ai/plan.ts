import { searchDealsByQuery, type MatchedDeal } from '@/lib/ai/search-core';

export type DayPlanStep = {
  /** Display time like "10:00". */
  time: string;
  emoji: string;
  category: string;
  deal: MatchedDeal | null;
  rationale: string;
};

/** Sabit slot metadatası — replaceStep aynı sıraya yeni deal yerleştirir. */
const PLAN_SLOTS = [
  {
    time: '10:00',
    emoji: '☕',
    category: 'Kahvaltı',
    queryPrefix: 'sabah kahvaltı',
    rationale: 'Güne yavaş başlamak için sakin bir kahvaltı.',
  },
  {
    time: '14:00',
    emoji: '🚶',
    category: 'Aktivite',
    queryPrefix: 'öğleden sonra aktivite veya tur',
    rationale: 'Sindirim sonrası hareketli bir bölüm.',
  },
  {
    time: '19:00',
    emoji: '🍽',
    category: 'Akşam yemeği',
    queryPrefix: 'akşam yemeği',
    rationale: 'Günü güzel bir yemekle kapat.',
  },
] as const;

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
 * Compose three parallel category-flavoured RAG searches into a morning →
 * afternoon → evening plan. Picks the first deal per slot that fits the
 * per-step budget, falls back to the closest match if nothing fits.
 */
export async function buildDayPlan(input: BuildDayPlanInput): Promise<DayPlan> {
  const audience = input.audience ?? 'solo';
  const city = input.city ?? 'İstanbul';
  const baseDesc = input.description?.trim() ?? 'iyi bir gün';

  const audienceHint = ((): string => {
    switch (audience) {
      case 'couple':
        return 'eşimle romantik';
      case 'family':
        return 'ailecek çocuklu';
      case 'group':
        return 'arkadaş grubuyla eğlenceli';
      default:
        return 'tek başıma rahat';
    }
  })();

  const queries = {
    breakfast: `${city} sabah kahvaltı ${audienceHint} — ${baseDesc}`,
    activity: `${city} öğleden sonra aktivite veya tur ${audienceHint} — ${baseDesc}`,
    dinner: `${city} akşam yemeği ${audienceHint} — ${baseDesc}`,
  };

  const [breakfast, activity, dinner] = await Promise.all([
    searchDealsByQuery(queries.breakfast, { maxResults: 4, filterCity: city }),
    searchDealsByQuery(queries.activity, { maxResults: 4, filterCity: city }),
    searchDealsByQuery(queries.dinner, { maxResults: 4, filterCity: city }),
  ]);

  const perStepBudget =
    input.budgetTotal && input.budgetTotal > 0 ? input.budgetTotal / 3 : undefined;

  const pickWithBudget = (list: MatchedDeal[]): MatchedDeal | null => {
    if (list.length === 0) return null;
    if (!perStepBudget) return list[0] ?? null;
    return list.find((d) => Number(d.discounted_price) <= perStepBudget) ?? list[0] ?? null;
  };

  const b = pickWithBudget(breakfast);
  const a = pickWithBudget(activity);
  const d = pickWithBudget(dinner);

  const totalPrice =
    (b?.discounted_price ? Number(b.discounted_price) : 0) +
    (a?.discounted_price ? Number(a.discounted_price) : 0) +
    (d?.discounted_price ? Number(d.discounted_price) : 0);

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
  /** Kullanıcının "neyi değiştirmek istiyor" ipucu. */
  whatToChange: string;
  audience?: BuildDayPlanInput['audience'];
  city?: string;
  /** Tek slot için bütçe TL — verilmezse kısıt yok. */
  budget?: number;
  /** Aynı turda atlanacak deal id'ler — önceki seçimi tekrar önermesin. */
  excludeDealIds?: string[];
}

/**
 * Plan'ın TEK bir adımını yeniden ara. Kullanıcı "2. adımı değiştir, biraz
 * daha cep dostu olsun" dediğinde tools.replaceDayPlanStep bunu çağırır.
 */
export async function replaceDayPlanStep(
  input: ReplaceDayPlanStepInput,
): Promise<DayPlanStep | null> {
  const idx = Math.max(0, Math.min(PLAN_SLOTS.length - 1, Math.trunc(input.stepIndex)));
  const slot = PLAN_SLOTS[idx];
  const city = input.city ?? 'İstanbul';
  const audienceHint = ((): string => {
    switch (input.audience) {
      case 'couple':
        return 'eşimle romantik';
      case 'family':
        return 'ailecek çocuklu';
      case 'group':
        return 'arkadaş grubuyla eğlenceli';
      case 'solo':
        return 'tek başıma rahat';
      default:
        return '';
    }
  })();

  const query = [city, slot.queryPrefix, audienceHint, input.whatToChange]
    .filter((s) => s && s.trim().length > 0)
    .join(' — ');

  const candidates = await searchDealsByQuery(query, {
    maxResults: 6,
    filterCity: city,
  });

  const exclude = new Set(input.excludeDealIds ?? []);
  const usable = candidates.filter((c) => !exclude.has(c.id));
  if (usable.length === 0) return null;

  const pick = input.budget
    ? usable.find((d) => Number(d.discounted_price) <= input.budget!) ?? usable[0]
    : usable[0];

  return {
    time: slot.time,
    emoji: slot.emoji,
    category: slot.category,
    deal: pick,
    rationale: slot.rationale,
  };
}
