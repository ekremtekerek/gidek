import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';
import { PriceAlertsList } from '@/components/travel/price-alerts-list';
import { requireUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Fiyat Alarmlarım',
  description: 'Kurduğun tatil fiyat alarmları.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AlarmsPage() {
  await requireUser();

  return (
    <Container className="py-12 sm:py-16">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Profil
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Fiyat Alarmlarım
        </h1>
        <p className="text-muted-foreground text-sm">
          Tatil fiyat takip listenden hedef fiyata düşenler için anında haber alırsın.
        </p>
      </header>

      <PriceAlertsList />
    </Container>
  );
}
