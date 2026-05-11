import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { MatchedDeal } from '@/lib/ai/rag';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  deal: MatchedDeal;
  reason: string;
  rank: number;
}

export function PickCard({ deal, reason, rank }: Props) {
  const discount = deal.discount_percent;
  const showDiscount = discount > 0 && deal.discounted_price < deal.original_price;
  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return (
    <Card className="group flex h-full flex-col">
      <div className="border-violet-500/20 bg-violet-500/10 flex items-start gap-3 border-b p-4">
        <span className="bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {String(rank).padStart(2, '0')}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300">
            <Sparkles className="size-3" aria-hidden="true" />
            AI seçimi
          </span>
          <p className="text-foreground/85 text-sm leading-snug">{reason}</p>
        </div>
      </div>

      <Link
        href={`/f/${deal.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={deal.title}
      >
        <Image
          src={deal.cover_image}
          alt={deal.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {showDiscount ? (
          <div className="absolute top-3 right-3">
            <Badge variant="discount" size="md">
              %{discount} indirim
            </Badge>
          </div>
        ) : null}
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <Link href={`/f/${deal.slug}`} className="hover:underline">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold">{deal.title}</h3>
        </Link>
        {location ? (
          <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <MapPin className="size-3.5" aria-hidden="true" />
            {location}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="border-border mt-auto border-t pt-4">
        <div className="flex flex-col gap-0.5">
          {showDiscount ? (
            <span className="text-muted-foreground text-xs line-through">
              {formatTRY(deal.original_price)}
            </span>
          ) : null}
          <span className="text-lg font-semibold">{formatTRY(deal.discounted_price)}</span>
        </div>
        <Link
          href={`/f/${deal.slug}`}
          className="text-foreground/80 hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
        >
          İncele &rarr;
        </Link>
      </CardFooter>
    </Card>
  );
}
