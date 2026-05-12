'use client';

import { useState } from 'react';
import { DateField } from './date-field';
import { TimeField } from './time-field';

interface Props {
  name: string;
  /** ISO datetime-local format: YYYY-MM-DDTHH:mm */
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Tarih + saat birleşik alanı. Form'a `name` ile datetime-local formatında
 * (YYYY-MM-DDTHH:mm) gizli input olarak değer verir.
 */
export function DateTimeField({ name, defaultValue, required, disabled }: Props) {
  const [initialDate, initialTime] = splitInitial(defaultValue);
  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(initialTime);

  const combined = date && time ? `${date}T${time}` : '';

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
      <input type="hidden" name={name} value={combined} required={required} />
      <DateField
        name={`${name}__date`}
        value={date}
        onChange={setDate}
        disabled={disabled}
      />
      <TimeField
        name={`${name}__time`}
        value={time}
        onChange={setTime}
        disabled={disabled}
      />
    </div>
  );
}

function splitInitial(v?: string): [string, string] {
  if (!v) return ['', ''];
  const [d, t] = v.split('T');
  return [d ?? '', t?.slice(0, 5) ?? ''];
}
