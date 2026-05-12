import { WifiOff } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';

export const metadata = {
  title: 'Çevrimdışı',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <Container className="py-12 sm:py-20">
      <EmptyState
        icon={WifiOff}
        title="Bağlantı yok"
        description="İnternet bağlantın şu an yok gibi görünüyor. Bağlandığında tekrar dene."
        primaryAction={{ label: 'Tekrar dene', href: '/' }}
        fullPage
      />
    </Container>
  );
}
