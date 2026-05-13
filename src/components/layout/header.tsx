import Link from 'next/link';
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
          className="text-xl font-semibold tracking-tight shrink-0"
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
