import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, MailOpen, Users } from 'lucide-react';
import { SubscriberRowActions } from '@/components/admin/subscriber-row-actions';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getServiceClient } from '@/lib/db/service';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Newsletter · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

interface PageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

export default async function AdminNewsletterPage({ searchParams }: PageProps) {
  const { filter, q } = await searchParams;
  const showUnsubscribed = filter === 'unsubscribed';

  const supabase = getServiceClient();

  let query = supabase
    .from('newsletter_subscribers')
    .select('id, email, source, confirmed_at, subscribed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false })
    .limit(500);

  if (showUnsubscribed) {
    query = query.not('unsubscribed_at', 'is', null);
  } else {
    query = query.is('unsubscribed_at', null);
  }

  if (q && q.trim().length > 0) {
    const pattern = `%${q.trim().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    query = query.ilike('email', pattern);
  }

  const [{ data }, totals] = await Promise.all([
    query,
    Promise.all([
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .is('unsubscribed_at', null),
      supabase
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .not('unsubscribed_at', 'is', null),
    ]),
  ]);

  const subs = data ?? [];
  const activeCount = totals[0].count ?? 0;
  const unsubCount = totals[1].count ?? 0;

  // Source dağılımı (görüntülenen liste üzerinden, basit özet).
  const bySource = new Map<string, number>();
  for (const s of subs) {
    bySource.set(s.source, (bySource.get(s.source) ?? 0) + 1);
  }
  const topSources = [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Büyüme
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Newsletter aboneleri</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeCount} aktif · {unsubCount} ayrılan
          </p>
        </div>
        <a
          href="/admin/newsletter/export"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          <Download className="size-4" aria-hidden="true" />
          CSV indir
        </a>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li className="border-border bg-background flex items-center gap-3 rounded-xl border p-4">
          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 inline-flex size-9 items-center justify-center rounded-md">
            <Users className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-muted-foreground text-xs">Aktif aboneler</p>
            <p className="text-2xl font-semibold tabular-nums">{activeCount}</p>
          </div>
        </li>
        <li className="border-border bg-background flex items-center gap-3 rounded-xl border p-4">
          <span className="bg-muted text-muted-foreground inline-flex size-9 items-center justify-center rounded-md">
            <MailOpen className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-muted-foreground text-xs">Ayrılan</p>
            <p className="text-2xl font-semibold tabular-nums">{unsubCount}</p>
          </div>
        </li>
        <li className="border-border bg-background flex flex-col gap-1 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Kaynak dağılımı (görüntülenen)</p>
          <div className="flex flex-wrap gap-1.5">
            {topSources.length === 0 ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : (
              topSources.map(([src, n]) => (
                <Badge key={src} variant="outline" size="sm">
                  {src} · {n}
                </Badge>
              ))
            )}
          </div>
        </li>
      </ul>

      <form
        action="/admin/newsletter"
        method="get"
        className="border-border bg-background flex flex-wrap items-center gap-2 rounded-lg border p-3"
      >
        {showUnsubscribed ? <input type="hidden" name="filter" value="unsubscribed" /> : null}
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="E-posta ara…"
          className="placeholder:text-muted-foreground/70 flex-1 min-w-[200px] bg-transparent text-sm outline-none"
        />
        <nav className="border-border bg-muted/40 flex rounded-full border p-0.5 text-xs">
          <Link
            href="/admin/newsletter"
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              !showUnsubscribed ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
          >
            Aktif
          </Link>
          <Link
            href="/admin/newsletter?filter=unsubscribed"
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              showUnsubscribed ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
          >
            Ayrılan
          </Link>
        </nav>
        <button
          type="submit"
          className="border-border hover:bg-muted rounded-md border px-3 py-1 text-xs font-medium"
        >
          Ara
        </button>
      </form>

      {subs.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Eşleşen abone yok.
        </p>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {subs.map((s) => {
            const unsubscribed = Boolean(s.unsubscribed_at);
            return (
              <li
                key={s.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${s.email}`}
                      className="text-sm font-medium hover:underline underline-offset-2"
                    >
                      {s.email}
                    </a>
                    <Badge variant="outline" size="sm">{s.source}</Badge>
                    {s.confirmed_at ? (
                      <Badge variant="success" size="sm">Onaylı</Badge>
                    ) : null}
                    {unsubscribed ? (
                      <Badge variant="warning" size="sm">Ayrıldı</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Kayıt: {DATE_FORMATTER.format(new Date(s.subscribed_at))}
                    {unsubscribed && s.unsubscribed_at
                      ? ` · Ayrıldı: ${DATE_FORMATTER.format(new Date(s.unsubscribed_at))}`
                      : ''}
                  </p>
                </div>
                <SubscriberRowActions id={s.id} unsubscribed={unsubscribed} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
