'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  CookingPot,
  Hotel,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react';
import { formatTRY } from '@/lib/utils/format';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import type { TravelPackage } from '@/lib/ai/travel-package';

interface Props {
  pkg: TravelPackage;
  inventory: DealWithMerchant[];
  destination: string;
  budget: number;
  days: number;
}

function findDeal(inv: DealWithMerchant[], id: string) {
  return inv.find((d) => d.id === id);
}

export function PackageResult({ pkg, inventory, destination, budget, days }: Props) {
  const hotelDeal = findDeal(inventory, pkg.hotel.dealId);
  const diff = pkg.estimatedTotal - budget;
  const diffPercent = budget > 0 ? Math.round((diff / budget) * 100) : 0;
  const overBudget = diff > 0;

  return (
    <div className="space-y-8">
      {/* Vibe header */}
      <header className="text-center">
        <span className="bg-gradient-to-br from-sky-500 to-cyan-500 inline-flex size-12 items-center justify-center rounded-full shadow-lg">
          <Wand2 className="size-6 text-white" aria-hidden="true" />
        </span>
        <p className="text-sky-700 dark:text-sky-300 mt-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI Paket
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {pkg.vibeName}
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm leading-relaxed sm:text-base">
          {pkg.summary}
        </p>
      </header>

      {/* Budget summary */}
      <section className="border-border bg-background rounded-2xl border p-5 shadow-md sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
              <Banknote className="size-3.5" aria-hidden="true" />
              AI tahmini toplam
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {formatTRY(pkg.estimatedTotal)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {days} gün · {destination} · bütçen {formatTRY(budget)}
            </p>
          </div>
          <div
            className={
              overBudget
                ? 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 rounded-xl border p-3'
                : 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border p-3'
            }
          >
            <p
              className={
                overBudget
                  ? 'text-rose-900 dark:text-rose-100 inline-flex items-center gap-1.5 text-xs font-bold'
                  : 'text-emerald-900 dark:text-emerald-100 inline-flex items-center gap-1.5 text-xs font-bold'
              }
            >
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {overBudget
                ? `Bütçeni %${Math.abs(diffPercent)} aşıyor`
                : `Bütçenin %${100 - Math.abs(diffPercent)}'ü kullanıldı`}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px] max-w-[200px] leading-relaxed">
              {pkg.budgetMatch}
            </p>
          </div>
        </div>
      </section>

      {/* Hotel */}
      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 text-base font-bold tracking-tight">
          <Hotel className="text-sky-600 dark:text-sky-400 size-5" aria-hidden="true" />
          Konaklama
        </h2>
        {hotelDeal ? (
          <Link
            href={`/f/${hotelDeal.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group border-border bg-background flex flex-col gap-3 overflow-hidden rounded-2xl border shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-row"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-square sm:w-64 sm:shrink-0">
              <Image
                src={hotelDeal.cover_image}
                alt={hotelDeal.title}
                fill
                sizes="(min-width:640px) 16rem, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                  {[hotelDeal.district, hotelDeal.city].filter(Boolean).join(', ')}
                </p>
                {hotelDeal.rating_avg ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold">
                    <Star
                      className="text-amber-500 size-3.5 fill-current"
                      aria-hidden="true"
                    />
                    {Number(hotelDeal.rating_avg).toFixed(1)}
                  </span>
                ) : null}
              </div>
              <h3 className="text-base font-bold leading-snug tracking-tight">
                {pkg.hotel.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {pkg.hotel.why}
              </p>
              <div className="mt-auto flex items-baseline justify-between gap-2">
                <span className="text-base font-bold tracking-tight">
                  {formatTRY(pkg.hotel.estimatedTotal)}
                </span>
                <span className="text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 text-xs font-bold group-hover:underline">
                  Otele git
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <UnavailableNote dealId={pkg.hotel.dealId} title={pkg.hotel.title} />
        )}
      </section>

      {/* Dining */}
      {pkg.dining.length > 0 ? (
        <PackageList
          title="Yemek"
          icon={<CookingPot className="text-amber-600 dark:text-amber-400 size-5" />}
          items={pkg.dining.map((item) => ({
            ...item,
            chip: item.when,
          }))}
          inventory={inventory}
        />
      ) : null}

      {/* Activities */}
      {pkg.activities.length > 0 ? (
        <PackageList
          title="Aktiviteler"
          icon={<Calendar className="text-violet-600 dark:text-violet-400 size-5" />}
          items={pkg.activities.map((item) => ({
            ...item,
            chip: item.day,
          }))}
          inventory={inventory}
        />
      ) : null}

      {/* Extras */}
      {pkg.extras.length > 0 ? (
        <PackageList
          title="Ekstra deneyimler"
          icon={<Sparkles className="text-fuchsia-600 dark:text-fuchsia-400 size-5" />}
          items={pkg.extras.map((item) => ({ ...item, chip: 'Bonus' }))}
          inventory={inventory}
        />
      ) : null}

      <section className="from-sky-600 via-cyan-500 to-teal-400 rounded-2xl bg-gradient-to-r p-6 text-center text-white shadow-xl">
        <p className="text-sm font-bold opacity-90">Beğendin mi?</p>
        <p className="mt-1 text-lg font-bold tracking-tight sm:text-xl">
          Tüm parçaları tek tek sepetine ekleyebilir veya planı yeniden kurabilirsin.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link
            href={`/tatil/ara?q=${encodeURIComponent(destination)}`}
            className="bg-white/20 hover:bg-white/30 inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold backdrop-blur transition-colors"
          >
            {destination} envanterini gör
          </Link>
          <Link
            href="/tatil/paket"
            className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
          >
            Yeni paket kur
          </Link>
        </div>
      </section>
    </div>
  );
}

interface ListItem {
  dealId: string;
  title: string;
  why: string;
  chip: string;
}

function PackageList({
  title,
  icon,
  items,
  inventory,
}: {
  title: string;
  icon: React.ReactNode;
  items: ListItem[];
  inventory: DealWithMerchant[];
}) {
  return (
    <section>
      <h2 className="mb-3 inline-flex items-center gap-2 text-base font-bold tracking-tight">
        {icon}
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => {
          const deal = findDeal(inventory, item.dealId);
          if (!deal) {
            return (
              <li key={`${item.dealId}-${i}`}>
                <UnavailableNote dealId={item.dealId} title={item.title} />
              </li>
            );
          }
          return (
            <li key={`${item.dealId}-${i}`}>
              <Link
                href={`/f/${deal.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group border-border bg-background flex h-full gap-3 rounded-xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-square size-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={deal.cover_image}
                    alt={deal.title}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="bg-muted text-foreground/70 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {item.chip}
                  </span>
                  <p className="line-clamp-2 text-sm font-bold leading-snug">
                    {item.title}
                  </p>
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                    {item.why}
                  </p>
                  <p className="mt-auto text-xs font-bold">
                    {formatTRY(Number(deal.discounted_price))}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UnavailableNote({ dealId, title }: { dealId: string; title: string }) {
  return (
    <div className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 rounded-xl border p-3">
      <p className="text-amber-900 dark:text-amber-100 inline-flex items-center gap-1.5 text-xs font-bold">
        <Building2 className="size-3.5" aria-hidden="true" />
        {title}
      </p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">
        Envanter güncellenmiş ({dealId.slice(0, 8)}…) — yeniden tasarla.
      </p>
    </div>
  );
}
