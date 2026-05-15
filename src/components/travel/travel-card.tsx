import Image from 'next/image';
import Link from 'next/link';
import {
  Coffee,
  Gem,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Star,
  Umbrella,
  Waves,
} from 'lucide-react';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import {
  CONCEPT_ACCENT,
  CONCEPT_LABEL,
  enrichTravelDeal,
  FEATURE_LABEL,
  type TravelFeature,
} from '@/lib/travel/enrich';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  deal: DealWithMerchant;
  priority?: boolean;
  /** Liste mi yatay grid mi — pratikte aynı görünüm ama hint */
  variant?: 'grid' | 'list';
}

const FEATURE_ICON: Partial<Record<TravelFeature, typeof Coffee>> = {
  pool: Waves,
  spa: Sparkles,
  beach: Umbrella,
  'sea-view': Waves,
  'kids-club': PartyPopper,
  'all-inclusive': Gem,
  breakfast: Coffee,
  transfer: ShieldCheck,
};

/**
 * Tatil sonuçları için zenginleştirilmiş kart.
 * - Konsept rozeti (gradient)
 * - Yıldız (tahmini)
 * - 3 özellik ikonu
 * - Kişi başı fiyat + toplam tahmin
 * - İndirim badge
 */
export function TravelCard({ deal, priority = false }: Props) {
  const meta = enrichTravelDeal(deal);
  const location = [deal.district, deal.city].filter(Boolean).join(', ');
  const original = Number(deal.original_price);
  const price = Number(deal.discounted_price);
  const showDiscount = price < original;
  const discount = showDiscount ? Math.round((1 - price / original) * 100) : 0;
  const totalForCouple = price * 2; // 2 yetişkin tahminî
  const topFeatures = meta.features.slice(0, 3);

  return (
    <Link
      href={`/f/${deal.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Görsel + üst rozetler */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={deal.cover_image}
          alt={deal.title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          priority={priority}
        />

        {/* Üstte konsept rozeti */}
        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md',
            CONCEPT_ACCENT[meta.concept],
          )}
        >
          {CONCEPT_LABEL[meta.concept]}
        </span>

        {/* Üst sağ — indirim */}
        {discount > 0 ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
            %{discount} indirim
          </span>
        ) : null}

        {/* Alt — beach/sea-view etiketi */}
        {meta.beachLabel ? (
          <span className="bg-foreground/80 text-background absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur">
            <Umbrella className="size-3" aria-hidden="true" />
            {meta.beachLabel}
          </span>
        ) : null}
      </div>

      {/* İçerik */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Lokasyon + yıldız */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <MapPin className="size-3" aria-hidden="true" />
            {location || 'Türkiye'}
          </p>
          <span className="inline-flex items-center gap-0.5" aria-label={`${meta.stars} yıldız`}>
            {Array.from({ length: meta.stars }).map((_, i) => (
              <Star
                key={i}
                className="size-3 fill-amber-500 text-amber-500"
                aria-hidden="true"
              />
            ))}
          </span>
        </div>

        {/* Başlık */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{deal.title}</h3>

        {/* Özellik ikonları */}
        {topFeatures.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {topFeatures.map((f) => {
              const Icon = FEATURE_ICON[f];
              if (!Icon) return null;
              return (
                <li
                  key={f}
                  className="border-border bg-muted/40 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  title={FEATURE_LABEL[f]}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {FEATURE_LABEL[f]}
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* Gece + fiyat */}
        <div className="border-border mt-auto flex items-end justify-between gap-2 border-t pt-2">
          <div className="text-[11px]">
            <p className="text-muted-foreground">
              {meta.nights > 1 ? `${meta.nights} gece` : 'Konaklama'} · 2 yetişkin
            </p>
            <p className="text-muted-foreground mt-0.5">
              Toplam ~{' '}
              <span className="text-foreground font-semibold tabular-nums">
                {formatTRY(totalForCouple)}
              </span>
            </p>
          </div>
          <div className="text-right">
            {showDiscount ? (
              <p className="text-muted-foreground text-[10px] line-through tabular-nums">
                {formatTRY(original)}
              </p>
            ) : null}
            <p className="text-base font-bold tracking-tight tabular-nums">{formatTRY(price)}</p>
            <p className="text-muted-foreground text-[10px]">kişi başı</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
