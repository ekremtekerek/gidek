import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Compass,
  Heart,
  Palmtree,
  Plane,
  Sparkles,
  Star,
  Waves,
} from 'lucide-react';
import { TravelAIPrompt } from '@/components/travel/travel-ai-prompt';
import { TravelClassicForm } from '@/components/travel/travel-classic-form';
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

        <Container className="relative py-10 sm:py-16">
          {/* SPLIT — sol AI vurgusu büyük, sağ klasik filtre */}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch lg:gap-8">
            {/* SOL — AI prompt (büyük, ön plan) */}
            <div>
              <TravelAIPrompt />
            </div>

            {/* SAĞ — klasik filtre formu */}
            <div className="flex">
              <TravelClassicForm locations={locations} />
            </div>
          </div>
        </Container>
      </section>

      {/* FOTO İLE ARA — büyük featured bant, en wow özellik */}
      <Container className="pt-8 sm:pt-12">
        <Link
          href="/tatil/foto"
          className="group from-violet-600 via-fuchsia-500 to-rose-500 relative flex items-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-r p-5 shadow-xl transition-all hover:scale-[1.005] hover:shadow-2xl sm:p-7"
        >
          <Camera
            aria-hidden="true"
            className="absolute right-4 -bottom-4 size-32 text-white/15 sm:right-12 sm:size-48"
          />
          <Sparkles
            aria-hidden="true"
            className="absolute right-32 top-4 size-12 text-white/20 sm:size-16"
          />
          <span className="bg-white/20 inline-flex size-14 shrink-0 items-center justify-center rounded-2xl backdrop-blur shadow-md sm:size-16">
            <Camera className="size-7 text-white sm:size-8" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 text-white">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              <Sparkles className="size-3" aria-hidden="true" />
              Yeni · rakiplerde yok
            </p>
            <h2 className="mt-1.5 text-xl font-bold leading-tight tracking-tight sm:text-2xl">
              Foto ile tatil ara
            </h2>
            <p className="mt-0.5 text-xs text-white/90 sm:text-sm">
              Bali, Maldivler, Mykonos… Beğendiğin tatil fotosunu yükle, Türkiye&apos;den
              benzerini bulalım
            </p>
          </div>
          <ArrowRight
            className="relative z-10 size-6 shrink-0 text-white transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </Container>

      {/* AI WOW BANTLAR — rakiplerde yok özellikler */}
      <Container className="pt-4 sm:pt-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Plan kur */}
          <Link
            href="/tatil/plan"
            className="group from-violet-600 via-fuchsia-500 to-rose-500 relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r p-5 shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl sm:p-6"
          >
            <Sparkles
              aria-hidden="true"
              className="absolute right-4 top-4 size-20 text-white/15 sm:size-28"
            />
            <span className="bg-white/20 inline-flex size-12 shrink-0 items-center justify-center rounded-2xl backdrop-blur shadow-md">
              <Plane className="size-6 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 text-white">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                <Sparkles className="size-3" aria-hidden="true" />
                Yeni
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-tight tracking-tight sm:text-xl">
                AI saat saat plan
              </h2>
              <p className="mt-0.5 text-xs text-white/90 sm:text-sm">
                Otel + yemek + aktivite — tek planda
              </p>
            </div>
            <ArrowRight
              className="size-5 shrink-0 text-white transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          {/* Sezon tavsiyesi */}
          <Link
            href="/tatil/sezon"
            className="group from-amber-500 via-orange-500 to-rose-500 relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r p-5 shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl sm:p-6"
          >
            <Sparkles
              aria-hidden="true"
              className="absolute right-4 top-4 size-20 text-white/15 sm:size-28"
            />
            <span className="bg-white/20 inline-flex size-12 shrink-0 items-center justify-center rounded-2xl backdrop-blur shadow-md">
              <CalendarDays className="size-6 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 text-white">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                <Sparkles className="size-3" aria-hidden="true" />
                AI farkımız
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-tight tracking-tight sm:text-xl">
                Hangi ay daha akıllıca?
              </h2>
              <p className="mt-0.5 text-xs text-white/90 sm:text-sm">
                Hava + fiyat + kalabalık · AI sezon analizi
              </p>
            </div>
            <ArrowRight
              className="size-5 shrink-0 text-white transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </Container>

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
                      {d.ratingAvg ? (
                        <span className="bg-amber-500/95 absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow backdrop-blur">
                          <Star className="size-3 fill-current" aria-hidden="true" />
                          {d.ratingAvg.toFixed(1)}
                          {d.reviewCount > 0 ? (
                            <span className="text-[10px] font-normal opacity-90">
                              ({d.reviewCount})
                            </span>
                          ) : null}
                        </span>
                      ) : null}
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
