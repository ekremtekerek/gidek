'use client';

import { useActionState, useEffect } from 'react';
import { Loader2, ShieldBan, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { toggleUserBanAction } from '@/app/admin/users/actions';

export function UserBanToggle({ id, banned }: { id: string; banned: boolean }) {
  const [state, action, pending] = useActionState(toggleUserBanAction, null);

  useEffect(() => {
    if (!state) return;
    if (!state.ok) toast.error(state.error);
    else toast.success(state.banned ? 'Kullanıcı banlandı.' : 'Ban kaldırıldı.');
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label={banned ? "Ban'ı kaldır" : 'Banla'}
        title={banned ? "Ban'ı kaldır" : 'Banla'}
        className={
          banned
            ? 'inline-flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-300'
            : 'inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-500/50 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/20 disabled:opacity-60 dark:text-rose-300'
        }
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : banned ? (
          <ShieldCheck className="size-3.5" aria-hidden="true" />
        ) : (
          <ShieldBan className="size-3.5" aria-hidden="true" />
        )}
        {banned ? 'Banı kaldır' : 'Banla'}
      </button>
    </form>
  );
}
