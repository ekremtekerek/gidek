'use client';

import { useActionState, useEffect } from 'react';
import { Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { assignMerchantToUserAction } from '@/app/admin/users/actions';

interface Merchant {
  id: string;
  name: string;
}

interface Props {
  userId: string;
  currentMerchantId: string | null;
  merchants: Merchant[];
}

/**
 * Admin/users satırı için merchant atama dropdown'u. Form submit ile sunucu
 * action'ı çağırır; başarılı submit'te toast atılır + sayfa revalidate edilir.
 */
export function MerchantAssignSelect({ userId, currentMerchantId, merchants }: Props) {
  const [state, action, pending] = useActionState(assignMerchantToUserAction, null);

  useEffect(() => {
    if (!state) return;
    if (!state.ok) toast.error(state.error);
    else toast.success('Atama güncellendi.');
  }, [state]);

  return (
    <form action={action} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <Store className="text-muted-foreground size-3.5" aria-hidden="true" />
      <select
        name="merchantId"
        defaultValue={currentMerchantId ?? ''}
        disabled={pending}
        className="border-border bg-background hover:bg-muted h-8 max-w-[160px] rounded-md border px-2 text-xs disabled:opacity-60"
      >
        <option value="">— Müşteri —</option>
        {merchants.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : 'Ata'}
      </button>
    </form>
  );
}
