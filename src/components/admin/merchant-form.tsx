'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { AddressAutocomplete } from '@/components/admin/address-autocomplete';
import { SingleImageUploader } from '@/components/admin/single-image-uploader';
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

  // Controlled konum alanları — AddressAutocomplete bunları auto-fill eder,
  // manuel düzenleme de açık. Submit'te form bunlardan beslenir.
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [lat, setLat] = useState(
    initial?.lat !== null && initial?.lat !== undefined ? String(initial.lat) : '',
  );
  const [lng, setLng] = useState(
    initial?.lng !== null && initial?.lng !== undefined ? String(initial.lng) : '',
  );

  function applyAddress(s: { address: string; city?: string; district?: string; lat: number; lng: number }) {
    setAddress(s.address);
    if (s.city) setCity(s.city);
    if (s.district) setDistrict(s.district);
    setLat(s.lat.toFixed(6));
    setLng(s.lng.toFixed(6));
  }

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
        <div className="flex flex-col gap-1.5">
          <Label>Logo</Label>
          <SingleImageUploader
            name="logo_url"
            initialUrl={initial?.logo_url}
            label="Logo"
          />
          {err?.logo_url ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.logo_url[0]}</p>
          ) : null}
        </div>
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
        </div>
      </Section>

      <Section title="Konum">
        <div className="flex flex-col gap-1.5">
          <Label>Adres ara (Mapbox)</Label>
          <AddressAutocomplete
            defaultValue={initial?.address ?? ''}
            onSelect={applyAddress}
            placeholder="Örn. Kuruçeşme Kuruçeşme Cd. veya Bağdat Caddesi 100"
          />
          <p className="text-muted-foreground text-xs">
            Bir öneri seç → adres, şehir, ilçe ve koordinatlar otomatik dolar. İstersen aşağıda manuel düzenle.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Adres</Label>
          <Input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Sokak / cadde / numara"
            aria-invalid={err?.address ? 'true' : undefined}
          />
          {err?.address ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.address[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">Şehir</Label>
            <Input
              id="city"
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-invalid={err?.city ? 'true' : undefined}
            />
            {err?.city ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.city[0]}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="district">İlçe</Label>
            <Input
              id="district"
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              aria-invalid={err?.district ? 'true' : undefined}
            />
            {err?.district ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.district[0]}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lat">Enlem</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              aria-invalid={err?.lat ? 'true' : undefined}
            />
            {err?.lat ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.lat[0]}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lng">Boylam</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              aria-invalid={err?.lng ? 'true' : undefined}
            />
            {err?.lng ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.lng[0]}</p>
            ) : null}
          </div>
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
