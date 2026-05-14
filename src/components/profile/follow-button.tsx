'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, LogIn, UserPlus, UserCheck } from 'lucide-react';
import { toggleFollowAction } from '@/app/u/[slug]/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Props {
  targetUserId: string;
  /** İlk yüklemede gösterilecek takipçi sayısı — optimistic update için */
  initialFollowersCount: number;
}

type Status =
  | { state: 'loading' }
  | { state: 'anon' }
  | { state: 'self' }
  | { state: 'ready'; isFollowing: boolean; followers: number };

/**
 * Auth-aware follow toggle butonu. Page ISR'd olduğu için mount sonrası
 * `/api/follows/check` ile durumu çeker. Optimistic update yapar; başarısızda
 * geri alır.
 */
export function FollowButton({ targetUserId, initialFollowersCount }: Props) {
  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/follows/check?userId=${encodeURIComponent(targetUserId)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.signedIn) {
          setStatus({ state: 'anon' });
          return;
        }
        if (json.isSelf) {
          setStatus({ state: 'self' });
          return;
        }
        setStatus({
          state: 'ready',
          isFollowing: Boolean(json.isFollowing),
          followers: initialFollowersCount,
        });
      })
      .catch(() => {
        if (!cancelled) setStatus({ state: 'anon' });
      });
    return () => {
      cancelled = true;
    };
  }, [targetUserId, initialFollowersCount]);

  if (status.state === 'loading') {
    return (
      <Button variant="outline" size="md" disabled>
        <span className="bg-muted-foreground/30 inline-block size-4 animate-pulse rounded-full" />
        Yükleniyor
      </Button>
    );
  }

  if (status.state === 'self') {
    return (
      <Link
        href="/profil/duzenle"
        className="border-border hover:bg-muted/50 inline-flex h-10 items-center justify-center gap-1.5 rounded-md border px-4 text-sm font-medium transition-colors"
      >
        Profilini düzenle
      </Link>
    );
  }

  if (status.state === 'anon') {
    return (
      <Link
        href={`/giris?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/u')}`}
        className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors"
      >
        <LogIn className="size-4" aria-hidden="true" />
        Takip için giriş yap
      </Link>
    );
  }

  const { isFollowing, followers } = status;

  function onClick() {
    if (pending) return;
    // Optimistic update
    const prev = { isFollowing, followers };
    setStatus({
      state: 'ready',
      isFollowing: !isFollowing,
      followers: followers + (isFollowing ? -1 : 1),
    });

    startTransition(async () => {
      const res = await toggleFollowAction({ targetUserId });
      if (!res || !res.ok) {
        setStatus({ state: 'ready', ...prev });
        return;
      }
      setStatus({
        state: 'ready',
        isFollowing: res.following,
        followers: prev.followers + (res.following ? 1 : 0) - (prev.isFollowing ? 1 : 0),
      });
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={isFollowing}
      className={cn(
        'group inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-all',
        isFollowing
          ? 'border-border hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 border'
          : 'bg-foreground text-background hover:bg-foreground/90 shadow-sm',
        pending && 'opacity-70',
      )}
    >
      {isFollowing ? (
        <>
          <UserCheck className="size-4 group-hover:hidden" aria-hidden="true" />
          <Check className="size-4 hidden group-hover:inline group-hover:rotate-12" aria-hidden="true" />
          <span className="group-hover:hidden">Takiptesin</span>
          <span className="hidden group-hover:inline">Bırak</span>
        </>
      ) : (
        <>
          <UserPlus className="size-4" aria-hidden="true" />
          Takip et
        </>
      )}
    </button>
  );
}
