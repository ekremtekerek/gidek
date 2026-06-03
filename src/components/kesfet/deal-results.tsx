import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { WhyRecommended } from '@/components/kesfet/why-recommended';
import { Badge } from '@/components/ui/badge';
import type { DealShape } from '@/lib/ai/tools';
import { DEAL_TAG_LABEL } from '@/lib/utils/constants';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  deals: DealShape[];
  /** Kullanıcının bu öneriyi tetikleyen son mesajı — "Neden bu öneri?" bağlamı. */
  userQuery?: string;
}

/**
 * Rich deal cards rendered inside an AI message. Vertical stack on mobile,
 * still vertical on desktop but with wider images so the cards feel like a
 * curated recommendation list rather than a search result row.
 */
export function DealResults({ deals, userQuery }: Props) {
  if (deals.length === 0) {
    return (
      <div className="border-border bg-muted/30 rounded-xl border p-4 text-sm">
        Uygun aday bulamadım — sorgunu biraz daha açık yazmayı dener misin?
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-3.5">
      {deals.map((d, idx) => (
        <li key={d.id} className="relative">
          {/* WhyRecommended Link DIŞINDA — popover overflow:hidden tarafından kesilmesin,
              ve butona tıklama Link navigasyonunu tetiklemesin. */}
          <div className="absolute top-3 right-3 z-10">
            <WhyRecommended dealId={d.id} userQuery={userQuery} />
          </div>

          <Link
            href={`/f/${d.slug}`}
            className="group border-border bg-background hover:border-foreground/30 block overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Cover image — taller on mobile, square-ish on desktop */}
              <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-square sm:w-44 sm:shrink-0 lg:w-48">
                <Image
                  src={d.coverImage}
                  alt={d.title}
                  fill
                  sizes="(min-width: 1024px) 192px, (min-width: 640px) 176px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={idx === 0}
                />
                {/* Subtle gradient so overlays read well */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"
                />
                {/* Rank + discount badge */}
                <div className="absolute inset-x-3 top-3 flex items-start justify-between">
                  <span className="bg-background/85 text-foreground inline-flex size-7 items-center justify-center rounded-full text-xs font-bold backdrop-blur">
                    {idx + 1}
                  </span>
                  {d.discountPct > 0 ? (
                    <Badge variant="discount" size="md" className="me-10">
                      %{d.discountPct} indirim
                    </Badge>
                  ) : null}
                </div>
                {/* Mobile-only tag pills over image to save vertical space */}
                {d.tags.length > 0 ? (
                  <div className="absolute right-3 bottom-3 left-3 flex flex-wrap gap-1.5 sm:hidden">
                    {d.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur"
                      >
                        {DEAL_TAG_LABEL[t] ?? t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                <h3 className="line-clamp-2 text-base leading-snug font-semibold sm:text-lg">
                  {d.title}
                </h3>

                {d.subtitle ? (
                  <p className="text-muted-foreground line-clamp-1 text-sm">{d.subtitle}</p>
                ) : null}

                {d.district || d.city ? (
                  <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{[d.district, d.city].filter(Boolean).join(', ')}</span>
                    {d.venue ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{d.venue}</span>
                      </>
                    ) : null}
                  </p>
                ) : null}

                {/* Desktop tag chips */}
                {d.tags.length > 0 ? (
                  <ul className="hidden flex-wrap gap-1.5 pt-0.5 sm:flex">
                    {d.tags.slice(0, 4).map((t) => (
                      <li
                        key={t}
                        className="bg-muted text-foreground/80 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                      >
                        {DEAL_TAG_LABEL[t] ?? t}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="border-border mt-auto flex items-end justify-between border-t pt-3">
                  <div className="flex items-baseline gap-1.5">
                    {d.discountPct > 0 ? (
                      <span className="text-muted-foreground text-xs line-through">
                        {formatTRY(d.originalPrice)}
                      </span>
                    ) : null}
                    <span className="text-lg font-bold tracking-tight sm:text-xl">
                      {formatTRY(d.price)}
                    </span>
                  </div>
                  <span className="text-foreground/70 group-hover:text-foreground inline-flex items-center gap-0.5 text-xs font-medium transition-transform group-hover:translate-x-0.5">
                    İncele
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
