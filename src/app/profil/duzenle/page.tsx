import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AvatarUploadForm } from '@/components/profile/avatar-upload-form';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { Container } from '@/components/ui/container';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Profili düzenle',
  description: 'Görünen isim, telefon ve profil fotoğrafı.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProfilEditPage() {
  const user = await requireUser();
  const supabase = await getServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, avatar_url, public_slug, is_public')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Üye';

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profil"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Profil
        </Link>

        <header className="mb-8 flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Profili düzenle
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Hesap bilgilerin</h1>
        </header>

        <section className="border-border bg-background mb-6 rounded-xl border p-5 sm:p-6">
          <AvatarUploadForm
            currentUrl={profile?.avatar_url ?? null}
            displayName={displayName}
          />
        </section>

        <section className="border-border bg-background rounded-xl border p-5 sm:p-6">
          <ProfileEditForm
            initial={{
              display_name: profile?.display_name ?? null,
              phone: profile?.phone ?? null,
              public_slug: profile?.public_slug ?? null,
              is_public: profile?.is_public ?? false,
            }}
            email={user.email}
          />
        </section>
      </div>
    </Container>
  );
}
