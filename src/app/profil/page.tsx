import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Heart, LogOut, Mail, Settings, Ticket, User } from 'lucide-react';
import { signOutAction } from '@/app/profil/actions';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Hesap bilgilerin ve tercihlerin.',
  robots: { index: false, follow: false },
};

export default async function ProfilPage() {
  const user = await requireUser();

  const supabase = await getServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, onboarding_done, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Üye';

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Profil
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Merhaba, {displayName}</h1>
        </header>

        <dl className="border-border bg-background mb-8 divide-y divide-[var(--border)] rounded-lg border">
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <Mail className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <dt className="text-muted-foreground text-xs">E-posta</dt>
              <dd className="truncate text-sm font-medium">{user.email}</dd>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <User className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <dt className="text-muted-foreground text-xs">Görünen isim</dt>
              <dd className="text-sm font-medium">{profile?.display_name ?? '—'}</dd>
            </div>
          </div>
          {profile?.created_at ? (
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <span className="text-muted-foreground inline-flex size-5 shrink-0 items-center justify-center text-xs">
                ✦
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-muted-foreground text-xs">Üyelik tarihi</dt>
                <dd className="text-sm font-medium">{formatDate(profile.created_at)}</dd>
              </div>
            </div>
          ) : null}
        </dl>

        <nav aria-label="Profil menüsü" className="border-border bg-background mb-8 divide-y divide-[var(--border)] rounded-lg border">
          <Link
            href="/rezervasyonlarim"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Ticket className="text-foreground/70 size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Rezervasyonlarım</p>
              <p className="text-muted-foreground text-xs">Aktif ve geçmiş rezervasyonlar</p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/favorilerim"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Heart className="size-5 shrink-0 text-rose-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Favorilerim</p>
              <p className="text-muted-foreground text-xs">Kaydettiğin fırsatları gör</p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/onboarding"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Settings className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">AI tercihleri</p>
              <p className="text-muted-foreground text-xs">
                {profile?.onboarding_done
                  ? 'Şehir, bütçe, ilgi alanları — güncelle'
                  : 'Tamamla — öneriler kişiselleşsin'}
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
        </nav>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="md">
            <LogOut className="size-4" aria-hidden="true" />
            Çıkış yap
          </Button>
        </form>
      </div>
    </Container>
  );
}
