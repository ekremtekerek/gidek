'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  dealSlug: string;
  expired: boolean;
  originalPrice: number | string;
  discountedPrice: number | string;
  discountPercent: number | null;
}

/**
 * Mobile sticky bottom CTA — deal detayda kullanıcı scroll edip yan
 * sidebar'daki fiyat kutusunu görmediği anda alt'a yapışan kompakt
 * fiyat + Rezervasyon Yap çubuğu. Bottom-nav ile çakışmamak için onun
 * üstünde durur (z-40 < bottom-nav z-30? Hayır — bottom-nav z-30, CTA
 * z-40 üstte).
 *
 * Expired deal'larda render edilmez (parent koşullu kontrol ediyor zaten).
 */
export function StickyCta({
  dealSlug,
  expired,
  originalPrice,
  discountedPrice,
  discountPercent,
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (expired) return;
    // Scroll 600px geçince göster. Top'tayken gizle (üst sidebar CTA görünür).
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [expired]);

  if (expired || !show) return null;

  const discount = discountPercent ?? 0;
  const showDiscount = discount > 0 && Number(discountedPrice) < Number(originalPrice);
  // Anon kullanıcı için /rezervasyon sayfası requireUser ile login'e yönlendirir.
  const href = `/rezervasyon/${dealSlug}`;

  return (
    <div
      // BottomNav md altı render olur ve h~64px; üzerine yığalım.
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      className="bg-background/95 border-border fixed inset-x-0 bottom-[64px] z-40 border-t backdrop-blur md:hidden"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          {showDiscount ? (
            <span className="text-muted-foreground text-[11px] line-through">
              {formatTRY(originalPrice)}
            </span>
          ) : null}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold">{formatTRY(discountedPrice)}</span>
            {showDiscount ? (
              <Badge variant="discount" size="sm">
                %{discount}
              </Badge>
            ) : null}
          </div>
        </div>
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: 'primary', size: 'lg' }),
            'shrink-0 gap-2',
          )}
        >
          <Calendar className="size-4" aria-hidden="true" />
          Rezervasyon Yap
        </Link>
      </div>
    </div>
  );
}
