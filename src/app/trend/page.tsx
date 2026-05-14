import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Container } from '@/components/ui/container';
import {
  getTrendingCategories,
  getTrendingDeals,
  getTrendStats,
} from '@/lib/db/queries/trends';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { CATEGORY_STYLE } from '@/lib/utils/category-styles';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Trend — bu hafta gidek\'te neler oluyor',
  description:
    'Son 7 günde gidek.net üzerinde en çok rezerve edilen fırsatlar, yükselişteki kategoriler ve canlı istatistikler.',
  alternates: { canonical: '/trend' },
  openGraph: {
    type: 'website',
    title: 'Trend · gidek',
    description: 'gidek.net üzerinde bu haftanın en popüler fırsatları.',
    url: `${SITE.url}/trend`,
  },
};

// ISR — 15 dk'da bir trend datası güncellenir
export const revalidate = 900;

export default async function TrendPage() {
  const [deals, categories, stats] = await Promise.all([
    getTrendingDeals(6),
    getTrendingCategories(5),
    getTrendStats(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          Son 7 gün
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Bu hafta gidek&apos;te neler oluyor?
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Gerçek rezervasyon verisinden, anlık. Bizim seçtiğimiz değil —
          insanların seçtiği.
        </p>
      </header>

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Aktif fırsat" value={stats.totalDeals} Icon={Sparkles} />
        <StatCard label="Toplam rezervasyon" value={stats.totalBookings} Icon={Flame} />
        <StatCard label="Üye" value={stats.totalUsers} Icon={Users} />
        <StatCard label="Son 7 gün" value={stats.bookings7d} Icon={TrendingUp} accent />
      </section>

      <section className="mb-12">
        <header className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Trending bu hafta
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              En çok rezerve edilenler
            </h2>
          </div>
          {deals.length > 0 ? (
            <span className="text-muted-foreground text-xs">
              Son 7 günün satış sıralaması
            </span>
          ) : null}
        </header>

        {deals.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center text-sm">
            Bu hafta için trending verisi henüz oluşmadı.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((d, idx) => {
              const showDiscount = d.discountedPrice < d.originalPrice;
              return (
                <li key={d.id}>
                  <Link
                    href={`/f/${d.slug}`}
                    className="group border-border bg-background hover:border-foreground/30 block overflow-hidden rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={d.coverImage}
                        alt={d.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        priority={idx < 3}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                      />
                      <span className="bg-rose-600 text-white absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        <Flame className="size-3" aria-hidden="true" />
                        #{idx + 1}
                      </span>
                      <span className="text-white absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur">
                        {d.bookings7d} rezervasyon
                      </span>
                      <div className="absolute inset-x-3 bottom-3 text-white">
                        <p className="text-xs uppercase tracking-wide opacity-80">{d.city}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                        {d.title}
                      </h3>
                      <div className="mt-auto flex items-baseline gap-1.5">
                        {showDiscount ? (
                          <span className="text-muted-foreground text-xs line-through">
                            {formatTRY(d.originalPrice)}
                          </span>
                        ) : null}
                        <span className="text-lg font-bold tracking-tight">
                          {formatTRY(d.discountedPrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <header className="mb-5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Yükselişte
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Bu haftanın kategorileri
          </h2>
        </header>

        {categories.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
            Kategori trendi için yeterli veri yok.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => {
              const style = CATEGORY_STYLE[c.slug];
              return (
                <li key={c.slug}>
                  <Link
                    href={`/k/${c.slug}`}
                    className="group border-border bg-background hover:border-foreground/30 flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors"
                  >
                    {style ? (
                      <span
                        className={cn(
                          'inline-flex size-12 items-center justify-center rounded-full',
                          style.bg,
                          style.fg,
                        )}
                      >
                        <style.Icon className="size-5" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="bg-muted size-12 rounded-full" />
                    )}
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {c.bookings7d} rezervasyon
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="border-border bg-muted/30 mx-auto mt-12 max-w-2xl rounded-xl border p-5 text-center text-xs leading-relaxed">
        Veriler 15 dakikada bir güncellenir. Sıralama son 7 günün
        onaylanmış/kullanılmış rezervasyonlarına göredir.
      </aside>
    </Container>
  );
}

function StatCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: typeof TrendingUp;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'border-border bg-background flex flex-col gap-2 rounded-xl border p-4',
        accent ? 'bg-gradient-to-br from-rose-500/10 via-background to-background border-rose-500/30' : null,
      )}
    >
      <Icon className={cn('size-4', accent ? 'text-rose-600' : 'text-muted-foreground')} aria-hidden="true" />
      <p className="text-2xl font-bold tabular-nums sm:text-3xl">{value.toLocaleString('tr-TR')}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
