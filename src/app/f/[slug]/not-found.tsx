import { Ticket } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';

export const metadata = {
  title: 'Fırsat bulunamadı',
};

export default function DealNotFound() {
  return (
    <Container className="py-12 sm:py-20">
      <EmptyState
        icon={Ticket}
        title="Bu fırsat artık geçerli değil"
        description="Aradığın fırsat süresi dolmuş veya kaldırılmış olabilir. AI'a benzerini sorarak yeni teklifler bulabilirsin."
        primaryAction={{ label: 'AI ile benzeri bul', href: '/' }}
        secondaryAction={{ label: 'Tüm fırsatlar', href: '/k/yemek' }}
        fullPage
      />
    </Container>
  );
}
