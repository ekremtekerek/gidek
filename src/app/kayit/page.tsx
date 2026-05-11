import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/signup-form';
import { Container } from '@/components/ui/container';
import { getCurrentUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Üye ol',
  description: 'gidek’e ücretsiz üye ol — sınırsız AI öneri, favoriler ve rezervasyonlar.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function KayitPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(next ?? '/');

  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">gidek’e katıl</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sana özel AI önerileri için ücretsiz hesap.
          </p>
        </header>

        <SignUpForm next={next} />
      </div>
    </Container>
  );
}
