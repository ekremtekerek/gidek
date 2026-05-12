import { Store } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';

export const metadata = {
  title: 'İşletme bulunamadı',
};

export default function MerchantNotFound() {
  return (
    <Container className="py-12 sm:py-20">
      <EmptyState
        icon={Store}
        title="Bu işletmeyi bulamadık"
        description="Aradığın işletme kaldırılmış veya henüz yayında değil. AI'a sorarak benzer fırsatları keşfedebilirsin."
        primaryAction={{ label: 'AI ile keşfet', href: '/' }}
        fullPage
      />
    </Container>
  );
}
