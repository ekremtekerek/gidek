import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Heart, Sparkles, User as UserIcon } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { getServiceClient } from '@/lib/db/service';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatTRY } from '@/lib/utils/format';
import { loyaltyState } from '@/lib/utils/loyalty';
import { SITE } from '@/lib/utils/site-config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ISR — 10 dk
export const revalidate = 600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getServiceClient();
  const { data: p } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, is_public, public_slug')
    .eq('public_slug', slug.toLowerCase())
    .eq('is_public', true)
    .maybeSingle();

  if (!p) return { robots: { index: false, follow: false } };

  const name = p.display_name ?? slug;
  return {
    title: `${name} · gidek seçkisi`,
    description: `${name}'in gidek üzerindeki favori fırsatları.`,
    alternates: { canonical: `/u/${slug}` },
    openGraph: {
      type: 'profile',
      title: `${name} · gidek`,
      description: `${name}'in favorileri`,
      url: `${SITE.url}/u/${slug}`,
      images: p.avatar_url ? [{ url: p.avatar_url }] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, loyalty_points, created_at, is_public')
    .eq('public_slug', slug.toLowerCase())
    .eq('is_public', true)
    .maybeSingle();

  if (!profile) notFound();

  const [{ data: favorites }, { count: bookingCount }] = await Promise.all([
    supabase
      .from('favorites')
      .select(
        `deal:deals (
          id, slug, title, city, district, cover_image,
          discounted_price, original_price, is_active, published_at, valid_until
        )`,
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(48),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .in('status', ['confirmed', 'used']),
  ]);

  // Sadece aktif + yayında + süresi dolmamış deal'leri göster
  const now = new Date();
  type DealRow = {
    id: string;
    slug: string;
    title: string;
    city: string;
    district: string | null;
    cover_image: string;
    discounted_price: number;
    original_price: number;
    is_active: boolean;
    published_at: string | null;
    valid_until: string;
  };
  const deals = (favorites ?? [])
    .map((f) => {
      const rel = f.deal as DealRow | DealRow[] | null;
      return Array.isArray(rel) ? rel[0] : rel;
    })
    .filter(
      (d): d is DealRow =>
        Boolean(d) &&
        d!.is_active &&
        Boolean(d!.published_at) &&
        new Date(d!.valid_until) > now,
    );

  const tier = loyaltyState(profile.loyalty_points ?? 0);
  const displayName = profile.display_name ?? slug;
  const initials = displayName
    .split(/[\s@.]+/)
    .map((piece: string) => piece[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberSince = new Date(profile.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="bg-muted text-foreground inline-flex size-20 items-center justify-center overflow-hidden rounded-full text-xl font-semibold sm:size-24 sm:text-2xl">
          {profile.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="size-full object-cover"
            />
          ) : (
            initials || <UserIcon className="size-10" aria-hidden="true" />
          )}
        </span>
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          gidek seçkisi
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
        <p className="text-muted-foreground inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          <span aria-hidden="true">{tier.emoji}</span>
          <span>{tier.label} üye</span>
          <span aria-hidden="true">·</span>
          <span>{bookingCount ?? 0} rezervasyon</span>
          <span aria-hidden="true">·</span>
          <span>{memberSince}&apos;dan beri</span>
        </p>
      </header>

      <section>
        <header className="mb-5">
          <h2 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Heart className="size-5 fill-rose-500 text-rose-500" aria-hidden="true" />
            Favoriler
            <span className="text-muted-foreground text-base font-normal">
              ({deals.length})
            </span>
          </h2>
        </header>

        {deals.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center text-sm">
            Henüz aktif favorisi yok.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((d, idx) => {
              const showDiscount = d.discounted_price < d.original_price;
              return (
                <li key={d.id}>
                  <Link
                    href={`/f/${d.slug}`}
                    className="group border-border bg-background hover:border-foreground/30 block overflow-hidden rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={d.cover_image}
                        alt={d.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        priority={idx < 3}
                      />
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {[d.district, d.city].filter(Boolean).join(', ')}
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
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Container>
  );
}
