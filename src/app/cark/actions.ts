'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';

export type SpinPrize =
  | { kind: 'none'; label: string }
  | { kind: 'points'; label: string; points: number }
  | { kind: 'coupon'; label: string; couponCode: string; couponValue: number };

export type SpinState =
  | { ok: true; prize: SpinPrize }
  | { ok: false; reason: 'already_spun' | 'error'; message: string }
  | null;

/**
 * Günlük çark spin'i. Aynı gün ikinci spin RPC tarafında PK constraint ile
 * bloklanır (user_id, spin_date) — uniqueness garantili.
 */
export async function spinDailyAction(): Promise<SpinState> {
  const user = await requireUser();

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc('spin_daily', { p_user_id: user.id });
  if (error) {
    if (error.message?.includes('already_spun')) {
      return {
        ok: false,
        reason: 'already_spun',
        message: 'Bugün çarkı çevirdin — yarın tekrar gel.',
      };
    }
    console.error('[spin] failed:', error);
    return { ok: false, reason: 'error', message: 'Bir şey ters gitti. Tekrar dene.' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, reason: 'error', message: 'Sonuç alınamadı.' };

  const prize: SpinPrize =
    row.prize_kind === 'points'
      ? { kind: 'points', label: row.label, points: row.points ?? 0 }
      : row.prize_kind === 'coupon'
        ? {
            kind: 'coupon',
            label: row.label,
            couponCode: row.coupon_code ?? '',
            couponValue: row.coupon_value ?? 0,
          }
        : { kind: 'none', label: row.label };

  revalidatePath('/profil');
  revalidatePath('/cark');

  return { ok: true, prize };
}
