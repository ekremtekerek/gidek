import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { listFavoriteDeals } from '@/lib/db/queries/favorites';
import { requireUser } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'Favorilerim',
  description: 'Kaydettiğin fırsatlar.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FavorilerimPage() {
  await requireUser();
  const favorites = await listFavoriteDeals();

  return (
    <Container className="py-12 sm:py-16">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Profil
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Favorilerim</h1>
        <p className="text-muted-foreground text-sm">
          {favorites.length === 0
            ? 'Henüz favori eklemedin. Beğendiğin bir fırsatı kalp ile işaretle.'
            : `${favorites.length} kayıtlı fırsat`}
        </p>
      </header>

      {favorites.length === 0 ? (
        <div className="border-border bg-muted/40 flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <span className="bg-background border-border inline-flex size-14 items-center justify-center rounded-full border">
            <Heart className="size-6 text-rose-500" aria-hidden="true" />
          </span>
          <p className="text-muted-foreground max-w-md">
            Favori listen şu an boş. Bir fırsata göz at, kalbi tıkla; buradan tek bakışta görelim.
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}>
            Fırsatları keşfet
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((d) => (
            <li key={d.id}>
              <DealCard deal={d} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
