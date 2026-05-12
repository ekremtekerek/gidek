import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  title: 'Yeni şifre belirle',
  description: 'Hesabın için yeni bir şifre oluştur.',
  robots: { index: false, follow: false },
};

export default function SifreYenilePage() {
  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Yeni şifre belirle</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Birazdan kullanacağın yeni şifreyi gir.
          </p>
        </header>

        <ResetPasswordForm />
      </div>
    </Container>
  );
}
