import type { Metadata } from 'next';
import { Heart } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { Container } from '@/components/ui/container';
import { listFavoriteDeals } from '@/lib/db/queries/favorites';
import { requireUser } from '@/lib/security/auth';

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
            ? 'Beğendiğin fırsatları buradan takip et.'
            : `${favorites.length} kayıtlı fırsat`}
        </p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Favori listen boş"
          description="Bir fırsata göz at, kart üzerindeki kalbe tıkla; buradan tek bakışta hatırlayabilirsin."
          primaryAction={{ label: 'Fırsatları keşfet', href: '/' }}
          secondaryAction={{ label: 'AI ile öneri al', href: '/?q=Bana+bir+f%C4%B1rsat+%C3%B6ner' }}
        />
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
