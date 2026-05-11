'use client';

import Link from 'next/link';
import { User as UserIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils/cn';

/**
 * Desktop-only auth shortcut in the Header. The mobile sheet (MobileMenu)
 * has its own auth-aware section, so we hide UserMenu below md.
 */
export function UserMenu() {
  const { user, loading } = useUser();

  if (loading) {
    return <div className="hidden h-9 w-24 animate-pulse rounded-md bg-[var(--muted)] md:block" aria-hidden="true" />;
  }

  if (user) {
    const label =
      (user.user_metadata as Record<string, string> | null)?.display_name ??
      user.email?.split('@')[0] ??
      'Profil';

    return (
      <Link
        href="/profil"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'hidden max-w-[12rem] gap-1.5 md:inline-flex',
        )}
      >
        <UserIcon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/giris"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden md:inline-flex')}
      >
        Giriş
      </Link>
      <Link
        href="/kayit"
        className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'hidden md:inline-flex')}
      >
        Üye Ol
      </Link>
    </>
  );
}
