'use client';

import { useState } from 'react';
import { Check, Copy, Receipt } from 'lucide-react';

interface Props {
  code: string;
  amount: number;
}

/**
 * İptal edilmiş booking için verilen iade kuponu — banner halinde gösterilir.
 * Kullanıcıya kodu kopyalama ile direkt aksiyon imkanı verir.
 */
export function RefundCouponBanner({ code, amount }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <section className="border-emerald-500/30 bg-emerald-500/10 gidek-no-print mt-6 overflow-hidden rounded-xl border">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 inline-flex size-10 shrink-0 items-center justify-center rounded-full">
          <Receipt className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            İade kuponun hazır — {amount.toLocaleString('tr-TR')} ₺ değerinde
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            Bir sonraki rezervasyonunda kullanabilirsin. 90 gün geçerli, tek
            kullanımlık.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-background/80 px-3 py-2">
            <code className="flex-1 truncate font-mono text-sm font-semibold tracking-wide">
              {code}
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label="Kuponu kopyala"
              className="hover:bg-emerald-500/15 inline-flex size-8 items-center justify-center rounded-md text-emerald-800 transition-colors dark:text-emerald-200"
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
