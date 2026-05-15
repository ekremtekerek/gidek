'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Bookmark,
  Camera,
  Flame,
  Heart,
  LogOut,
  Menu,
  MessageSquare,
  Ticket,
  User,
  Users,
  X,
} from 'lucide-react';
import { ContextToggleButton } from '@/components/layout/context-toggle-button';
import { signOutAction } from '@/app/profil/actions';
import { buttonVariants } from '@/components/ui/button';
import { CityChip } from '@/components/layout/context-chips';
import { HeaderSearch } from '@/components/layout/header-search';
import type { UserContext } from '@/lib/security/user-context';
import { cn } from '@/lib/utils/cn';
import { SITE } from '@/lib/utils/site-config';

interface Props {
  user: SupabaseUser | null;
  avatarUrl?: string | null;
  ctx: UserContext;
}

// User and avatar are passed in from the server-rendered Header so the menu
// reflects the latest cookie-bound auth state immediately after login/logout
// (the previous useUser() hook lagged because Supabase's browser
// onAuthStateChange doesn't fire when a server action mutates the cookie).
export function MobileMenu({ user, avatarUrl, ctx }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpen(false);

  const displayName =
    (user?.user_metadata as Record<string, string> | null)?.display_name ??
    user?.email?.split('@')[0] ??
    'Profil';

  const sheet = (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Mobil menü"
      className="fixed inset-0 z-[100] md:hidden"
    >
      <button
        type="button"
        aria-label="Menüyü kapat"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 bg-black/60"
      />

      <div className="bg-background absolute inset-y-0 right-0 flex w-full max-w-sm flex-col shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <span className="text-lg font-semibold tracking-tight">
            {SITE.name}
            <span className="text-muted-foreground ms-0.5">.</span>
          </span>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={close}
            className="hover:bg-muted inline-flex size-10 items-center justify-center rounded-md"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Mobil ana menü"
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6"
        >
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Fırsat ara
            </p>
            <HeaderSearch size="lg" onSelect={close} />
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Şehrim
            </p>
            <CityChip value={ctx.city} />
            <p className="text-muted-foreground mt-2 text-xs">
              Şehir seçimin arama, harita ve AI önerilerine yansır.
            </p>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Keşfet
            </p>
            <div className="flex flex-col gap-2">
              <ContextToggleButton variant="mobile" onClick={close} />
              <Link
                href="/trend"
                onClick={close}
                className="flex items-center gap-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-500/15 dark:text-rose-300"
              >
                <Flame className="size-4 animate-pulse" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p>Bu haftanın trendleri</p>
                  <p className="text-muted-foreground text-[11px] font-normal">
                    En çok rezerve edilenler + yükselen kategoriler
                  </p>
                </div>
              </Link>
              <Link
                href="/u"
                onClick={close}
                className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
              >
                <Users className="size-4" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p>Topluluk seçkileri</p>
                  <p className="text-muted-foreground text-[11px] font-normal">
                    Şampiyonlar, üye favorileri, loyalty piramidi
                  </p>
                </div>
              </Link>
              <Link
                href="/foto-arama"
                onClick={close}
                className="flex items-center gap-3 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-500/15 dark:text-violet-300"
              >
                <Camera className="size-4" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p>Fotoğrafla ara</p>
                  <p className="text-muted-foreground text-[11px] font-normal">
                    Gemini Vision ile görsele uygun fırsatlar
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {user ? (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                Hesabım
              </p>
              <Link
                href="/favorilerim"
                onClick={close}
                className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
              >
                <Heart className="size-4" aria-hidden="true" />
                Favorilerim
              </Link>
              <Link
                href="/rezervasyonlarim"
                onClick={close}
                className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
              >
                <Ticket className="size-4" aria-hidden="true" />
                Rezervasyonlarım
              </Link>
              <Link
                href="/profil/aramalar"
                onClick={close}
                className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
              >
                <Bookmark className="size-4" aria-hidden="true" />
                Aramalarım
              </Link>
              <Link
                href="/profil/sohbetler"
                onClick={close}
                className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium"
              >
                <MessageSquare className="size-4" aria-hidden="true" />
                Sohbetlerim
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="border-border flex flex-col gap-2 border-t px-5 py-4">
          {user ? (
            <>
              <Link
                href="/profil"
                onClick={close}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full justify-start gap-2 pl-2',
                )}
              >
                <span className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  {avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-3.5" aria-hidden="true" />
                  )}
                </span>
                <span className="truncate">{displayName}</span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  onClick={close}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'w-full justify-start gap-2',
                  )}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Çıkış yap
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/giris"
                onClick={close}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                Giriş
              </Link>
              <Link
                href="/kayit"
                onClick={close}
                className={cn(buttonVariants({ variant: 'primary' }), 'w-full')}
              >
                Üye Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü aç"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="hover:bg-muted inline-flex size-10 items-center justify-center rounded-md md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open ? createPortal(sheet, document.body) : null}
    </>
  );
}
