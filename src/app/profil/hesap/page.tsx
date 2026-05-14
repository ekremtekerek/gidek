import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DeleteAccountForm } from '@/components/profile/delete-account-form';
import { EmailChangeForm } from '@/components/profile/email-change-form';
import { PasswordChangeForm } from '@/components/profile/password-change-form';
import { Container } from '@/components/ui/container';
import { requireUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Hesap ayarları',
  description: 'Şifre, e-posta, hesap silme.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function HesapPage() {
  const user = await requireUser();

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <Link
            href="/profil"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Profil
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Hesap ayarları</h1>
          <p className="text-muted-foreground text-sm">
            Şifre, e-posta adresi ve hesabı silme — kalıcı işlemler buradan.
          </p>
        </header>

        <Section title="Şifre" description="Mevcut şifreni doğrulayıp yenisini belirle.">
          <PasswordChangeForm />
        </Section>

        <Section
          title="E-posta adresi"
          description="Değiştirmek için yeni adresine yollanacak onay bağlantısına tıklamalısın."
        >
          <EmailChangeForm currentEmail={user.email ?? null} />
        </Section>

        <Section title="Hesabı sil" description="KVKK kapsamında verilerini kalıcı olarak kaldırırız.">
          <DeleteAccountForm />
        </Section>
      </div>
    </Container>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
      </header>
      <div className="border-border bg-background rounded-xl border p-5">{children}</div>
    </section>
  );
}
