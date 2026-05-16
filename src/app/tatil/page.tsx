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
import { Container } from '@/components/ui/container';
import {
  listTravelDeals,
  listTravelDestinations,
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
  const [destinations, deals] = await Promise.all([
    listTravelDestinations(8),
    listTravelDeals(12),
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
          {/* SPLIT — sol AI prompt, sağ 4 wow kart 2x2 — hero genişliğini full kullan */}
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-stretch lg:gap-8">
            {/* SOL — AI prompt */}
            <div className="min-w-0">
              <TravelAIPrompt />
            </div>

            {/* SAĞ — 4 wow kart 2x2 grid (solid gradient — belirgin) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
              <WowCard
                href="/tatil/foto"
                icon={<Camera className="size-6 text-white" aria-hidden="true" />}
                cardGradient="from-fuchsia-600 via-pink-600 to-rose-600"
                title="Foto ile tatil ara"
                subtitle="Bali, Mykonos — Türkiye'den benzerini bul"
              />
              <WowCard
                href="/tatil/plan"
                icon={<Plane className="size-6 text-white" aria-hidden="true" />}
                cardGradient="from-violet-600 via-purple-600 to-fuchsia-600"
                title="AI saat saat plan"
                subtitle="Otel + yemek + aktivite tek planda"
              />
              <WowCard
                href="/tatil/sezon"
                icon={<CalendarDays className="size-6 text-white" aria-hidden="true" />}
                cardGradient="from-amber-500 via-orange-500 to-red-500"
                title="Hangi ay daha akıllıca?"
                subtitle="Hava + fiyat + kalabalık AI analizi"
              />
              <WowCard
                href="/tatil/paket"
                icon={<Sparkles className="size-6 text-white" aria-hidden="true" />}
                cardGradient="from-emerald-600 via-teal-600 to-cyan-600"
                title="Bütçeni AI'a paketle"
                subtitle="Otel + yemek + aktivite + spa tek paket"
              />
            </div>
          </div>

          {/* Klasik tercih edenler için subtle alternatif link */}
          <div className="mt-8 flex items-center justify-center gap-3 text-xs sm:gap-4 sm:text-sm">
            <span className="bg-white/20 hidden h-px flex-1 sm:block" aria-hidden="true" />
            <Link
              href="/tatil/ara"
              className="bg-white/10 hover:bg-white/20 text-white/95 inline-flex h-9 items-center gap-2 rounded-full border border-white/25 px-4 font-semibold backdrop-blur transition-all hover:scale-[1.02]"
            >
              Klasik aramayı tercih ediyorum
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <span className="bg-white/20 hidden h-px flex-1 sm:block" aria-hidden="true" />
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
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/tatil/ara"
              className="text-muted-foreground hover:text-foreground hidden text-sm transition-colors sm:inline"
            >
              Klasik liste
            </Link>
            <Link
              href="/tatil/kesfet"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
            >
              Hepsini gör <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
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

interface WowCardProps {
  href: string;
  icon: React.ReactNode;
  cardGradient: string;
  title: string;
  subtitle: string;
}

/**
 * Hero içine entegre AI özellik kartı. Solid gradient bg — her kart kendi
 * renginde belirgin durur. Glass değil, doygun renk + shine overlay.
 */
function WowCard({ href, icon, cardGradient, title, subtitle }: WowCardProps) {
  return (
    <Link
      href={href}
      className={`bg-gradient-to-br ${cardGradient} group relative flex flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-lg ring-1 ring-white/20 transition-all hover:scale-[1.03] hover:shadow-2xl sm:p-5`}
    >
      {/* Üst-sağ shine overlay */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/15 blur-2xl"
      />
      {/* Alt iç parlak çizgi */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />

      <span className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
        {icon}
      </span>

      <div className="relative min-w-0 flex-1 text-white">
        <h3 className="text-base font-bold leading-tight tracking-tight sm:text-lg">
          {title}
        </h3>
        <p className="mt-1 text-[12px] leading-snug text-white/90 sm:text-sm">
          {subtitle}
        </p>
      </div>

      <ArrowRight
        className="relative size-4 shrink-0 self-end text-white/85 transition-all group-hover:translate-x-0.5 group-hover:text-white"
        aria-hidden="true"
      />
    </Link>
  );
}
