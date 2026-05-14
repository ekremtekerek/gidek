'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { getUserReviewEligibility } from '@/lib/db/queries/reviews';
import { evaluateAndGrantBadges } from '@/lib/gamification/badges';
import { updateStreak } from '@/lib/gamification/streak';
import { getCurrentMerchantId, requireUser } from '@/lib/security/auth';
import { createReviewSchema } from '@/lib/security/validators';

export type ReviewState =
  | { ok: true }
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

export type ReviewReplyState =
  | { ok: true }
  | { ok: false; error: string }
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

  // Foto URL'leri — formdan tüm 'photoUrls[]' değerlerini al, max 4
  const photoUrls = formData
    .getAll('photoUrls[]')
    .map((v) => String(v).trim())
    .filter((u) => u.length > 0 && /^https?:\/\//.test(u))
    .slice(0, 4);

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

  const { data: inserted, error: iErr } = await supabase
    .from('reviews')
    .insert({
      deal_id: deal.id,
      user_id: user.id,
      display_name: displayName,
      rating: parsed.data.rating,
      body: parsed.data.body,
    })
    .select('id')
    .single();

  if (iErr || !inserted) {
    // 23505: unique_violation — eligibility check ile yarıştık.
    if (iErr?.code === '23505') {
      return { ok: false, error: 'Bu fırsat için zaten yorum bıraktın.' };
    }
    return { ok: false, error: 'Yorum kaydedilemedi.' };
  }

  // Foto'ları ekle — best effort; foto eklerken hata oluşsa bile yorum
  // kaydedildi, kullanıcı ileride foto ekleyebilir.
  if (photoUrls.length > 0) {
    await supabase.from('review_photos').insert(
      photoUrls.map((url, i) => ({
        review_id: inserted.id,
        url,
        sort_order: i,
      })),
    );
  }

  // Streak + rozet değerlendirme — fire-and-forget; yorum yazma da haftalık
  // aktivite sayılır.
  void (async () => {
    try {
      await updateStreak(user.id);
      await evaluateAndGrantBadges(user.id);
    } catch (err) {
      console.error('[gamification] post-review failed:', err);
    }
  })();

  revalidatePath(`/f/${deal.slug}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Yorum cevabı — auth user yoruma cevap yazabilir. Merchant'sa otomatik
// is_merchant_reply=true (mor rozet UI'da). Tek yorum başına çoklu cevap OK.
// ---------------------------------------------------------------------------

const replySchema = z.object({
  reviewId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(2, 'En az 2 karakter')
    .max(500, 'En fazla 500 karakter'),
});

export async function createReviewReplyAction(
  _prev: ReviewReplyState,
  formData: FormData,
): Promise<ReviewReplyState> {
  const user = await requireUser();

  const parsed = replySchema.safeParse({
    reviewId: formData.get('reviewId'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz istek.' };
  }

  const admin = getServiceClient();
  // Yorumun ait olduğu deal'in merchant'ı bu user mı? → is_merchant_reply
  const { data: review } = await admin
    .from('reviews')
    .select('deal:deals ( id, slug, merchant_id )')
    .eq('id', parsed.data.reviewId)
    .maybeSingle();

  if (!review) return { ok: false, error: 'Yorum bulunamadı.' };

  const dealRel = review.deal as
    | { id: string; slug: string; merchant_id: string | null }
    | { id: string; slug: string; merchant_id: string | null }[]
    | null;
  const deal = Array.isArray(dealRel) ? dealRel[0] : dealRel;
  if (!deal) return { ok: false, error: 'Fırsat bulunamadı.' };

  const userMerchantId = await getCurrentMerchantId(user);
  const isMerchantReply = Boolean(
    userMerchantId && deal.merchant_id && userMerchantId === deal.merchant_id,
  );

  // Profile.display_name kullan, yoksa email prefix
  const supabase = await getServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();
  const displayName =
    (profile?.display_name?.trim() || user.email?.split('@')[0] || 'Üye').slice(0, 80);

  const { error } = await supabase.from('review_replies').insert({
    review_id: parsed.data.reviewId,
    user_id: user.id,
    display_name: displayName,
    body: parsed.data.body,
    is_merchant_reply: isMerchantReply,
  });

  if (error) return { ok: false, error: 'Cevap kaydedilemedi.' };

  revalidatePath(`/f/${deal.slug}`);
  return { ok: true };
}
