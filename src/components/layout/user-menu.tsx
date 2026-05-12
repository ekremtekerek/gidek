import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { User as UserIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Props {
  user: User | null;
  avatarUrl?: string | null;
}

/**
 * Desktop auth shortcut. Pure server component — receives the resolved user
 * and the cached avatar URL from <Header>, so login/logout actions that
 * revalidate the layout produce the correct UI on the next render with no
 * client-side state lag.
 *
 * The mobile sheet (MobileMenu) has its own auth-aware section, so we hide
 * UserMenu below md.
 */
export function UserMenu({ user, avatarUrl }: Props) {
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
          'hidden max-w-[12rem] gap-1.5 pl-1 md:inline-flex',
        )}
      >
        <span className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt={label} className="size-full object-cover" />
          ) : (
            <UserIcon className="size-3.5" aria-hidden="true" />
          )}
        </span>
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
