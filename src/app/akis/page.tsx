import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  Heart,
  MessageSquare,
  Ticket,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { getActivityFeed, type ActivityItem } from '@/lib/db/queries/activity-feed';
import { requireUser } from '@/lib/security/auth';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Akış · gidek',
  description: 'Takip ettiğin profillerin son aktiviteleri.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AkisPage() {
  const user = await requireUser();
  const items = await getActivityFeed(user.id, 50);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Users className="size-3.5" aria-hidden="true" />
            Akış
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Takip ettiğin profiller
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Son 30 günde takip ettiklerinin yorum, rezervasyon, favori ve rozet
            etkinlikleri.
          </p>
        </header>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="relative space-y-4 border-l-2 border-dashed border-[var(--border)] pl-6">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <span
                  aria-hidden="true"
                  className="border-background bg-foreground absolute -left-[33px] top-2 size-3 rounded-full border-[3px]"
                />
                <ActivityCard item={item} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </Container>
  );
}

function EmptyState() {
  return (
    <div className="border-border bg-muted/30 rounded-2xl border border-dashed p-10 text-center">
      <Users className="text-muted-foreground mx-auto mb-3 size-10" aria-hidden="true" />
      <p className="text-sm font-medium">Henüz kimseyi takip etmiyorsun</p>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
        Topluluğa göz at, beğendiğin profilleri takip et. Aktivitelerini burada
        gör.
      </p>
      <Link
        href="/u"
        className="bg-foreground text-background hover:bg-foreground/90 mt-5 inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
      >
        Topluluğa git
      </Link>
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const verb = verbFor(item);
  const accent = accentFor(item.kind);

  return (
    <article className="border-border bg-background rounded-xl border p-4 shadow-sm">
      <header className="mb-3 flex items-start gap-3">
        <Link
          href={item.actor.publicSlug ? `/u/${item.actor.publicSlug}` : '/u'}
          className="shrink-0"
          aria-label={item.actor.displayName}
        >
          <ActorAvatar actor={item.actor} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <Link
              href={item.actor.publicSlug ? `/u/${item.actor.publicSlug}` : '/u'}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {item.actor.displayName}
            </Link>{' '}
            <span className="text-muted-foreground">{verb}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            <time dateTime={item.occurredAt}>{timeAgo(item.occurredAt)}</time>
          </p>
        </div>
        <span
          className={cn(
            'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
            accent,
          )}
        >
          <KindIcon kind={item.kind} />
        </span>
      </header>

      {item.deal ? (
        <Link
          href={`/f/${item.deal.slug}`}
          className="hover:bg-muted/40 group flex items-center gap-3 rounded-lg p-2 transition-colors"
        >
          <Image
            src={item.deal.coverImage}
            alt={item.deal.title}
            width={72}
            height={56}
            className="aspect-[4/3] size-14 rounded-md object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
          <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug">
            {item.deal.title}
          </p>
        </Link>
      ) : null}

      {item.kind === 'review' && item.reviewSnippet ? (
        <blockquote className="border-foreground/20 text-muted-foreground mt-2 border-l-2 pl-3 text-sm italic leading-relaxed">
          {item.reviewRating ? (
            <span className="me-2 text-amber-500">
              {'★'.repeat(item.reviewRating)}
              <span className="text-muted-foreground/40">
                {'★'.repeat(5 - item.reviewRating)}
              </span>
            </span>
          ) : null}
          {item.reviewSnippet}
        </blockquote>
      ) : null}

      {item.kind === 'badge' && item.badge ? (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          <Award className="size-3.5" aria-hidden="true" />
          {item.badge.name}
        </p>
      ) : null}
    </article>
  );
}

function ActorAvatar({ actor }: { actor: ActivityItem['actor'] }) {
  const initials = actor.displayName
    .split(/[\s@.]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="bg-muted text-foreground inline-flex size-10 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
      {actor.avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={actor.avatarUrl} alt={actor.displayName} className="size-full object-cover" />
      ) : (
        initials || <UserIcon className="size-4" aria-hidden="true" />
      )}
    </span>
  );
}

function verbFor(item: ActivityItem): string {
  switch (item.kind) {
    case 'booking':
      return 'bir fırsata rezervasyon yaptı';
    case 'review':
      return 'bir fırsata yorum yazdı';
    case 'favorite':
      return 'bir fırsatı favoriledi';
    case 'badge':
      return 'yeni bir rozet kazandı';
  }
}

function KindIcon({ kind }: { kind: ActivityItem['kind'] }) {
  if (kind === 'booking') return <Ticket className="size-4" aria-hidden="true" />;
  if (kind === 'review') return <MessageSquare className="size-4" aria-hidden="true" />;
  if (kind === 'favorite') return <Heart className="size-4" aria-hidden="true" />;
  return <Award className="size-4" aria-hidden="true" />;
}

function accentFor(kind: ActivityItem['kind']): string {
  return kind === 'booking'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    : kind === 'review'
      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
      : kind === 'favorite'
        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'az önce';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} gün önce`;
  if (day < 30) return `${Math.floor(day / 7)} hafta önce`;
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
}
