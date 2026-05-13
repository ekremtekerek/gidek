import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { Container } from '@/components/ui/container';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Sana özel öneriler için',
  description: 'Birkaç tercih ekle, AI seni daha iyi tanısın.',
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await getServerClient();
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select(
      'city, district, household_type, kids_age_groups, budget_min, budget_max, interests, dietary, dislikes, has_car, has_pet, time_preference',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const initial = prefs
    ? {
        city: prefs.city,
        district: prefs.district,
        household_type: prefs.household_type,
        kids_age_groups: prefs.kids_age_groups ?? [],
        budget_min: prefs.budget_min !== null ? Number(prefs.budget_min) : null,
        budget_max: prefs.budget_max !== null ? Number(prefs.budget_max) : null,
        interests: prefs.interests ?? [],
        dietary: prefs.dietary ?? [],
        dislikes: prefs.dislikes ?? [],
        has_car: prefs.has_car ?? null,
        has_pet: prefs.has_pet ?? null,
        time_preference: prefs.time_preference ?? null,
      }
    : null;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <span className="bg-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI seni tanısın
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Birkaç kısa soru, sana özel öneriler
          </h1>
          <p className="text-muted-foreground mt-3 text-base">
            Tüm alanlar opsiyonel. İstemediğini boş bırakabilirsin — istediğin zaman profilinden
            güncellersin.
          </p>
        </header>

        <OnboardingForm initial={initial} />
      </div>
    </Container>
  );
}
