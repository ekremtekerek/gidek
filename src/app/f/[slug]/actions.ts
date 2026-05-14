'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/db/server';
import { getUserReviewEligibility } from '@/lib/db/queries/reviews';
import { requireUser } from '@/lib/security/auth';
import { createReviewSchema } from '@/lib/security/validators';

export type ReviewState =
  | { ok: true }
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

/**
 * "Verified buyer" yorum gönderimi. Eligibility kontrolünü server tarafında
 * tekrar yapar — formun gösterildiği an ile submit anı arasında booking iptal
 * edilmiş olabilir, ya da kullanıcı başka bir tabdan yorum bırakmış olabilir.
 */
export async function createReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const user = await requireUser();

  const parsed = createReviewSchema.safeParse({
    dealId: formData.get('dealId'),
    rating: formData.get('rating'),
    body: formData.get('body'),
    displayName: formData.get('displayName'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const eligibility = await getUserReviewEligibility(parsed.data.dealId);
  if (!eligibility.canReview) {
    const msg =
      eligibility.reason === 'no_booking'
        ? 'Yorum yapmak için bu fırsattan rezervasyon almış olmalısın.'
        : eligibility.reason === 'already_reviewed'
        ? 'Bu fırsat için zaten yorum bıraktın.'
        : 'Yorum yapmak için giriş yapmalısın.';
    return { ok: false, error: msg };
  }

  const displayName = parsed.data.displayName ?? eligibility.defaultName;

  const supabase = await getServerClient();
  const { data: deal, error: dErr } = await supabase
    .from('deals')
    .select('id, slug')
    .eq('id', parsed.data.dealId)
    .maybeSingle();
  if (dErr || !deal) return { ok: false, error: 'Fırsat bulunamadı.' };

  const { error: iErr } = await supabase.from('reviews').insert({
    deal_id: deal.id,
    user_id: user.id,
    display_name: displayName,
    rating: parsed.data.rating,
    body: parsed.data.body,
  });

  if (iErr) {
    // 23505: unique_violation — eligibility check ile yarıştık.
    if (iErr.code === '23505') {
      return { ok: false, error: 'Bu fırsat için zaten yorum bıraktın.' };
    }
    return { ok: false, error: 'Yorum kaydedilemedi.' };
  }

  revalidatePath(`/f/${deal.slug}`);
  return { ok: true };
}
