'use client';

import { useState } from 'react';
import { Check, Copy, Flame, Gift, MapPin, Receipt, Sparkles } from 'lucide-react';
import type { WalletCoupon } from '@/lib/db/queries/wallet';
import { cn } from '@/lib/utils/cn';

interface Props {
  coupon: WalletCoupon;
  dimmed?: boolean;
}

const SOURCE_ICONS = {
  bingo: MapPin,
  spin: Sparkles,
  loyalty: Gift,
  refund: Receipt,
} as const;

const SOURCE_ACCENT = {
  bingo: 'from-sky-500/15 to-sky-500/5 border-sky-500/30 text-sky-700 dark:text-sky-300',
  spin: 'from-rose-500/15 to-amber-500/5 border-rose-500/30 text-rose-700 dark:text-rose-300',
  loyalty: 'from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300',
  refund: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
} as const;

export function WalletCouponCard({ coupon, dimmed = false }: Props) {
  const [copied, setCopied] = useState(false);
  const Icon = SOURCE_ICONS[coupon.source];
  const accent = SOURCE_ACCENT[coupon.source];

  async function copy() {
    if (coupon.status !== 'usable') return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const discountLabel =
    coupon.discountType === 'percent'
      ? `%${coupon.discountValue} indirim`
      : `${coupon.discountValue.toLocaleString('tr-TR')} ₺ kredi`;

  const validUntilLabel = coupon.validUntil
    ? new Date(coupon.validUntil).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const statusBadge =
    coupon.status === 'usable'
      ? null
      : {
          used: { label: 'Kullanıldı', cls: 'bg-slate-500/20 text-slate-700 dark:text-slate-300' },
          expired: { label: 'Süresi geçti', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
          inactive: { label: 'Pasif', cls: 'bg-slate-500/20 text-slate-700 dark:text-slate-300' },
        }[coupon.status];

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-sm transition-all sm:p-5',
        accent,
        dimmed && 'opacity-65 grayscale-[0.4]',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="bg-background/60 inline-flex size-10 shrink-0 items-center justify-center rounded-full">
          {coupon.source === 'spin' ? (
            <Flame className="size-5" aria-hidden="true" />
          ) : (
            <Icon className="size-5" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-base font-bold tracking-tight">
            {discountLabel}
          </p>
          <p className="text-foreground/80 mt-0.5 text-xs">{coupon.sourceLabel}</p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Son geçerli: {validUntilLabel}
          </p>
        </div>

        {statusBadge ? (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              statusBadge.cls,
            )}
          >
            {statusBadge.label}
          </span>
        ) : null}
      </div>

      <div className="bg-background/60 mt-3 flex items-center gap-2 rounded-md border border-current/20 px-3 py-2">
        <code className="flex-1 truncate font-mono text-sm font-semibold tracking-wide">
          {coupon.code}
        </code>
        <button
          type="button"
          onClick={copy}
          disabled={coupon.status !== 'usable'}
          aria-label="Kuponu kopyala"
          className="hover:bg-current/10 inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40"
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}
