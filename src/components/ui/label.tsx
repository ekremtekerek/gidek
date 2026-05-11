import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('text-foreground text-sm font-medium leading-none', className)}
      {...props}
    />
  );
});
