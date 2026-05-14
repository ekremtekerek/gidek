import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Cüzdan: kullanıcıya ait tüm otomatik üretilmiş kuponları (bingo, spin,
 * loyalty, refund) tek bir listede toplar. coupons tablosundan tam bilgileri
 * çeker; kullanılmış / süresi dolmuş olanları flag'ler.
 */

export type WalletCouponSource = 'bingo' | 'spin' | 'loyalty' | 'refund';

export interface WalletCoupon {
  code: string;
  source: WalletCouponSource;
  sourceLabel: string;
  description: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  validUntil: string | null;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
  earnedAt: string;
  status: 'usable' | 'used' | 'expired' | 'inactive';
}

export async function listWalletCoupons(userId: string): Promise<WalletCoupon[]> {
  const supabase = getServiceClient();

  const [bingos, spins, loyalty, refunds] = await Promise.all([
    supabase
      .from('user_city_bingos')
      .select('coupon_code, claimed_at, city')
      .eq('user_id', userId),
    supabase
      .from('user_daily_spins')
      .select('coupon_code, spun_at, label')
      .eq('user_id', userId)
      .eq('prize_kind', 'coupon')
      .not('coupon_code', 'is', null),
    supabase
      .from('user_loyalty_rewards')
      .select('coupon_code, granted_at, threshold')
      .eq('user_id', userId),
    supabase
      .from('user_refund_coupons')
      .select('coupon_code, created_at, refund_value')
      .eq('user_id', userId),
  ]);

  interface Entry {
    code: string;
    source: WalletCouponSource;
    sourceLabel: string;
    earnedAt: string;
  }
  const entries: Entry[] = [];

  for (const b of bingos.data ?? []) {
    if (b.coupon_code) {
      entries.push({
        code: b.coupon_code,
        source: 'bingo',
        sourceLabel: `Şehir bingosu — ${b.city}`,
        earnedAt: b.claimed_at,
      });
    }
  }
  for (const s of spins.data ?? []) {
    if (s.coupon_code) {
      entries.push({
        code: s.coupon_code,
        source: 'spin',
        sourceLabel: `Günlük çark — ${s.label}`,
        earnedAt: s.spun_at,
      });
    }
  }
  for (const l of loyalty.data ?? []) {
    if (l.coupon_code) {
      entries.push({
        code: l.coupon_code,
        source: 'loyalty',
        sourceLabel: `${l.threshold} puan ödülü`,
        earnedAt: l.granted_at,
      });
    }
  }
  for (const r of refunds.data ?? []) {
    if (r.coupon_code) {
      entries.push({
        code: r.coupon_code,
        source: 'refund',
        sourceLabel: `İade kuponu — ${Number(r.refund_value).toLocaleString('tr-TR')} ₺`,
        earnedAt: r.created_at,
      });
    }
  }

  if (entries.length === 0) return [];

  const codes = entries.map((e) => e.code);
  const { data: coupons } = await supabase
    .from('coupons')
    .select(
      'code, description, discount_type, discount_value, valid_until, used_count, max_uses, is_active',
    )
    .in('code', codes);

  const couponMap = new Map(
    (coupons ?? []).map((c) => [
      c.code,
      {
        description: c.description,
        discount_type: c.discount_type as 'percent' | 'fixed',
        discount_value: Number(c.discount_value),
        valid_until: c.valid_until,
        used_count: c.used_count ?? 0,
        max_uses: c.max_uses,
        is_active: c.is_active,
      },
    ]),
  );

  const now = Date.now();
  const out: WalletCoupon[] = [];
  for (const e of entries) {
    const c = couponMap.get(e.code);
    if (!c) continue;

    const expired = c.valid_until ? new Date(c.valid_until).getTime() < now : false;
    const used = c.max_uses != null && c.used_count >= c.max_uses;
    const status: WalletCoupon['status'] = !c.is_active
      ? 'inactive'
      : used
        ? 'used'
        : expired
          ? 'expired'
          : 'usable';

    out.push({
      code: e.code,
      source: e.source,
      sourceLabel: e.sourceLabel,
      description: c.description,
      discountType: c.discount_type,
      discountValue: c.discount_value,
      validUntil: c.valid_until,
      usedCount: c.used_count,
      maxUses: c.max_uses,
      isActive: c.is_active,
      earnedAt: e.earnedAt,
      status,
    });
  }

  return out.sort((a, b) => {
    // usable üstte, sonra used/expired/inactive
    const priority = { usable: 0, used: 1, expired: 2, inactive: 3 };
    if (priority[a.status] !== priority[b.status]) {
      return priority[a.status] - priority[b.status];
    }
    return a.earnedAt < b.earnedAt ? 1 : -1;
  });
}
