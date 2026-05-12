import { Compass } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';

export const metadata = {
  title: 'Sayfa bulunamadı',
};

export default function NotFound() {
  return (
    <Container className="py-12 sm:py-20">
      <EmptyState
        icon={Compass}
        title="Aradığın sayfa bulunamadı"
        description="Bağlantı eskimiş olabilir veya sayfa kaldırılmış olabilir. Aşağıdan keşfetmeye devam edebilirsin."
        primaryAction={{ label: 'Ana sayfaya dön', href: '/' }}
        secondaryAction={{ label: 'AI ile keşfet', href: '/?q=Bugün+ne+yapsam' }}
        fullPage
      />
    </Container>
  );
}
