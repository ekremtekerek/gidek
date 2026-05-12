import type { ReactNode } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { Container } from '@/components/ui/container';
import { requireAdmin } from '@/lib/security/auth';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <Container className="py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
