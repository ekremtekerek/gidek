'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  createMerchantDealApplicationAction,
  updateMerchantDealAction,
  type MerchantDealFormState,
} from '@/app/isletme/firsatlar/actions';
import { DealAiAssist } from '@/components/admin/deal-ai-assist';
import { ImageUploader } from '@/components/admin/image-uploader';
import { Button } from '@/components/ui/button';
import { DateTimeField } from '@/components/ui/datetime-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AUDIENCE, DEAL_TAGS, MAIN_CATEGORIES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

const FORM_ID = 'merchant-deal-form';

type DealRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  categories: string[];
  cover_image: string;
  images: string[];
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
};

interface Props {
  initial?: DealRecord;
  /** Merchant'ın varsayılan şehri — yeni başvuru için doldurulur. */
  defaultCity?: string;
  defaultDistrict?: string;
}

const INITIAL: MerchantDealFormState = null;

function toLocalDateInput(value: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 16);
  return new Date(value).toISOString().slice(0, 16);
}

export function MerchantDealForm({ initial, defaultCity, defaultDistrict }: Props) {
  const editing = Boolean(initial);
  const action = editing
    ? (state: MerchantDealFormState, fd: FormData) =>
        updateMerchantDealAction(initial!.id, state, fd)
    : createMerchantDealApplicationAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = state?.fieldErrors;

  const [city, setCity] = useState(initial?.city ?? defaultCity ?? 'İstanbul');
  const [district, setDistrict] = useState(
    initial?.district ?? defaultDistrict ?? '',
  );

  const isSelectedTag = (slug: string) => initial?.tags.includes(slug) ?? false;
  const isSelectedAudience = (slug: string) =>
    initial?.audience.includes(slug) ?? false;
  const isSelectedCategory = (slug: string) =>
    initial?.categories.includes(slug) ?? false;

  return (
    <form id={FORM_ID} action={formAction} className="flex flex-col gap-6" noValidate>
      {!editing ? <DealAiAssist formId={FORM_ID} /> : null}

      {editing ? null : (
        <div className="border-amber-500/30 bg-amber-500/5 flex items-start gap-3 rounded-xl border p-4">
          <span className="text-amber-700 dark:text-amber-300 text-xl leading-none">⏳</span>
          <div>
            <p className="text-foreground text-sm font-medium">
              Bu bir başvuru — admin onayından sonra yayına girer
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Ekibimiz inceleyip onayladığında fırsatın gidek üzerinde arama,
              AI öneri ve kategori sayfalarında görünmeye başlar.
            </p>
          </div>
        </div>
      )}

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
      </Section>

      <Section title="Kategoriler">
        <ChipGroup
          label="En az bir kategori seç"
          name="categories"
          items={MAIN_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          isSelected={isSelectedCategory}
          error={err?.categories}
        />
      </Section>

      <Section title="Görsel & fiyat">
        <div className="flex flex-col gap-2">
          <Label>Fotoğraflar</Label>
          <ImageUploader
            initialCover={initial?.cover_image}
            initialImages={initial?.images}
          />
          {err?.cover_image ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.cover_image[0]}</p>
          ) : null}
        </div>
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">Şehir</Label>
            <Input
              id="city"
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            {err?.city ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.city[0]}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="district">Semt</Label>
            <Input
              id="district"
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>
          <Field
            label="Mekan adı"
            name="venue_name"
            defaultValue={initial?.venue_name ?? ''}
            error={err?.venue_name}
            placeholder="örn. Boğaziçi Restoran"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Süre (dakika)"
            name="duration_minutes"
            type="number"
            min={0}
            step={15}
            defaultValue={initial?.duration_minutes ?? ''}
            error={err?.duration_minutes}
            placeholder="ör. 90"
          />
          <Field
            label="Maks adet (kullanıcı başı)"
            name="max_per_user"
            type="number"
            min={1}
            max={20}
            step={1}
            defaultValue={initial?.max_per_user ?? 4}
            error={err?.max_per_user}
          />
        </div>
      </Section>

      <Section title="Geçerlilik">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Başlangıç</Label>
            <DateTimeField
              name="valid_from"
              defaultValue={toLocalDateInput(initial?.valid_from ?? null)}
              required
            />
            {err?.valid_from ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.valid_from[0]}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Bitiş</Label>
            <DateTimeField
              name="valid_until"
              defaultValue={toLocalDateInput(initial?.valid_until ?? null)}
              required
            />
            {err?.valid_until ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.valid_until[0]}</p>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="Etiketler ve kitle">
        <ChipGroup
          label="Etiketler"
          name="tags"
          items={DEAL_TAGS.map((t) => ({ value: t.slug, label: t.label }))}
          isSelected={isSelectedTag}
          error={err?.tags}
        />
        <ChipGroup
          label="Hedef kitle"
          name="audience"
          items={AUDIENCE.map((a) => ({ value: a.slug, label: a.label }))}
          isSelected={isSelectedAudience}
          error={err?.audience}
        />
      </Section>

      <Section title="Öne çıkanlar">
        <Textarea
          label="Madde madde (her satır bir madde)"
          name="highlights"
          defaultValue={(initial?.highlights ?? []).join('\n')}
          rows={4}
          error={err?.highlights}
        />
      </Section>

      {state && 'error' in state && state.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/isletme/firsatlar"
          className="text-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:underline"
        >
          Vazgeç
        </Link>
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending
            ? 'Gönderiliyor…'
            : editing
              ? 'Değişiklikleri kaydet'
              : 'Onaya gönder'}
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
        aria-invalid={error ? 'true' : undefined}
        className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[88px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
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
