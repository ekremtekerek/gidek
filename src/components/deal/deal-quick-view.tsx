'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { isDealExpired } from '@/lib/utils/deal-status';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { formatTRY } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface Props {
  deal: DealWithMerchant | null;
  /** Modal kapanma isteği — backdrop click, ESC, X butonu, action click. */
  onClose: () => void;
}

/**
 * Carousel/grid'lerden hızlı önizleme için kullanılan modal. Kapak + temel
 * bilgi + 2 aksiyon (incele, rezervasyon). Detay sayfasına gitmeden hızlıca
 * göz atmak için. Modal native dialog yerine basit overlay; KVKK/ödeme gibi
 * blocking durumda da yumuşak görünsün diye.
 */
export function DealQuickView({ deal, onClose }: Props) {
  // ESC close.
  useEffect(() => {
    if (!deal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // body scroll'u kilitle.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [deal, onClose]);

  if (!deal) return null;

  const discount = deal.discount_percent ?? 0;
  const showDiscount = discount > 0 && deal.discounted_price < deal.original_price;
  const location = [deal.district, deal.city].filter(Boolean).join(', ');
  const expired = isDealExpired(deal);
  const ratingAvg = deal.rating_avg ? Number(deal.rating_avg) : null;
  const ratingCount = deal.rating_count ?? 0;
  const hasRating = ratingAvg !== null && ratingCount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={deal.title}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-background relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={deal.cover_image}
            alt={deal.title}
            fill
            sizes="448px"
            className={cn('object-cover', expired && 'grayscale')}
            priority
          />
          {expired ? (
            <Badge variant="outline" size="sm" className="bg-background/95 absolute top-3 left-3 backdrop-blur">
              Bu fırsat kaçtı
            </Badge>
          ) : showDiscount ? (
            <Badge variant="discount" size="md" className="absolute top-3 left-3">
              %{discount} indirim
            </Badge>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="bg-background/85 text-foreground hover:bg-background absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
          <h2 className="text-xl font-semibold leading-tight tracking-tight">{deal.title}</h2>
          {deal.subtitle ? (
            <p className="text-muted-foreground text-sm">{deal.subtitle}</p>
          ) : null}

          <ul className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {deal.merchant ? (
              <li>
                <Link href={`/m/${deal.merchant.slug}`} className="hover:text-foreground hover:underline">
                  {deal.merchant.name}
                </Link>
              </li>
            ) : null}
            {location ? (
              <li className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {location}
              </li>
            ) : null}
            {hasRating ? (
              <li className="inline-flex items-center gap-1">
                <Star className="size-3 fill-current text-amber-500" aria-hidden="true" />
                {ratingAvg!.toFixed(1)} ({ratingCount})
              </li>
            ) : null}
          </ul>

          <p className="text-foreground/90 line-clamp-4 text-sm leading-relaxed">
            {deal.description}
          </p>
        </div>

        {/* Footer */}
        <div className="border-border bg-background flex items-center justify-between gap-3 border-t p-4">
          <div className="flex flex-col">
            {showDiscount && !expired ? (
              <span className="text-muted-foreground text-xs line-through">
                {formatTRY(deal.original_price)}
              </span>
            ) : null}
            <span
              className={cn(
                'text-xl font-semibold',
                expired ? 'text-muted-foreground' : null,
              )}
            >
              {formatTRY(deal.discounted_price)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/f/${deal.slug}`}
              onClick={onClose}
              className={cn(buttonVariants({ variant: 'outline', size: 'md' }))}
            >
              İncele
            </Link>
            {expired ? null : (
              <Link
                href={`/rezervasyon/${deal.slug}`}
                onClick={onClose}
                className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'gap-1.5')}
              >
                Rezervasyon
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Quick view" button — DealCard'ın üzerinde overlay olarak gösterilir. */
export function QuickViewButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="bg-background/95 backdrop-blur"
    >
      Hızlı bak
    </Button>
  );
}
