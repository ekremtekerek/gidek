import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getServiceClient } from '@/lib/db/service';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'İşletmeler · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

export default async function AdminMerchantsPage({ searchParams }: PageProps) {
  const { q, filter } = await searchParams;
  const showInactive = filter === 'inactive';

  const supabase = getServiceClient();
  let query = supabase
    .from('merchants')
    .select('id, slug, name, city, district, is_active, is_verified')
    .order('updated_at', { ascending: false });

  if (showInactive) query = query.eq('is_active', false);
  else query = query.eq('is_active', true);

  if (q && q.trim().length > 0) {
    const pattern = `%${q.trim().replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    query = query.or(`name.ilike.${pattern},slug.ilike.${pattern}`);
  }

  const { data } = await query.limit(200);
  const merchants = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Yönetim
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">İşletmeler</h1>
          <p className="text-muted-foreground mt-1 text-sm">{merchants.length} kayıt</p>
        </div>
        <Link href="/admin/merchants/yeni" className={cn(buttonVariants({ variant: 'primary' }))}>
          <Plus className="size-4" aria-hidden="true" />
          Yeni işletme
        </Link>
      </header>

      <form
        action="/admin/merchants"
        method="get"
        className="border-border bg-background flex flex-wrap items-center gap-2 rounded-lg border p-3"
      >
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Ad veya slug ile ara…"
          className="placeholder:text-muted-foreground/70 flex-1 min-w-[200px] bg-transparent text-sm outline-none"
        />
        <nav className="border-border bg-muted/40 flex rounded-full border p-0.5 text-xs">
          <Link
            href="/admin/merchants"
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              !showInactive ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
          >
            Aktif
          </Link>
          <Link
            href="/admin/merchants?filter=inactive"
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              showInactive ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
          >
            Pasif
          </Link>
        </nav>
        <button
          type="submit"
          className="border-border hover:bg-muted rounded-md border px-3 py-1 text-xs font-medium"
        >
          Ara
        </button>
      </form>

      {merchants.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Eşleşen işletme bulunamadı.
        </p>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {merchants.map((m) => {
            const loc = [m.district, m.city].filter(Boolean).join(', ');
            return (
              <li
                key={m.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/merchants/${m.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {m.name}
                    </Link>
                    {m.is_verified ? (
                      <Badge variant="success" size="sm" className="inline-flex items-center gap-1">
                        <ShieldCheck className="size-3" aria-hidden="true" />
                        Doğrulanmış
                      </Badge>
                    ) : null}
                    {!m.is_active ? (
                      <Badge variant="warning" size="sm">Pasif</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {m.slug}
                    {loc ? ` · ${loc}` : ''}
                  </p>
                </div>
                <Link
                  href={`/m/${m.slug}`}
                  className="text-muted-foreground hover:text-foreground hidden text-xs sm:inline"
                >
                  Sitedeki sayfa →
                </Link>
                <Link
                  href={`/admin/merchants/${m.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Düzenle
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
