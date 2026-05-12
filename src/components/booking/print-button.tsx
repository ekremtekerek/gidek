'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** window.print tetikleyicisi — print CSS otomatik devreye girer. */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gidek-no-print"
    >
      <Printer className="size-4" aria-hidden="true" />
      Yazdır / PDF olarak kaydet
    </Button>
  );
}
