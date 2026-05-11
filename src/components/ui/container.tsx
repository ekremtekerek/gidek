import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Page-width wrapper. Mobile-first, max-w-7xl on desktop.
 * Use to constrain content inside full-width sections.
 */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...props} />;
}
