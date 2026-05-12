'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { onboardingSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

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

  revalidatePath('/', 'layout');
  redirect(withToast('/', TOAST_KEYS.onboardingDone));
}
