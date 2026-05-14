'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  createCouponAction,
  updateCouponAction,
  type CouponFormState,
} from '@/app/admin/coupons/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INITIAL: CouponFormState = null;

export type CouponRecord = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
};

/** ISO → datetime-local "YYYY-MM-DDTHH:MM" (saatleri yerel olarak gösterir). */
function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CouponForm({ initial }: { initial?: CouponRecord }) {
  const editing = Boolean(initial);
  const action = editing
    ? (state: CouponFormState, fd: FormData) => updateCouponAction(initial!.id, state, fd)
    : createCouponAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = state && 'fieldErrors' in state ? state.fieldErrors : undefined;
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(
    (initial?.discount_type as 'percent' | 'fixed') ?? 'percent',
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Section title="Kod ve indirim">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Kod"
            name="code"
            defaultValue={initial?.code}
            error={err?.code}
            required
            pattern="[A-Za-z0-9_-]+"
            placeholder="HOSGELDIN10"
            className="uppercase"
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discount_type">İndirim tipi</Label>
            <select
              id="discount_type"
              name="discount_type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
              className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-10 w-full rounded-md border px-3 text-sm transition-colors focus:ring-2 focus:outline-none"
            >
              <option value="percent">Yüzde (%)</option>
              <option value="fixed">Sabit tutar (₺)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label={discountType === 'percent' ? 'Yüzde (%)' : 'Tutar (₺)'}
            name="discount_value"
            type="number"
            step={discountType === 'percent' ? '1' : '0.01'}
            min={0.01}
            max={discountType === 'percent' ? 100 : undefined}
            defaultValue={initial?.discount_value ? String(initial.discount_value) : ''}
            required
            error={err?.discount_value}
          />
          <Field
            label="Min. sepet (₺)"
            name="min_order_amount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={String(initial?.min_order_amount ?? 0)}
            error={err?.min_order_amount}
          />
          <Field
            label="Max kullanım"
            name="max_uses"
            type="number"
            min={1}
            step={1}
            defaultValue={initial?.max_uses ? String(initial.max_uses) : ''}
            error={err?.max_uses}
            placeholder="Boş = sınırsız"
          />
        </div>

        <Textarea
          label="Açıklama (admin için)"
          name="description"
          defaultValue={initial?.description ?? ''}
          rows={2}
          error={err?.description}
          placeholder="Ne için: kampanya, etkinlik, partner…"
        />
      </Section>

      <Section title="Geçerlilik">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Başlangıç"
            name="valid_from"
            type="datetime-local"
            defaultValue={isoToLocal(initial?.valid_from)}
            error={err?.valid_from}
          />
          <Field
            label="Bitiş"
            name="valid_until"
            type="datetime-local"
            defaultValue={isoToLocal(initial?.valid_until)}
            error={err?.valid_until}
            placeholder="Boş = sonsuz"
          />
        </div>
        {editing ? (
          <p className="text-muted-foreground text-xs">
            Bu kupon {initial!.used_count} kez kullanılmış.
          </p>
        ) : null}
      </Section>

      <Section title="Durum">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="accent-foreground size-4"
          />
          Aktif
        </label>
      </Section>

      {state && 'error' in state && state.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? 'Kaydediliyor…' : editing ? 'Kaydet' : 'Kupon oluştur'}
        </Button>
        <Link
          href="/admin/coupons"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={error ? 'true' : undefined} {...rest} />
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error[0]}</p> : null}
    </div>
  );
}

function Textarea({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string[];
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[60px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
        {...rest}
      />
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error[0]}</p> : null}
    </div>
  );
}
