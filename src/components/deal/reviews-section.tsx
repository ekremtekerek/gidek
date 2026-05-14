import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, LogIn, Star, Ticket } from 'lucide-react';
import {
  AiReviewSummary,
  AiReviewSummarySkeleton,
} from '@/components/deal/ai-review-summary';
import { ReviewForm } from '@/components/deal/review-form';
import {
  getUserReviewEligibility,
  listReviewsForDeal,
  summariseReviews,
} from '@/lib/db/queries/reviews';
import { cn } from '@/lib/utils/cn';

interface Props {
  dealId: string;
  dealSlug: string;
}

/**
 * Detay sayfasında yorumlar — ortalama puan kartı + 1-5 yıldız dağılım barları
 * + yorum kartları listesi. Yorum yoksa kompakt empty state.
 */
export async function ReviewsSection({ dealId, dealSlug }: Props) {
  const [reviews, eligibility] = await Promise.all([
    listReviewsForDeal(dealId, 24),
    getUserReviewEligibility(dealId),
  ]);
  const stats = summariseReviews(reviews);

  return (
    <section
      aria-labelledby="reviews-heading"
      className="border-border border-t pt-10"
      id="yorumlar"
    >
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Müşteri görüşleri
        </p>
        <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight">
          Yorumlar &amp; puanlar
        </h2>
      </div>

      <Suspense fallback={<AiReviewSummarySkeleton />}>
        <AiReviewSummary dealId={dealId} />
      </Suspense>

      {eligibility.canReview ? (
        <ReviewForm dealId={dealId} defaultName={eligibility.defaultName} />
      ) : (
        <EligibilityNote reason={eligibility.reason} dealSlug={dealSlug} />
      )}

      {stats.count === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-6 text-center text-sm">
          Bu fırsat için henüz yorum yok. Rezervasyon sahipleri yazabilir — ilk sen ol.
        </p>
      ) : (
        <>
          <div className="border-border bg-background mb-6 grid grid-cols-1 gap-6 rounded-xl border p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
            <SummaryCard average={stats.average} count={stats.count} />
            <DistributionBars distribution={stats.distribution} total={stats.count} />
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function EligibilityNote({
  reason,
  dealSlug,
}: {
  reason: 'unauth' | 'no_booking' | 'already_reviewed';
  dealSlug: string;
}) {
  if (reason === 'already_reviewed') {
    return (
      <div className="border-emerald-500/30 bg-emerald-500/10 text-foreground mb-6 flex items-start gap-3 rounded-xl border p-4">
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium">Yorumun yayında — teşekkürler!</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Bu fırsat için bir yorum bıraktın. Bir kullanıcı her fırsata yalnızca tek yorum
            yazabilir.
          </p>
        </div>
      </div>
    );
  }

  if (reason === 'no_booking') {
    return (
      <div className="border-border bg-muted/40 mb-6 flex items-start gap-3 rounded-xl border p-4">
        <Ticket className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium">Yorum sadece rezervasyon sahiplerine açık</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Bu fırsattan en az bir rezervasyon yaptıktan sonra deneyimini paylaşabilirsin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border bg-muted/40 mb-6 flex items-start gap-3 rounded-xl border p-4 sm:items-center">
      <LogIn className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Yorum yapmak için giriş yap</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Rezervasyon yaptığın fırsatlar için yıldız + yorum bırakabilirsin.
        </p>
      </div>
      <Link
        href={`/giris?next=/f/${dealSlug}#yorumlar`}
        className="border-border bg-background hover:bg-muted shrink-0 inline-flex h-9 items-center rounded-md border px-3 text-xs font-medium transition-colors"
      >
        Giriş yap
      </Link>
    </div>
  );
}

function SummaryCard({ average, count }: { average: number | null; count: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 sm:items-start">
      <span className="text-5xl font-semibold tracking-tight tabular-nums">
        {average?.toFixed(1) ?? '–'}
      </span>
      <Stars value={average ?? 0} size={20} />
      <span className="text-muted-foreground text-xs">{count} değerlendirme</span>
    </div>
  );
}

function DistributionBars({
  distribution,
  total,
}: {
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  total: number;
}) {
  const rows = [5, 4, 3, 2, 1] as const;
  return (
    <div className="flex flex-col justify-center gap-1.5">
      {rows.map((r) => {
        const n = distribution[r];
        const pct = total === 0 ? 0 : Math.round((n / total) * 100);
        return (
          <div key={r} className="grid grid-cols-[2.5rem_1fr_3rem] items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-medium">
              {r}
              <Star className="size-3 fill-current text-amber-500" aria-hidden="true" />
            </span>
            <div className="bg-muted relative h-2 overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-muted-foreground text-right tabular-nums">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: { display_name: string; rating: number; body: string; created_at: string } }) {
  const initials = review.display_name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="border-border bg-background flex flex-col gap-2.5 rounded-xl border p-4">
      <header className="flex items-center gap-3">
        <span className="bg-muted text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{review.display_name}</p>
          <p className="text-muted-foreground text-[11px]">{date}</p>
        </div>
        <Stars value={review.rating} size={14} />
      </header>
      <p className="text-foreground/90 text-sm leading-relaxed">{review.body}</p>
    </article>
  );
}

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'transition-colors',
            i <= Math.round(value)
              ? 'fill-amber-500 text-amber-500'
              : 'fill-transparent text-amber-500/30',
          )}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
