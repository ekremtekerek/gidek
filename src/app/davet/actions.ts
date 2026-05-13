'use server';

import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';

export interface ReferralSummary {
  code: string;
  claimCount: number;
}

/**
 * Çağıran kullanıcının davet kodunu döndürür; kod yoksa üretir + kaydeder.
 * Idempotent — aynı kullanıcı için her zaman aynı kod.
 */
export async function getOrCreateReferral(): Promise<ReferralSummary> {
  const user = await requireUser();
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from('referrals')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  let code: string;
  if (existing?.code) {
    code = existing.code;
  } else {
    // Server-side gen_referral_code() ile collision-free 6 karakter al.
    const { data: gen, error: genErr } = await supabase.rpc('gen_referral_code');
    if (genErr || !gen) throw new Error('Kod üretilemedi');
    code = gen as string;

    const { error: insErr } = await supabase
      .from('referrals')
      .upsert({ user_id: user.id, code }, { onConflict: 'user_id' });
    if (insErr) throw insErr;
  }

  const { count } = await supabase
    .from('referral_claims')
    .select('id', { count: 'exact', head: true })
    .eq('code', code);

  return { code, claimCount: count ?? 0 };
}

/**
 * Yeni kullanıcının kayıt sonrası davet kodunu kayda alır. Idempotent —
 * aynı redeemer iki kez claim edemez (unique constraint).
 *
 * Bu fonksiyon sign-up flow'unda ya da onboarding sırasında çağırılır;
 * burada server action olarak da çağrılabilsin diye export ediyoruz.
 */
export async function claimReferralCode(code: string): Promise<{ ok: boolean; reason?: string }> {
  const user = await requireUser();
  const supabase = getServiceClient();
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(normalized)) {
    return { ok: false, reason: 'Geçersiz kod formatı.' };
  }

  // Kod var mı + kullanıcı kendi kodunu kullanmıyor mu?
  const { data: ref } = await supabase
    .from('referrals')
    .select('user_id')
    .eq('code', normalized)
    .maybeSingle();
  if (!ref) return { ok: false, reason: 'Bu kod tanınmıyor.' };
  if (ref.user_id === user.id) return { ok: false, reason: 'Kendi kodunu kullanamazsın.' };

  // Daha önce başka bir kod claim ettiyse engelle.
  const { count } = await supabase
    .from('referral_claims')
    .select('id', { count: 'exact', head: true })
    .eq('redeemer_id', user.id);
  if ((count ?? 0) > 0) {
    return { ok: false, reason: 'Daha önce bir davet kodu kullanmışsın.' };
  }

  const { error: insErr } = await supabase
    .from('referral_claims')
    .insert({ code: normalized, redeemer_id: user.id });
  if (insErr) {
    if (insErr.code === '23505') {
      return { ok: false, reason: 'Bu hesap zaten kullanılmış.' };
    }
    return { ok: false, reason: 'Kaydedilemedi.' };
  }

  return { ok: true };
}
