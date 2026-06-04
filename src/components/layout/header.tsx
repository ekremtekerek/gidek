import Link from 'next/link';
import { Flame, Users } from 'lucide-react';
import { ContextLogo } from '@/components/layout/context-logo';
import { ContextToggleButton } from '@/components/layout/context-toggle-button';
import { CategoryMegaMenu } from '@/components/layout/category-mega-menu';
import { Container } from '@/components/ui/container';
import { HeaderSearchSwitch } from '@/components/layout/header-search-switch';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from '@/components/layout/user-menu';
import { getServerClient } from '@/lib/db/server';
import { getCategoryMenu } from '@/lib/db/queries/deals';
import { listTravelLocations } from '@/lib/db/queries/travel';
import { getCurrentUser } from '@/lib/security/auth';
import { getUserContext } from '@/lib/security/user-context-server';

/**
 * Search-first header. Yazınca debounced autocomplete dropdown'unda fırsat
 * kartları açılır (Elastic gibi). Şehir chip'i sağ tarafta aramaya ve tüm
 * sayfa içeriklerine uygulanan bağlamı tutar. Kategorilere link konmadı —
 * harita filtre chip'leri ve anasayfa CategoryGrid'i kategori navigasyonu
 * için yeterli görsel sağlıyor.
 */
export async function Header() {
  const [user, ctx, travelLocations, categoryMenu] = await Promise.all([
    getCurrentUser(),
    getUserContext(),
    listTravelLocations(),
    getCategoryMenu(),
  ]);

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
        <ContextLogo />

        <div className="hidden flex-1 justify-center md:flex">
          <HeaderSearchSwitch city={ctx.city} travelLocations={travelLocations} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ContextToggleButton variant="desktop" />
          <Link
            href="/trend"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 text-xs font-semibold text-rose-700 transition-all hover:border-rose-500/60 hover:bg-rose-500/15 md:inline-flex dark:text-rose-300"
            aria-label="Bu haftanın trendleri"
          >
            <Flame className="size-3.5 animate-pulse" aria-hidden="true" />
            Trend
          </Link>
          <Link
            href="/u"
            className="hidden h-9 items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/15 md:inline-flex dark:text-emerald-300"
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
          <MobileMenu user={user} avatarUrl={avatarUrl} ctx={ctx} categories={categoryMenu} />
        </div>
      </Container>

      <CategoryMegaMenu menu={categoryMenu} />
    </header>
  );
}
