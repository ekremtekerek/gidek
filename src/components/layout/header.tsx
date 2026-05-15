import Link from 'next/link';
import { Flame, Palmtree, Users } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { CityChip } from '@/components/layout/context-chips';
import { HeaderSearch } from '@/components/layout/header-search';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { getServerClient } from '@/lib/db/server';
import { getCurrentUser } from '@/lib/security/auth';
import { getUserContext } from '@/lib/security/user-context-server';
import { SITE } from '@/lib/utils/site-config';

/**
 * Search-first header. Yazınca debounced autocomplete dropdown'unda fırsat
 * kartları açılır (Elastic gibi). Şehir chip'i sağ tarafta aramaya ve tüm
 * sayfa içeriklerine uygulanan bağlamı tutar. Kategorilere link konmadı —
 * harita filtre chip'leri ve anasayfa CategoryGrid'i kategori navigasyonu
 * için yeterli görsel sağlıyor.
 */
export async function Header() {
  const [user, ctx] = await Promise.all([getCurrentUser(), getUserContext()]);

  let avatarUrl: string | null = null;
  if (user) {
    const supabase = await getServerClient();
    const profileRes = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    avatarUrl = profileRes.data?.avatar_url ?? null;
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="text-2xl sm:text-3xl font-bold tracking-tight shrink-0"
          aria-label={SITE.name}
        >
          {SITE.name}
          <span className="text-muted-foreground ms-0.5">.</span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex w-full max-w-2xl items-center gap-2">
            <HeaderSearch />
            <CityChip value={ctx.city} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/tatil"
            className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 hidden h-9 items-center gap-1.5 rounded-full bg-gradient-to-r px-3 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md md:inline-flex"
            aria-label="Tatil — AI ile planla"
          >
            <Palmtree className="size-3.5" aria-hidden="true" />
            Tatil
          </Link>
          <Link
            href="/trend"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-500/15 hover:border-rose-500/60 dark:text-rose-300 md:inline-flex"
            aria-label="Bu haftanın trendleri"
          >
            <Flame className="size-3.5 animate-pulse" aria-hidden="true" />
            Trend
          </Link>
          <Link
            href="/u"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/15 dark:text-emerald-300 md:inline-flex"
            aria-label="Topluluk seçkileri"
          >
            <Users className="size-3.5" aria-hidden="true" />
            Topluluk
          </Link>
          {user ? (
            <div className="hidden md:block">
              <NotificationBell isAuthenticated />
            </div>
          ) : null}
          <UserMenu user={user} avatarUrl={avatarUrl} />
          <MobileMenu user={user} avatarUrl={avatarUrl} ctx={ctx} />
        </div>
      </Container>
    </header>
  );
}
