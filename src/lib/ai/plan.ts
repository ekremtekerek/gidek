import { searchDealsByQuery, type MatchedDeal } from '@/lib/ai/search-core';

export type DayPlanStep = {
  /** Display time like "10:00". */
  time: string;
  emoji: string;
  category: string;
  deal: MatchedDeal | null;
  rationale: string;
};

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
    steps: [
      {
        time: '10:00',
        emoji: '☕',
        category: 'Kahvaltı',
        deal: b,
        rationale: 'Güne yavaş başlamak için sakin bir kahvaltı.',
      },
      {
        time: '14:00',
        emoji: '🚶',
        category: 'Aktivite',
        deal: a,
        rationale: 'Sindirim sonrası hareketli bir bölüm.',
      },
      {
        time: '19:00',
        emoji: '🍽',
        category: 'Akşam yemeği',
        deal: d,
        rationale: 'Günü güzel bir yemekle kapat.',
      },
    ],
    totalPrice,
  };
}
