'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createDealAction, updateDealAction, type DealFormState } from '@/app/admin/deals/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AUDIENCE, DEAL_TAGS, MAIN_CATEGORIES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

type MerchantOption = { id: string; name: string; city: string | null };
type DealRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  merchant_id: string;
  categories: string[];
  cover_image: string;
  original_price: number;
  discounted_price: number;
  city: string;
  district: string | null;
  venue_name: string | null;
  duration_minutes: number | null;
  valid_from: string;
  valid_until: string;
  max_per_user: number;
  tags: string[];
  audience: string[];
  highlights: string[];
  is_active: boolean;
  is_featured: boolean;
  published_at: string | null;
};

interface Props {
  merchants: MerchantOption[];
  initial?: DealRecord;
}

const INITIAL: DealFormState = null;

function toLocalDateInput(value: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 16);
  return new Date(value).toISOString().slice(0, 16);
}

export function DealForm({ merchants, initial }: Props) {
  const editing = Boolean(initial);
  const action = editing
    ? (state: DealFormState, formData: FormData) =>
        updateDealAction(initial!.id, state, formData)
    : createDealAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const err = state?.fieldErrors;
  const isSelectedTag = (slug: string) => initial?.tags.includes(slug) ?? false;
  const isSelectedAudience = (slug: string) => initial?.audience.includes(slug) ?? false;
  const isSelectedCategory = (slug: string) => initial?.categories.includes(slug) ?? false;

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <Section title="Temel bilgiler">
        <Field label="Başlık" name="title" defaultValue={initial?.title} error={err?.title} required />
        <Field
          label="Alt başlık"
          name="subtitle"
          defaultValue={initial?.subtitle ?? ''}
          error={err?.subtitle}
        />
        <Textarea
          label="Açıklama"
          name="description"
          defaultValue={initial?.description}
          rows={6}
          required
          error={err?.description}
          minLength={20}
          maxLength={5000}
        />
        <Field
          label="Slug (boş bırak otomatik üretilsin)"
          name="slug"
          defaultValue={initial?.slug}
          error={err?.slug}
          placeholder="boş bırak"
        />
      </Section>

      <Section title="Tedarikçi & kategoriler">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="merchant_id">Tedarikçi</Label>
          <select
            id="merchant_id"
            name="merchant_id"
            defaultValue={initial?.merchant_id ?? ''}
            required
            className="border-border bg-background focus:border-foreground/50 h-11 rounded-md border px-3.5 text-sm"
          >
            <option value="" disabled>Seç…</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.city ? `(${m.city})` : ''}
              </option>
            ))}
          </select>
          {err?.merchant_id ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.merchant_id[0]}</p>
          ) : null}
        </div>

        <ChipGroup
          label="Kategoriler"
          name="categories"
          items={MAIN_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          isSelected={isSelectedCategory}
          error={err?.categories}
        />
      </Section>

      <Section title="Görsel & fiyat">
        <Field
          label="Kapak resmi URL"
          name="cover_image"
          defaultValue={initial?.cover_image}
          required
          placeholder="https://…"
          error={err?.cover_image}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Normal fiyat (₺)"
            name="original_price"
            type="number"
            min={0}
            step={50}
            defaultValue={initial?.original_price ?? ''}
            required
            error={err?.original_price}
          />
          <Field
            label="İndirimli fiyat (₺)"
            name="discounted_price"
            type="number"
            min={0}
            step={50}
            defaultValue={initial?.discounted_price ?? ''}
            required
            error={err?.discounted_price}
          />
        </div>
      </Section>

      <Section title="Konum & süre">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Şehir"
            name="city"
            defaultValue={initial?.city ?? 'İstanbul'}
            required
            error={err?.city}
          />
          <Field label="Semt" name="district" defaultValue={initial?.district ?? ''} />
          <Field
            label="Mekan adı"
            name="venue_name"
            defaultValue={initial?.venue_name ?? ''}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Süre (dakika)"
            name="duration_minutes"
            type="number"
            min={0}
            step={15}
            defaultValue={initial?.duration_minutes ?? ''}
          />
          <Field
            label="Kişi başı en fazla"
            name="max_per_user"
            type="number"
            min={1}
            max={50}
            step={1}
            defaultValue={initial?.max_per_user ?? 4}
            required
          />
        </div>
      </Section>

      <Section title="Geçerlilik">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Geçerli (başlangıç)"
            name="valid_from"
            type="datetime-local"
            defaultValue={toLocalDateInput(initial?.valid_from ?? null)}
            required
          />
          <Field
            label="Geçerli (bitiş)"
            name="valid_until"
            type="datetime-local"
            defaultValue={toLocalDateInput(initial?.valid_until ?? null)}
            required
            error={err?.valid_until}
          />
        </div>
      </Section>

      <Section title="Sınıflandırma">
        <ChipGroup
          label="Kitle (audience)"
          name="audience"
          items={AUDIENCE.map((a) => ({ value: a.slug, label: a.label }))}
          isSelected={isSelectedAudience}
        />
        <ChipGroup
          label="Etiketler"
          name="tags"
          items={DEAL_TAGS.map((t) => ({ value: t.slug, label: t.label }))}
          isSelected={isSelectedTag}
        />
      </Section>

      <Section title="Öne çıkanlar">
        <Textarea
          label="Madde madde (her satır bir madde)"
          name="highlights"
          defaultValue={(initial?.highlights ?? []).join('\n')}
          rows={4}
        />
      </Section>

      <Section title="Yayın">
        <div className="flex flex-wrap gap-4">
          <Toggle
            name="is_active"
            label="Aktif"
            defaultChecked={initial ? initial.is_active : true}
          />
          <Toggle name="is_featured" label="Öne çıkan" defaultChecked={initial?.is_featured ?? false} />
          <Toggle
            name="published_now"
            label="Şimdi yayınla"
            defaultChecked={!editing}
          />
        </div>
      </Section>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/admin/deals"
          className={cn(
            'text-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:underline',
          )}
        >
          Vazgeç
        </Link>
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Fırsatı oluştur'}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-background rounded-xl border p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
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
        className="border-border bg-background focus:border-foreground/50 min-h-24 w-full rounded-md border p-3 text-sm"
        {...rest}
      />
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error[0]}</p> : null}
    </div>
  );
}

function ChipGroup({
  label,
  name,
  items,
  isSelected,
  error,
}: {
  label: string;
  name: string;
  items: { value: string; label: string }[];
  isSelected: (v: string) => boolean;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <label key={it.value} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={it.value}
              defaultChecked={isSelected(it.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'border-border bg-background hover:border-foreground/30 inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                'peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground',
              )}
            >
              {it.label}
            </span>
          </label>
        ))}
      </div>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error[0]}</p> : null}
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="border-border bg-background hover:bg-muted/40 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4" />
      {label}
    </label>
  );
}
