'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from '@/app/admin/categories/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INITIAL: CategoryFormState = null;

export type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

interface Props {
  initial?: CategoryRecord;
  /** Üst kategori seçici için diğer kategoriler (mevcut kayıt hariç). */
  parents: CategoryOption[];
}

export function CategoryForm({ initial, parents }: Props) {
  const editing = Boolean(initial);
  const action = editing
    ? (state: CategoryFormState, fd: FormData) => updateCategoryAction(initial!.id, state, fd)
    : createCategoryAction;
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
            placeholder="ornek-kategori"
          />
          <Field
            label="Görünen ad"
            name="name"
            defaultValue={initial?.name}
            error={err?.name}
            required
            placeholder="Örnek Kategori"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="parent_id">Üst kategori (opsiyonel)</Label>
            <select
              id="parent_id"
              name="parent_id"
              defaultValue={initial?.parent_id ?? ''}
              className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-10 w-full rounded-md border px-3 text-sm transition-colors focus:ring-2 focus:outline-none"
            >
              <option value="">— Ana kategori —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
            {err?.parent_id ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.parent_id[0]}</p>
            ) : null}
          </div>

          <Field
            label="İkon (slug)"
            name="icon"
            defaultValue={initial?.icon ?? ''}
            error={err?.icon}
            placeholder="örn. theater, music, coffee…"
          />
        </div>

        <Field
          label="Sıra"
          name="sort_order"
          type="number"
          defaultValue={String(initial?.sort_order ?? 0)}
          error={err?.sort_order}
          min={0}
          max={9999}
        />

        <Textarea
          label="Açıklama"
          name="description"
          defaultValue={initial?.description ?? ''}
          rows={3}
          error={err?.description}
          placeholder="Kategorinin kısa tanımı — UI'da görünebilir."
        />
      </Section>

      <Section title="SEO">
        <Field
          label="Meta başlık"
          name="meta_title"
          defaultValue={initial?.meta_title ?? ''}
          error={err?.meta_title}
          placeholder="Boş bırakırsan görünen ad kullanılır."
        />
        <Textarea
          label="Meta açıklama"
          name="meta_description"
          defaultValue={initial?.meta_description ?? ''}
          rows={2}
          error={err?.meta_description}
          placeholder="160 karakterin altında, davetkâr bir özet."
        />
      </Section>

      <Section title="Durum">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="accent-foreground size-4"
          />
          Aktif (kullanıcılara görünür)
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
          {pending ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Kategoriyi oluştur'}
        </Button>
        <Link
          href="/admin/categories"
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
