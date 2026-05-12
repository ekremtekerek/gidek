import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetRequestForm } from '@/components/auth/reset-request-form';
import { Container } from '@/components/ui/container';
import { getCurrentUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Şifremi unuttum',
  description: 'Hesabına yeniden erişmek için sana bir bağlantı gönderelim.',
  robots: { index: false, follow: false },
};

export default async function SifreSifirlaPage() {
  const user = await getCurrentUser();
  if (user) redirect('/profil');

  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Şifreni mi unuttun?</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            E-postanı yaz, yenileme bağlantısını gönderelim.
          </p>
        </header>

        <ResetRequestForm />
      </div>
    </Container>
  );
}
