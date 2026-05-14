import type { ReactNode } from 'react';
import { MerchantNav } from '@/components/merchant/merchant-nav';
import { Container } from '@/components/ui/container';
import { requireMerchant } from '@/lib/security/auth';

export const metadata = {
  title: 'İşletme paneli',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function MerchantLayout({ children }: { children: ReactNode }) {
  await requireMerchant();
  return (
    <Container className="py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <MerchantNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
