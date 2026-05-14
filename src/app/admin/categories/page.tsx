import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CategoryRowActions } from '@/components/admin/category-row-actions';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getServiceClient } from '@/lib/db/service';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Kategoriler · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = getServiceClient();
  const [{ data: cats }, { data: dealCounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, slug, name, parent_id, icon, sort_order, is_active')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('deal_categories').select('category_id'),
  ]);

  const categories = cats ?? [];
  const countByCat = new Map<string, number>();
  for (const row of dealCounts ?? []) {
    countByCat.set(row.category_id, (countByCat.get(row.category_id) ?? 0) + 1);
  }
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Yönetim
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Kategoriler</h1>
          <p className="text-muted-foreground mt-1 text-sm">{categories.length} kayıt</p>
        </div>
        <Link
          href="/admin/categories/yeni"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          <Plus className="size-4" aria-hidden="true" />
          Yeni kategori
        </Link>
      </header>

      {categories.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Henüz kategori yok.
        </p>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {categories.map((c) => {
            const dealCount = countByCat.get(c.id) ?? 0;
            const parentName = c.parent_id ? nameById.get(c.parent_id) : null;
            return (
              <li
                key={c.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <span className="bg-muted text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md text-xs font-mono">
                  {c.sort_order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {c.name}
                    </Link>
                    {!c.is_active ? (
                      <Badge variant="warning" size="sm">Pasif</Badge>
                    ) : null}
                    {parentName ? (
                      <Badge variant="outline" size="sm">
                        ⤷ {parentName}
                      </Badge>
                    ) : null}
                    {c.icon ? (
                      <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                        {c.icon}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {c.slug} · {dealCount} fırsat
                  </p>
                </div>
                <Link
                  href={`/k/${c.slug}`}
                  className="text-muted-foreground hover:text-foreground hidden text-xs sm:inline"
                >
                  Sayfa →
                </Link>
                <Link
                  href={`/admin/categories/${c.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Düzenle
                </Link>
                <CategoryRowActions id={c.id} isActive={c.is_active} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
