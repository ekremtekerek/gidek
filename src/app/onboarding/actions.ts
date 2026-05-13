'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';
import { onboardingSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

const REF_COOKIE = 'gidek_pending_ref';

/**
 * Onboarding tamamlanırken pending referral cookie varsa otomatik claim
 * eder ve cookie'yi temizler. Hata gizli — başarısızlık akışı bloklamaz.
 */
async function tryClaimPendingReferral(userId: string): Promise<void> {
  const store = await cookies();
  const code = store.get(REF_COOKIE)?.value;
  if (!code) return;
  store.delete(REF_COOKIE);

  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(normalized)) return;

  const supabase = getServiceClient();
  const { data: ref } = await supabase
    .from('referrals')
    .select('user_id')
    .eq('code', normalized)
    .maybeSingle();
  if (!ref || ref.user_id === userId) return;

  await supabase.from('referral_claims').insert({ code: normalized, redeemer_id: userId });
}

export type OnboardingState =
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

export async function onboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser();
  const supabase = await getServerClient();
  const intent = formData.get('intent');

  if (intent === 'skip') {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_done: true })
      .eq('id', user.id);
    if (error) return { ok: false, error: 'Kaydedilemedi. Tekrar dene.' };

    await tryClaimPendingReferral(user.id).catch(() => {});

    revalidatePath('/', 'layout');
    redirect('/');
  }

  const parsed = onboardingSchema.safeParse({
    city: formData.get('city'),
    district: formData.get('district'),
    household_type: formData.get('household_type'),
    kids_age_groups: formData.getAll('kids_age_groups'),
    budget_min: formData.get('budget_min'),
    budget_max: formData.get('budget_max'),
    interests: formData.getAll('interests'),
    dietary: formData.getAll('dietary'),
    dislikes: formData.get('dislikes'),
    has_car: formData.get('has_car'),
    has_pet: formData.get('has_pet'),
    time_preference: formData.get('time_preference'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const d = parsed.data;
  const { error: prefErr } = await supabase.from('user_preferences').upsert(
    {
      user_id: user.id,
      city: d.city ?? null,
      district: d.district ?? null,
      household_type: d.household_type ?? null,
      kids_age_groups: d.kids_age_groups,
      budget_min: d.budget_min ?? null,
      budget_max: d.budget_max ?? null,
      interests: d.interests,
      dietary: d.dietary,
      dislikes: d.dislikes ? [d.dislikes] : [],
      has_car: d.has_car ?? null,
      has_pet: d.has_pet ?? null,
      time_preference: d.time_preference ?? null,
    },
    { onConflict: 'user_id' },
  );

  if (prefErr) {
    return { ok: false, error: 'Tercihlerini kaydederken bir sorun oluştu.' };
  }

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ onboarding_done: true })
    .eq('id', user.id);
  if (profErr) return { ok: false, error: 'Profil güncellenemedi.' };

  // Pending referral varsa şimdi claim. Hata oluşsa bile onboarding akışı bozulmaz.
  await tryClaimPendingReferral(user.id).catch(() => {});

  revalidatePath('/', 'layout');
  redirect(withToast('/', TOAST_KEYS.onboardingDone));
}
