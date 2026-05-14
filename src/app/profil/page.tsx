import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight,
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  User as UserIcon,
  Users,
  Wallet,
} from 'lucide-react';
import { signOutAction } from '@/app/profil/actions';
import { BadgesGrid } from '@/components/profile/badges-grid';
import { BingoCard } from '@/components/profile/bingo-card';
import { LoyaltyCard } from '@/components/profile/loyalty-card';
import { PushOptIn } from '@/components/pwa/push-opt-in';
import { listBadgesForUser } from '@/lib/gamification/badges';
import { BINGO_THRESHOLD, listBingoProgress } from '@/lib/gamification/bingo';
import { listLoyaltyRewards } from '@/lib/gamification/loyalty-rewards';
import { Button, buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { isAdmin, requireUser } from '@/lib/security/auth';
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
  const [{ data: profile }, badges, bingo, rewards] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'display_name, avatar_url, phone, onboarding_done, created_at, merchant_id, loyalty_points, streak_weeks',
      )
      .eq('id', user.id)
      .maybeSingle(),
    listBadgesForUser(user.id),
    listBingoProgress(user.id),
    listLoyaltyRewards(user.id),
  ]);

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Üye';

  // Eğer kullanıcı bir işletmeye atanmışsa, banner için işletme adını al
  // (service-role — merchants RLS okumayı kısıtlamıyor ama Türkçe nüansı
  // tek query'de çekmek temiz).
  let merchantName: string | null = null;
  if (profile?.merchant_id) {
    const admin = getServiceClient();
    const { data: m } = await admin
      .from('merchants')
      .select('name')
      .eq('id', profile.merchant_id)
      .maybeSingle();
    merchantName = m?.name ?? null;
  }

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

        <div className="mb-6">
          <LoyaltyCard
            points={profile?.loyalty_points ?? 0}
            streakWeeks={profile?.streak_weeks ?? 0}
            rewards={rewards}
          />
        </div>

        <div className="mb-6">
          <BadgesGrid badges={badges} />
        </div>

        {bingo.length > 0 ? (
          <div className="mb-6">
            <BingoCard cities={bingo} threshold={BINGO_THRESHOLD} />
          </div>
        ) : null}

        {isAdmin(user) ? (
          <Link
            href="/admin"
            className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-background to-background hover:from-violet-500/15 mb-6 flex items-center gap-4 rounded-xl border p-4 transition-colors sm:p-5"
          >
            <span className="bg-violet-500/15 text-violet-700 dark:text-violet-300 inline-flex size-10 shrink-0 items-center justify-center rounded-full">
              <LayoutDashboard className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Admin paneline geç</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Fırsatlar, kategoriler, kullanıcılar, kuponlar — tüm yönetim ekranı
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
        ) : null}

        {profile?.merchant_id ? (
          <Link
            href="/isletme"
            className="border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 mb-6 flex items-center gap-4 rounded-xl border p-4 transition-colors sm:p-5"
          >
            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 inline-flex size-10 shrink-0 items-center justify-center rounded-full">
              <Store className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">İşletme paneline geç</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {merchantName ?? 'İşletmeni'} yönet — fırsatlar, rezervasyonlar, AI içerik
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
        ) : null}

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
            href="/akis"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Users className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Akış</p>
              <p className="text-muted-foreground text-xs">
                Takip ettiklerinin son aktiviteleri
              </p>
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
          <Link
            href="/cuzdan"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Wallet className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Cüzdanım</p>
              <p className="text-muted-foreground text-xs">
                Tüm kuponların tek ekranda
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/cark"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Sparkles className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Günlük çark</p>
              <p className="text-muted-foreground text-xs">
                Günde bir kez çevir — puan veya kupon kazan
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/davet"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <Gift className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Arkadaşını davet et</p>
              <p className="text-muted-foreground text-xs">
                İkiniz de 100 TL kupon kazanın
              </p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/profil/hesap"
            className="hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors sm:p-5"
          >
            <ShieldCheck className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Hesap ayarları</p>
              <p className="text-muted-foreground text-xs">Şifre, e-posta, hesap silme</p>
            </div>
            <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
          </Link>
        </nav>

        {/* PWA push opt-in — VAPID env yoksa component kendini gizler. */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Bildirimler</p>
            <p className="text-muted-foreground text-xs">
              Rezervasyonun yarın ise hatırlatma, favori fırsatın bitmek üzereyse uyarı.
            </p>
          </div>
          <PushOptIn />
        </div>

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
