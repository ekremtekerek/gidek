import type { Metadata } from 'next';
import Link from 'next/link';
import { Bookmark, Trash2 } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { listSavedSearches } from '@/lib/db/queries/saved-searches';
import { requireUser } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { DeleteSearchButton } from '@/components/saved-searches/delete-search-button';

export const metadata: Metadata = {
  title: 'Aramalarım',
  description: 'Kaydettiğin AI aramaları.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SavedSearchesPage() {
  await requireUser();
  const searches = await listSavedSearches();

  return (
    <Container className="py-12 sm:py-16">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Profil
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Aramalarım</h1>
        <p className="text-muted-foreground text-sm">
          {searches.length === 0
            ? 'Sık aradığın AI sorgularını kaydet, tek tıkla geri dön.'
            : `${searches.length} kayıtlı arama`}
        </p>
      </header>

      {searches.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Henüz kayıtlı arama yok"
          description="AI'a bir şey sor, sonra cevabın üstünden 'Kaydet' butonuna bas. Burada toplanır."
          primaryAction={{ label: 'AI ile keşfet', href: '/' }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {searches.map((s) => (
            <li
              key={s.id}
              className="border-border bg-background flex items-start gap-3 rounded-xl border p-4"
            >
              <Bookmark className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{s.name}</p>
                <p className="text-muted-foreground line-clamp-2 text-xs">{s.query}</p>
                <p className="text-muted-foreground/70 mt-1 text-[11px]">
                  {formatDate(s.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={`/?q=${encodeURIComponent(s.query)}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Tekrar ara
                </Link>
                <DeleteSearchButton id={s.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

export const DeleteIcon = Trash2;
