import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/signin-form';
import { Container } from '@/components/ui/container';
import { getCurrentUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Giriş yap',
  description: 'gidek hesabına giriş yap, fırsatları ve geçmiş aramalarını gör.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function GirisPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(next ?? '/');

  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Tekrar hoş geldin</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            E-postanı gir, kaldığın yerden devam et.
          </p>
        </header>

        <SignInForm next={next} />
      </div>
    </Container>
  );
}
