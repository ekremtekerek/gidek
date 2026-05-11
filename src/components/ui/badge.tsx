import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground',
        accent: 'bg-foreground text-background',
        outline: 'border-border border bg-transparent',
        success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        discount: 'bg-rose-500 text-white',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
