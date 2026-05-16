import Image from 'next/image';
import Link from 'next/link';
import { Repeat } from 'lucide-react';
import type { DealShape } from '@/lib/ai/tools';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  step: {
    time: string;
    emoji: string;
    category: string;
    rationale: string;
    deal: DealShape | null;
  } | null;
  replaced: boolean;
}

/**
 * replaceDayPlanStep tool çıktısını gösterir. Mevcut bir gün planının tek
 * bir adımının yerine geçen yeni adımı, "Yeni X. adım" başlığıyla küçük bir
 * kart olarak render eder. Tüm plan'ı yeniden çizmiyoruz — kullanıcı
 * konuşmadaki önceki kartı zaten görüyor.
 */
export function SwappedStepCard({ step, replaced }: Props) {
  if (!replaced || !step) {
    return (
      <div className="border-amber-500/30 bg-amber-500/10 rounded-xl border p-3 text-sm">
        Bu adıma uygun yeni bir aday bulamadım. Daha farklı bir kriter dener misin?
      </div>
    );
  }

  const deal = step.deal;

  return (
    <div className="border-border bg-background overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/40 flex items-center gap-2 border-b px-4 py-2.5 text-sm font-medium">
        <Repeat className="size-4" aria-hidden="true" />
        Yeni {step.category.toLowerCase()} adımı
      </div>
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="flex w-12 shrink-0 flex-col items-center gap-0.5 pt-0.5 sm:w-16">
          <span className="text-xl" aria-hidden="true">{step.emoji}</span>
          <span className="text-foreground/80 text-xs font-mono">{step.time}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {step.category}
          </p>
          {deal ? (
            <Link
              href={`/f/${deal.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted/40 -mx-2 mt-1 flex gap-3 rounded-md p-2 transition-colors"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={deal.coverImage}
                  alt={deal.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm leading-snug font-semibold">{deal.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {[deal.district, deal.city].filter(Boolean).join(', ')}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{formatTRY(deal.price)}</p>
              </div>
            </Link>
          ) : (
            <p className="text-muted-foreground mt-1 text-xs">
              Bu adıma uygun aday bulunamadı.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
