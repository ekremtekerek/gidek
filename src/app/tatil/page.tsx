import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Compass, Heart, Palmtree, Plane, Sparkles, Waves } from 'lucide-react';
import { TravelMoodChips } from '@/components/travel/travel-mood-chips';
import { TravelSearchForm } from '@/components/travel/travel-search-form';
import { Container } from '@/components/ui/container';
import {
  listTravelDeals,
  listTravelDestinations,
  listTravelLocations,
} from '@/lib/db/queries/travel';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatTRY } from '@/lib/utils/format';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Tatil · gidek',
  description:
    'AI ile sana özel tatil önerileri. Otel, paket tur, yurtiçi & yurtdışı tatil seçenekleri.',
  alternates: { canonical: '/tatil' },
  openGraph: {
    type: 'website',
    title: 'gidek Tatil — AI ile tatilini planla',
    description:
      'Bodrum, Antalya, Kapadokya, Karadeniz — doğal dille konuş, AI sana özel tatil çıkarsın.',
    url: `${SITE.url}/tatil`,
  },
};

// ISR — 30 dakika
export const revalidate = 1800;

export default async function TatilLandingPage() {
  const [destinations, deals, locations] = await Promise.all([
    listTravelDestinations(8),
    listTravelDeals(12),
    listTravelLocations(),
  ]);

  return (
    <>
      {/* HERO — Mavi-turkuaz gradient, "tatil hissi" */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="from-sky-600 via-cyan-500 to-teal-400 absolute inset-0 -z-10 bg-gradient-to-br"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%)]"
        />
        {/* Dekoratif dalgalar */}
        <Waves
          aria-hidden="true"
          className="absolute right-4 bottom-8 size-40 text-white/15 sm:right-20 sm:size-64"
        />
        <Palmtree
          aria-hidden="true"
          className="absolute left-4 top-8 size-32 text-white/10 sm:left-12 sm:size-48"
        />

        <Container className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center text-white">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur">
              <Plane className="size-3.5" aria-hidden="true" />
              gidek tatil
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Tatilini AI planlasın
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/90 sm:text-lg">
              Doğal dille söyle — &ldquo;Temmuz ortası, Bodrum, çift için her şey dahil 4 gece&rdquo;.
              Gemini ile binlerce paket arasından sana özel 3 seçenek.
            </p>

            {/* Gelişmiş arama formu */}
            <div className="mx-auto mt-8 max-w-4xl text-left">
              <TravelSearchForm locations={locations} variant="inline" />
            </div>

            {/* Mood chips */}
            <div className="mt-6">
              <TravelMoodChips />
            </div>
          </div>
        </Container>
      </section>

      {/* DESTİNASYONLAR */}
      <Container className="py-12 sm:py-16">
        <header className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Compass className="size-3.5" aria-hidden="true" />
              Popüler destinasyonlar
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Sezonun favori noktaları
            </h2>
          </div>
          <Link
            href="/tatil/kesfet"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            Hepsini gör <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </header>

        {destinations.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center text-sm">
            Henüz tatil envanteri yüklenmedi.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {destinations.map((d, idx) => {
              const label = [d.district, d.city].filter(Boolean).join(', ');
              const slug = (d.district ?? d.city).toLowerCase();
              return (
                <li key={`${d.city}-${d.district ?? ''}`}>
                  <Link
                    href={`/tatil/kesfet?q=${encodeURIComponent(`${label} için tatil önerisi`)}`}
                    className="group block overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {d.coverImage ? (
                        <Image
                          src={d.coverImage}
                          alt={label}
                          fill
                          sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          priority={idx < 4}
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-sky-400 to-cyan-500 absolute inset-0" />
                      )}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                      />
                      <div className="absolute inset-x-3 bottom-3 text-white">
                        <p className="text-base font-bold tracking-tight sm:text-lg">{label}</p>
                        <p className="mt-0.5 text-[11px] opacity-90">
                          {d.dealCount} tatil paketi
                          {d.fromPrice ? ` · ${formatTRY(d.fromPrice)}'den başlayan` : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <input type="hidden" value={slug} />
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      {/* POPÜLER TATIL PAKETLERI */}
      <Container className="py-12 sm:py-16">
        <header className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Heart className="size-3.5" aria-hidden="true" />
              Topluluk seçimi
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              En çok tercih edilen tatil paketleri
            </h2>
          </div>
        </header>

        {deals.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center text-sm">
            Henüz tatil envanteri yok — kayıt olup AI ile keşfet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((d, idx) => {
              const showDiscount = d.discounted_price < d.original_price;
              const discount = showDiscount
                ? Math.round((1 - d.discounted_price / d.original_price) * 100)
                : 0;
              const location = [d.district, d.city].filter(Boolean).join(', ');
              return (
                <li key={d.id}>
                  <Link
                    href={`/f/${d.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={d.cover_image}
                        alt={d.title}
                        fill
                        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        priority={idx < 3}
                      />
                      {discount > 0 ? (
                        <span className="bg-sky-600 absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
                          %{discount} indirim
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {location}
                      </p>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {d.title}
                      </h3>
                      <div className="mt-auto flex items-baseline gap-1.5">
                        {showDiscount ? (
                          <span className="text-muted-foreground text-xs line-through">
                            {formatTRY(d.original_price)}
                          </span>
                        ) : null}
                        <span className="text-base font-bold tracking-tight">
                          {formatTRY(d.discounted_price)}
                        </span>
                        <span className="text-muted-foreground text-[11px]">kişi başı</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      {/* AI CTA — alttan büyük bant */}
      <section className="from-sky-600 via-cyan-500 to-teal-400 relative overflow-hidden bg-gradient-to-br py-12 text-white sm:py-16">
        <Sparkles
          aria-hidden="true"
          className="absolute right-8 top-8 size-20 text-white/15 sm:size-32"
        />
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tam tatilini AI&apos;a anlat
            </h2>
            <p className="mt-2 text-white/90">
              &ldquo;Eylül başı 3 gece Antalya, çocuklu, her şey dahil, deniz manzaralı&rdquo; — gerisi
              bizde.
            </p>
            <Link
              href="/tatil/kesfet"
              className="bg-foreground text-background hover:bg-foreground/90 mt-6 inline-flex h-12 items-center gap-2 rounded-full px-7 text-base font-bold shadow-xl transition-all hover:scale-105"
            >
              <Compass className="size-5" aria-hidden="true" />
              AI ile keşfet
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
