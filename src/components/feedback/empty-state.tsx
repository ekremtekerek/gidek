import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Action {
  label: string;
  href: string;
  variant?: 'primary' | 'outline' | 'ghost';
}

interface Props {
  /** Lucide ikon component'i. */
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Birincil aksiyon (öneri). */
  primaryAction?: Action;
  /** İkincil aksiyon (ek). */
  secondaryAction?: Action;
  /** Sayfa ortasına yerleştirmek için min-height. */
  fullPage?: boolean;
  className?: string;
}

/**
 * Tutarlı empty state — gradient halo + ikon + başlık + açıklama + CTA(lar).
 * Liste/grid sayfalarında veri olmadığında veya 404'lerde kullanılır.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  fullPage,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-5 py-12 text-center sm:py-16',
        fullPage && 'min-h-[60svh]',
        className,
      )}
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full rounded-full bg-gradient-to-br from-amber-300/30 via-rose-300/20 to-blue-300/30 blur-2xl dark:from-amber-500/15 dark:via-rose-500/10 dark:to-blue-500/15"
        />
        <span className="border-border bg-background inline-flex size-20 items-center justify-center rounded-full border shadow-sm">
          <Icon className="text-foreground/70 size-9" aria-hidden="true" />
        </span>
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>

      {primaryAction || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className={cn(buttonVariants({ variant: primaryAction.variant ?? 'primary' }))}
            >
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className={cn(buttonVariants({ variant: secondaryAction.variant ?? 'ghost' }))}
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
