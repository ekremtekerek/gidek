import Image from 'next/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { formatTRY } from '@/lib/utils/format';
import type { DealShape } from '@/lib/ai/tools';

interface PlanStep {
  time: string;
  emoji: string;
  category: string;
  rationale: string;
  deal: DealShape | null;
}

interface Props {
  plan: {
    steps: PlanStep[];
    totalPrice: number;
  };
}

export function DayPlanDisplay({ plan }: Props) {
  return (
    <div className="border-border bg-background overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/40 flex items-center gap-2 border-b px-4 py-2.5 text-sm font-medium">
        <Calendar className="size-4" aria-hidden="true" />
        Gün planı
      </div>
      <ol className="divide-y divide-[var(--border)]">
        {plan.steps.map((s, i) => (
          <li key={i} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="flex w-12 shrink-0 flex-col items-center gap-0.5 pt-0.5 sm:w-16">
              <span className="text-xl" aria-hidden="true">
                {s.emoji}
              </span>
              <span className="text-foreground/80 text-xs font-mono">{s.time}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {s.category}
              </p>

              {s.deal ? (
                <Link
                  href={`/f/${s.deal.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-muted/40 -mx-2 mt-1 flex gap-3 rounded-md p-2 transition-colors"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={s.deal.coverImage}
                      alt={s.deal.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm leading-snug font-semibold">
                      {s.deal.title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {[s.deal.district, s.deal.city].filter(Boolean).join(', ')}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">{formatTRY(s.deal.price)}</p>
                  </div>
                </Link>
              ) : (
                <p className="text-muted-foreground mt-1 text-xs">
                  Bu adıma uygun aday bulunamadı.
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="border-border bg-muted/30 flex items-center justify-between border-t px-4 py-3 text-sm">
        <span className="text-muted-foreground">Toplam tutar</span>
        <span className="text-base font-semibold">{formatTRY(plan.totalPrice)}</span>
      </div>
    </div>
  );
}
