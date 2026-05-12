import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight,
  Heart,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Settings,
  Ticket,
  User as UserIcon,
} from 'lucide-react';
import { signOutAction } from '@/app/profil/actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Hesap bilgilerin ve tercihlerin.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const user = await requireUser();

  const supabase = await getServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, phone, onboarding_done, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Üye';

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Avatar + name hero */}
        <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          <div className="bg-muted text-muted-foreground inline-flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full sm:size-24">
            {profile?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="size-full object-cover"
              />
            ) : (
              <UserIcon className="size-10" aria-hidden="true" />
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-1 sm:items-start">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Profil
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {displayName}
            </h1>
            <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          </div>

          <Link
            href="/profil/duzenle"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Düzenle
          </Link>
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
            <UserIcon className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <dt className="text-muted-foreground text-xs">Görünen isim</dt>
              <dd className="text-sm font-medium">{profile?.display_name ?? '—'}</dd>
            </div>
          </div>
          {profile?.phone ? (
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <Phone className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <dt className="text-muted-foreground text-xs">Telefon</dt>
                <dd className="text-sm font-medium">{profile.phone}</dd>
              </div>
            </div>
          ) : null}
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

        <nav
          aria-label="Profil menüsü"
          className="border-border bg-background mb-8 divide-y divide-[var(--border)] rounded-lg border"
        >
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
