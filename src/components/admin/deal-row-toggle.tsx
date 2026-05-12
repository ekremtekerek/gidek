'use client';

import { useTransition } from 'react';
import { toggleDealActiveAction } from '@/app/admin/deals/actions';
import { Button } from '@/components/ui/button';

export function DealRowToggle({
  dealId,
  isActive,
}: {
  dealId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={isActive ? 'outline' : 'primary'}
      size="sm"
      onClick={() =>
        startTransition(async () => {
          await toggleDealActiveAction(dealId, isActive);
        })
      }
      disabled={pending}
    >
      {isActive ? 'Yayından kaldır' : 'Yayına al'}
    </Button>
  );
}
