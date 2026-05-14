import { CheckCircle2, Info, Sparkles } from 'lucide-react';
import { getOrGenerateReviewSummary } from '@/lib/ai/review-summary';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  dealId: string;
}

/**
 * Deal sayfasında yorumlar üstünde AI ile üretilmiş özet. Cache hit'inde
 * 30ms civarı, miss'te Gemini Flash + DB upsert ~3s. <Suspense> içine sar
 * ki sayfa beklemesin.
 *
 * < 3 yorum varsa hiç render etmez — kullanıcıya "özet alacak yeterli
 * yorum yok" göstermek değer üretmez.
 */
export async function AiReviewSummary({ dealId }: Props) {
  const data = await getOrGenerateReviewSummary(dealId);
  if (!data) return null;

  return (
    <section
      aria-label="AI özeti"
      className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-background relative mb-6 overflow-hidden rounded-xl border p-5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-emerald-500/15 blur-3xl"
      />

      <header className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold tracking-tight">
          AI özeti — {data.reviewCount} yorumdan
        </h3>
        <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ms-auto rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
          Gemini
        </span>
      </header>

      <p className="text-foreground/90 text-sm leading-relaxed">{data.summary}</p>

      {data.positiveThemes.length > 0 || data.cautionNotes.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.positiveThemes.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase">
                <CheckCircle2 className="size-3 text-emerald-600" aria-hidden="true" />
                Öne çıkanlar
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {data.positiveThemes.map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.cautionNotes.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase">
                <Info className="size-3 text-amber-600" aria-hidden="true" />
                Dikkat
              </p>
              <ul className="flex flex-col gap-1">
                {data.cautionNotes.map((n) => (
                  <li
                    key={n}
                    className="text-foreground/80 text-xs leading-relaxed"
                  >
                    • {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function AiReviewSummarySkeleton() {
  return (
    <section
      aria-label="AI özeti yükleniyor"
      className="border-emerald-500/20 bg-emerald-500/5 mb-6 rounded-xl border p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-emerald-600/50" aria-hidden="true" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
    </section>
  );
}
