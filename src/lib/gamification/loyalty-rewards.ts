import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Sadakat eşik ödülleri (100, 250, 500, 1000 puan) — booking onay sonrası
 * fire-and-forget olarak çağrılır. Idempotent: aynı eşik için 2. kupon vermez.
 *
 * @returns Yeni verilen kupon kodları (boş ise yeni ödül yok)
 */
export async function evaluateLoyaltyRewards(userId: string): Promise<string[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc('evaluate_loyalty_rewards', {
    p_user_id: userId,
  });
  if (error) {
    console.error('[loyalty] reward eval failed:', error);
    return [];
  }
  return (data ?? []) as string[];
}

export interface LoyaltyReward {
  threshold: number;
  couponCode: string;
  grantedAt: string;
}

export async function listLoyaltyRewards(userId: string): Promise<LoyaltyReward[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('user_loyalty_rewards')
    .select('threshold, coupon_code, granted_at')
    .eq('user_id', userId)
    .order('threshold', { ascending: true });
  return (data ?? []).map((r) => ({
    threshold: r.threshold,
    couponCode: r.coupon_code,
    grantedAt: r.granted_at,
  }));
}

export const LOYALTY_THRESHOLDS = [
  { threshold: 100, percent: 10, days: 30 },
  { threshold: 250, percent: 15, days: 30 },
  { threshold: 500, percent: 20, days: 30 },
  { threshold: 1000, percent: 25, days: 60 },
] as const;
