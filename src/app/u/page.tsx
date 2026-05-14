import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Crown,
  Heart,
  Sparkles,
  Trophy,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { LeaderboardTabs } from '@/components/community/leaderboard-tabs';
import { Container } from '@/components/ui/container';
import {
  getCommunityStats,
  getLoyaltyDistribution,
  getMonthlyChampions,
  getMostFavoritedDeals,
  getWeeklyChampions,
  getYearlyChampions,
  listPublicProfiles,
  type PublicProfileBrief,
} from '@/lib/db/queries/community';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';
import { loyaltyState } from '@/lib/utils/loyalty';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Topluluk · gidek',
  description:
    'gidek topluluğunun şampiyonları, favori seçkileri ve haftalık istatistikleri.',
  alternates: { canonical: '/u' },
  openGraph: {
    type: 'website',
    title: 'gidek topluluğu',
    description: 'Haftanın şampiyonları, ayın liderleri, topluluk seçimleri.',
    url: `${SITE.url}/u`,
  },
};

// ISR — 30 dk
export const revalidate = 1800;

export default async function CommunityPage() {
  const [weekly, monthly, yearly, profiles, mostFav, distribution, stats] = await Promise.all([
    getWeeklyChampions(3),
    getMonthlyChampions(3),
    getYearlyChampions(3),
    listPublicProfiles(24),
    getMostFavoritedDeals(6),
    getLoyaltyDistribution(),
    getCommunityStats(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      {/* Hero */}
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Users className="size-3.5" aria-hidden="true" />
          gidek topluluğu
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Şampiyonlar, seçkiler, topluluk
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Haftanın en aktif üyeleri, topluluğun en çok favorilediği fırsatlar
          ve loyalty piramidi. İlham al, paylaş, sen de katıl.
        </p>
      </header>

      {/* Topluluk istatistikleri */}
      <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Public profil" value={stats.publicProfiles} Icon={Users} />
        <StatCard label="Toplam favori" value={stats.totalFavorites} Icon={Heart} />
        <StatCard label="Son 14 gün katılan" value={stats.newJoiners14d} Icon={Calendar} />
        <StatCard
          label="Altın üye"
          value={stats.goldMembers}
          Icon={Crown}
          accent="amber"
        />
      </section>

      {/* Liderlik tablosu — haftalık / aylık / yıllık sekmeli */}
      <section className="mb-12">
        <SectionHeader
          eyebrow="Liderlik tablosu"
          title="Toplulukta en aktif üyeler"
          subtitle="Dönemi seç — sezonun ya da yılın şampiyonlarını gör."
          Icon={Trophy}
          accent="amber"
        />
        <LeaderboardTabs weekly={weekly} monthly={monthly} yearly={yearly} />
      </section>

      {/* Topluluğun favorisi */}
      <section className="mb-12">
        <SectionHeader
          eyebrow="Topluluk seçimi"
          title="En çok favorilenen fırsatlar"
          subtitle="Topluluğun kalbini fethedenler."
          Icon={Heart}
          accent="rose"
        />
        {mostFav.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
            Henüz toplulukta favori paylaşımı yok.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mostFav.map((d, idx) => {
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
                        priority={idx === 0}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                      />
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        <Heart className="size-3 fill-current" aria-hidden="true" />
                        {d.favoriteCount}
                      </span>
                      <p className="text-white absolute inset-x-3 bottom-3 text-xs uppercase tracking-wide opacity-90">
                        {[d.district, d.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                        {d.title}
                      </h3>
                      <div className="mt-auto flex items-baseline gap-1.5">
                        {showDiscount ? (
                          <span className="text-muted-foreground text-xs line-through">
                            {formatTRY(d.originalPrice)}
                          </span>
                        ) : null}
                        <span className="text-base font-bold tracking-tight">
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

      {/* Loyalty piramidi */}
      <section className="mb-12">
        <SectionHeader
          eyebrow="Loyalty piramidi"
          title="Topluluk seviye dağılımı"
          subtitle="Her tier'da kaç üye var?"
          Icon={Crown}
          accent="amber"
        />
        <LoyaltyPyramid dist={distribution} />
      </section>

      {/* Tüm public profiller */}
      <section className="mb-8">
        <SectionHeader
          eyebrow="Üye seçkileri"
          title="Profilini paylaşan üyeler"
          subtitle="Kendine yakın zevkleri olanlardan ilham al."
          Icon={Sparkles}
          accent="emerald"
        />
        {profiles.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
            Henüz public profil yok.{' '}
            <Link
              href="/profil/duzenle"
              className="text-foreground underline-offset-2 hover:underline"
            >
              İlk sen ol
            </Link>
            .
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profiles.map((p) => (
              <li key={p.id}>
                <ProfileCard profile={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="border-border bg-muted/30 mx-auto max-w-2xl rounded-xl border p-5 text-center text-sm leading-relaxed">
        Kendi favori listeni paylaşmak ister misin?{' '}
        <Link
          href="/profil/duzenle"
          className="text-foreground font-medium underline-offset-2 hover:underline"
        >
          Profil ayarlarından
        </Link>{' '}
        bir kullanıcı adı belirle ve &ldquo;public&rdquo; kutusunu işaretle.
      </aside>
    </Container>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  Icon,
  accent,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  Icon: typeof Trophy;
  accent: 'amber' | 'violet' | 'rose' | 'emerald';
}) {
  const colors = {
    amber: 'text-amber-700 dark:text-amber-300',
    violet: 'text-violet-700 dark:text-violet-300',
    rose: 'text-rose-700 dark:text-rose-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
  } as const;
  return (
    <header className="mb-5">
      <p
        className={cn(
          'mb-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase',
          colors[accent],
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
    </header>
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
  Icon: typeof Users;
  accent?: 'amber';
}) {
  return (
    <div
      className={cn(
        'border-border bg-background flex flex-col gap-2 rounded-xl border p-4',
        accent === 'amber'
          ? 'bg-gradient-to-br from-amber-500/10 via-background to-background border-amber-500/30'
          : null,
      )}
    >
      <Icon
        className={cn(
          'size-4',
          accent === 'amber' ? 'text-amber-600' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
      <p className="text-2xl font-bold tabular-nums sm:text-3xl">
        {value.toLocaleString('tr-TR')}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

function ProfileCard({ profile }: { profile: PublicProfileBrief }) {
  const tier = loyaltyState(profile.loyaltyPoints);
  return (
    <Link
      href={`/u/${profile.publicSlug}`}
      className="group border-border bg-background hover:border-foreground/30 flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <Avatar profile={profile} size="md" />
      <div>
        <p className="line-clamp-1 text-sm font-semibold">{profile.displayName}</p>
        <p className="text-muted-foreground text-[11px]">@{profile.publicSlug}</p>
      </div>
      <div className="text-muted-foreground inline-flex items-center gap-2 text-[11px]">
        <span aria-hidden="true">{tier.emoji}</span>
        <span>{tier.label}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-0.5">
          <Heart className="size-3 fill-rose-500 text-rose-500" aria-hidden="true" />
          {profile.favoriteCount}
        </span>
      </div>
    </Link>
  );
}

function Avatar({
  profile,
  size,
}: {
  profile: PublicProfileBrief;
  size: 'sm' | 'md' | 'lg';
}) {
  const cls =
    size === 'lg' ? 'size-20' : size === 'md' ? 'size-16' : 'size-10';
  const initials = profile.displayName
    .split(/[\s@.]+/)
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'bg-muted text-foreground inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        cls,
        size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-xs',
      )}
    >
      {profile.avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="size-full object-cover"
        />
      ) : (
        initials || <UserIcon className="size-5" aria-hidden="true" />
      )}
    </span>
  );
}

function LoyaltyPyramid({
  dist,
}: {
  dist: { bronze: number; silver: number; gold: number; total: number };
}) {
  const total = Math.max(1, dist.total);
  const goldPct = Math.round((dist.gold / total) * 100);
  const silverPct = Math.round((dist.silver / total) * 100);
  const bronzePct = Math.round((dist.bronze / total) * 100);

  const rows = [
    { tier: 'Altın', emoji: '🥇', count: dist.gold, pct: goldPct, bar: 'bg-amber-500', width: 'w-1/3' },
    { tier: 'Gümüş', emoji: '🥈', count: dist.silver, pct: silverPct, bar: 'bg-slate-400', width: 'w-2/3' },
    { tier: 'Bronz', emoji: '🥉', count: dist.bronze, pct: bronzePct, bar: 'bg-orange-500', width: 'w-full' },
  ];

  return (
    <div className="border-border bg-background rounded-xl border p-5 sm:p-6">
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.tier} className="flex items-center gap-3">
            <span className="inline-flex w-16 items-center gap-1.5 text-sm font-medium">
              <span aria-hidden="true">{r.emoji}</span>
              {r.tier}
            </span>
            <div className="bg-muted/50 relative h-7 flex-1 overflow-hidden rounded-md">
              <div
                className={cn(
                  'h-full rounded-md transition-[width] duration-700',
                  r.bar,
                )}
                style={{ width: `${Math.max(2, r.pct)}%` }}
              />
              <span className="text-foreground/90 absolute inset-0 inline-flex items-center px-3 text-xs font-medium">
                {r.count} üye · %{r.pct}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-4 text-center text-[11px]">
        Toplam {dist.total.toLocaleString('tr-TR')} üye · her tamamlanmış
        rezervasyon +10 puan kazandırır.
      </p>
    </div>
  );
}
