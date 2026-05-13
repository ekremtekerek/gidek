import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Heart } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import { listFavoriteDealsForUser } from '@/lib/db/queries/favorites';
import { verifyShareToken } from '@/lib/security/share-token';
import { getServiceClient } from '@/lib/db/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { token: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { token } = await params;
  const decoded = verifyShareToken(token, 'wishlist');
  if (!decoded) {
    return {
      title: 'Liste bulunamadı',
      robots: { index: false, follow: false },
    };
  }
  return {
    title: 'Paylaşılan favori liste',
    description: 'Bir gidek kullanıcısının seçtiği fırsatlar.',
    // Public share linki; AI search'e index olmasını istemiyoruz çünkü
    // kullanıcıya özel kişisel liste.
    robots: { index: false, follow: false },
  };
}

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const decoded = verifyShareToken(token, 'wishlist');
  if (!decoded) notFound();

  const deals = await listFavoriteDealsForUser(decoded.userId);

  // Liste sahibinin ismi opsiyonel — profilden çekiyoruz; yoksa "Bir gidek
  // üyesi" diyoruz.
  let ownerName = 'Bir gidek üyesi';
  try {
    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', decoded.userId)
      .maybeSingle();
    if (profile?.display_name) ownerName = profile.display_name;
  } catch {
    // sessiz — generic isim kalır
  }

  return (
    <Container className="pt-8 pb-16 sm:pt-12">
      <header className="mb-8 flex flex-col gap-3">
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Heart className="size-3.5" aria-hidden="true" />
          Paylaşılan favoriler
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {ownerName}&apos;in seçtiği fırsatlar
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          {deals.length === 0
            ? 'Henüz favori eklenmemiş.'
            : `${deals.length} fırsat — her biri o anda aktif. Kendi favori listeni oluşturmak için giriş yap.`}
        </p>
      </header>

      {deals.length === 0 ? (
        <div className="border-border bg-muted/30 rounded-xl border p-10 text-center">
          <Link
            href="/"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Anasayfaya dön
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <li key={deal.id}>
              <DealCard deal={deal} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
