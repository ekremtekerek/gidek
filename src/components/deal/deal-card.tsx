import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatTRY } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface DealCardProps {
  deal: DealWithMerchant;
  className?: string;
  priority?: boolean;
}

export function DealCard({ deal, className, priority = false }: DealCardProps) {
  const discount = deal.discount_percent ?? 0;
  const showDiscount = discount > 0 && deal.discounted_price < deal.original_price;
  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return (
    <Card className={cn('group flex h-full flex-col', className)}>
      <Link
        href={`/f/${deal.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={deal.title}
      >
        <Image
          src={deal.cover_image}
          alt={deal.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {deal.is_featured ? <Badge variant="accent" size="sm">Öne çıkan</Badge> : <span />}
          {showDiscount ? (
            <Badge variant="discount" size="md">%{discount} indirim</Badge>
          ) : null}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <Link href={`/f/${deal.slug}`} className="hover:underline">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold">{deal.title}</h3>
        </Link>
        {deal.subtitle ? (
          <p className="text-muted-foreground line-clamp-1 text-sm">{deal.subtitle}</p>
        ) : null}
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
