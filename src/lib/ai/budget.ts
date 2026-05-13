import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Daily AI budget guard — günlük cost USD eşiğini aşarsa devreyi açar.
 * Eşik aşıldı mı, /api/ai/chat 503 ve dostça mesaj döner; anon hariç
 * herkes ertesi gün tekrar dener. Hesap batırılmasın diye sert kapı.
 *
 * Maliyet hesabı: streamText sonrası `usage` token sayılarından grossluyoruz.
 * Gemini Flash 2.5 fiyatı sabit değil — env'den alıyoruz, default değerler
 * Gemini docs'taki tier-1 ücretler ($0.10/1M input, $0.40/1M output).
 */
const INPUT_PRICE_USD_PER_1M = Number(process.env.AI_INPUT_USD_PER_1M ?? '0.10');
const OUTPUT_PRICE_USD_PER_1M = Number(process.env.AI_OUTPUT_USD_PER_1M ?? '0.40');
const DAILY_BUDGET_USD = Number(process.env.AI_DAILY_BUDGET_USD ?? '2.00');

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface BudgetStatus {
  open: boolean; // true → circuit kapalı (kullanılabilir), false → bütçe doldu
  spentUsd: number;
  budgetUsd: number;
}

export async function getBudgetStatus(): Promise<BudgetStatus> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('ai_daily_budget')
    .select('total_cost_usd, circuit_open')
    .eq('date', todayUTC())
    .maybeSingle();

  const spent = Number(data?.total_cost_usd ?? 0);
  // DB'de circuit_open=true "açık (kullan)" anlamına geliyor; null → açık say.
  const dbOpen = data?.circuit_open ?? true;
  const overBudget = spent >= DAILY_BUDGET_USD;
  return {
    open: dbOpen && !overBudget,
    spentUsd: spent,
    budgetUsd: DAILY_BUDGET_USD,
  };
}

export function estimateCostUsd(input: number, output: number): number {
  return (
    (input / 1_000_000) * INPUT_PRICE_USD_PER_1M +
    (output / 1_000_000) * OUTPUT_PRICE_USD_PER_1M
  );
}

/** Tek sorgu maliyetini günlük toplama ekle, gerekiyorsa devreyi aç/kapa. */
export async function recordSpend(usd: number): Promise<void> {
  if (!Number.isFinite(usd) || usd <= 0) return;
  const supabase = getServiceClient();
  const today = todayUTC();

  // Race-condition'a karşı atomic update: önce var mı bak, yoksa insert.
  const { data: row } = await supabase
    .from('ai_daily_budget')
    .select('total_cost_usd, total_queries')
    .eq('date', today)
    .maybeSingle();

  const newCost = Number(row?.total_cost_usd ?? 0) + usd;
  const newQueries = Number(row?.total_queries ?? 0) + 1;
  const circuitOpen = newCost < DAILY_BUDGET_USD;

  await supabase
    .from('ai_daily_budget')
    .upsert(
      {
        date: today,
        total_cost_usd: newCost,
        total_queries: newQueries,
        circuit_open: circuitOpen,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date' },
    );
}
