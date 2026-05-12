'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  createMerchantAction,
  updateMerchantAction,
  type MerchantFormState,
} from '@/app/admin/merchants/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INITIAL: MerchantFormState = null;

type MerchantRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  is_active: boolean;
  is_verified: boolean;
};

interface Props {
  initial?: MerchantRecord;
}

export function MerchantForm({ initial }: Props) {
  const editing = Boolean(initial);
  const action = editing
    ? (state: MerchantFormState, fd: FormData) => updateMerchantAction(initial!.id, state, fd)
    : createMerchantAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = state && 'fieldErrors' in state ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Section title="Kimlik">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Slug"
            name="slug"
            defaultValue={initial?.slug}
            error={err?.slug}
            required
            pattern="[a-z0-9-]+"
          />
          <Field label="Görünen ad" name="name" defaultValue={initial?.name} error={err?.name} required />
        </div>
        <Textarea
          label="Açıklama"
          name="description"
          defaultValue={initial?.description ?? ''}
          rows={3}
          error={err?.description}
        />
        <Field
          label="Logo URL (opsiyonel)"
          name="logo_url"
          type="url"
          defaultValue={initial?.logo_url ?? ''}
          error={err?.logo_url}
        />
      </Section>

      <Section title="İletişim">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" name="phone" defaultValue={initial?.phone ?? ''} error={err?.phone} />
          <Field
            label="E-posta"
            name="email"
            type="email"
            defaultValue={initial?.email ?? ''}
            error={err?.email}
          />
          <Field
            label="Web sitesi"
            name="website"
            type="url"
            defaultValue={initial?.website ?? ''}
            error={err?.website}
          />
          <Field label="Adres" name="address" defaultValue={initial?.address ?? ''} error={err?.address} />
        </div>
      </Section>

      <Section title="Konum">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Şehir" name="city" defaultValue={initial?.city ?? ''} error={err?.city} />
          <Field label="İlçe" name="district" defaultValue={initial?.district ?? ''} error={err?.district} />
          <Field
            label="Enlem (lat)"
            name="lat"
            type="number"
            step="any"
            defaultValue={initial?.lat ?? ''}
            error={err?.lat}
          />
          <Field
            label="Boylam (lng)"
            name="lng"
            type="number"
            step="any"
            defaultValue={initial?.lng ?? ''}
            error={err?.lng}
          />
        </div>
      </Section>

      <Section title="Durum">
        <div className="flex flex-wrap items-center gap-5">
          <CheckboxField name="is_active" defaultChecked={initial?.is_active ?? true}>
            Aktif (kullanıcılara görünür)
          </CheckboxField>
          <CheckboxField name="is_verified" defaultChecked={initial?.is_verified ?? false}>
            Doğrulanmış işletme
          </CheckboxField>
        </div>
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
          {pending ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'İşletmeyi oluştur'}
        </Button>
        <Link
          href="/admin/merchants"
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
        className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[88px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
        {...rest}
      />
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error[0]}</p> : null}
    </div>
  );
}

function CheckboxField({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-foreground size-4"
      />
      {children}
    </label>
  );
}
