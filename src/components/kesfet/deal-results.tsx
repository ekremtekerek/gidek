import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTRY } from '@/lib/utils/format';
import type { DealShape } from '@/lib/ai/tools';

interface Props {
  deals: DealShape[];
}

export function DealResults({ deals }: Props) {
  if (deals.length === 0) {
    return (
      <div className="border-border bg-muted/30 rounded-lg border p-4 text-sm">
        Uygun aday bulamadım — sorgunu biraz daha açık yazmayı dene.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {deals.map((d) => (
        <li key={d.id}>
          <Link
            href={`/f/${d.slug}`}
            className="border-border bg-background hover:border-foreground/30 group flex gap-3 overflow-hidden rounded-lg border p-2.5 transition-colors"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md sm:size-24">
              <Image
                src={d.coverImage}
                alt={d.title}
                fill
                sizes="96px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {d.discountPct > 0 ? (
                <div className="absolute right-1 bottom-1">
                  <Badge variant="discount" size="sm">
                    %{d.discountPct}
                  </Badge>
                </div>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm leading-snug font-semibold">{d.title}</p>
                {(d.district || d.city) ? (
                  <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-1 text-[11px]">
                    <MapPin className="size-3" aria-hidden="true" />
                    {[d.district, d.city].filter(Boolean).join(', ')}
                  </p>
                ) : null}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold">{formatTRY(d.price)}</span>
                <span className="text-foreground/70 inline-flex items-center gap-0.5 text-xs">
                  İncele
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
