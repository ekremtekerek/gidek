import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { buttonVariants } from '@/components/ui/button';
import { getDealBySlug } from '@/lib/db/queries/deals';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';
import { affiliateGoHref } from '@/lib/utils/affiliate';
import type { AffiliateOption } from '@/lib/affiliate/mapping';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Köprü sayfası arama motorlarında olmamalı — içerik /f/[slug]'da yaşar.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);
  return {
    title: deal ? `${deal.title} · Satın Al` : 'Satın Al',
    robots: { index: false, follow: false },
  };
}

export default async function AffiliateBridgePage({ params }: PageProps) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);
  if (!deal) notFound();

  const options = (deal.affiliate_options as AffiliateOption[] | null) ?? [];

  // Tek seçenek (veya hiç seçenek + external_url) → doğrudan yönlendir, ara adım gösterme.
  if (options.length === 1) {
    redirect(affiliateGoHref(deal.id, options[0].subDealId));
  }
  if (options.length === 0) {
    if (deal.external_url) redirect(affiliateGoHref(deal.id));
    notFound();
  }

  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return (
    <Container className="py-6 md:py-10">
      <Link
        href={`/f/${deal.slug}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Fırsata geri dön
      </Link>

      <div className="mx-auto max-w-2xl">
        <div className="border-border bg-card flex gap-4 rounded-xl border p-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg md:size-24">
            <Image
              src={deal.cover_image}
              alt={deal.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground line-clamp-2 text-base font-semibold md:text-lg">
              {deal.title}
            </h1>
            {location ? <p className="text-muted-foreground mt-1 text-sm">{location}</p> : null}
            <p className="text-foreground mt-1 text-sm font-medium">
              {formatTRY(deal.discounted_price)}
              <span className="text-muted-foreground"> &apos;den başlayan fiyatlarla</span>
            </p>
          </div>
        </div>

        <h2 className="text-foreground mt-6 text-sm font-semibold">Bir seçenek seç</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Seçtiğin bilet/etkinlik için güvenli ödeme firsatbufirsat.com üzerinde tamamlanır.
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {options.map((opt) => (
            <li key={opt.subDealId}>
              <a
                href={affiliateGoHref(deal.id, opt.subDealId)}
                rel="nofollow sponsored"
                className="border-border hover:border-primary hover:bg-muted/40 group flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors"
              >
                <span className="min-w-0">
                  <span className="text-foreground block text-sm font-medium">{opt.label}</span>
                  {opt.price != null ? (
                    <span className="text-muted-foreground text-sm">{formatTRY(opt.price)}</span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    buttonVariants({ variant: 'primary', size: 'sm' }),
                    'shrink-0 gap-1.5',
                  )}
                >
                  Satın Al
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground mt-5 flex items-center justify-center gap-1.5 text-center text-xs">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          gidek.net bir fırsat keşif platformudur; satın alımlar iş ortağımız firsatbufirsat.com&apos;da yapılır.
        </p>
      </div>
    </Container>
  );
}
