'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md';
}

/**
 * Tasarıma uyumlu checkbox. Native input + custom görsel.
 * Native input erişilebilirlik için screen-reader'lara visible kalır
 * (sr-only değil, sadece görsel olarak hidden). Yanına label koymak için
 * wrapper component (CheckboxField) kullan veya manuel sar.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, size = 'md', checked, disabled, ...props },
  ref,
) {
  const sizeCls = size === 'sm' ? 'size-4' : 'size-[18px]';
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-md transition-all',
        sizeCls,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          'border-border bg-background peer-checked:bg-foreground peer-checked:border-foreground peer-focus-visible:ring-foreground/30 inline-flex size-full items-center justify-center rounded-md border-[1.5px] transition-all peer-focus-visible:ring-2 peer-disabled:opacity-40',
          className,
        )}
      >
        <Check
          className={cn(
            'text-background opacity-0 transition-opacity peer-checked:opacity-100',
            size === 'sm' ? 'size-3' : 'size-3.5',
          )}
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
    </span>
  );
});

/**
 * Checkbox + label birleşik component. Tek satır kullanım için.
 */
interface CheckboxFieldProps extends CheckboxProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export function CheckboxField({
  label,
  description,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <label
      className={cn(
        'group hover:bg-muted/60 flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors',
        props.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <Checkbox {...props} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-tight">{label}</span>
        {description ? (
          <span className="text-muted-foreground mt-0.5 block text-[11px] leading-snug">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * Peer-checked çalışması için: native input'un peer olduğu yerde Check de
 * peer-checked:opacity-100 olmalı. Wrapper içindeki span'in 'peer' selector
 * sibling olduğu için Check zaten input'un peer'i. Tailwind v4'te
 * `peer-checked:opacity-100` doğru sibling'i hedefler.
 */
