'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';
import {
  updateProfileAction,
  type ProfileActionState,
} from '@/app/profil/duzenle/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  initial: {
    display_name: string | null;
    phone: string | null;
    public_slug: string | null;
    is_public: boolean;
  };
  email: string | null | undefined;
}

const INITIAL: ProfileActionState = null;

export function ProfileEditForm({ initial, email }: Props) {
  const [state, formAction, pending] = useActionState(updateProfileAction, INITIAL);
  const err = state?.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" type="email" defaultValue={email ?? ''} disabled readOnly />
        <p className="text-muted-foreground text-xs">E-posta değişikliği için destek ile iletişime geç.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Görünen isim</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={initial.display_name ?? ''}
          placeholder="Adın veya nasıl çağrılmak istersen"
          maxLength={50}
          aria-invalid={err?.display_name ? 'true' : undefined}
        />
        {err?.display_name ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.display_name[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telefon (opsiyonel)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={initial.phone ?? ''}
          placeholder="+90 5xx xxx xx xx"
          maxLength={20}
          aria-invalid={err?.phone ? 'true' : undefined}
        />
        {err?.phone ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.phone[0]}</p>
        ) : null}
      </div>

      <div className="border-border flex flex-col gap-3 border-t pt-5">
        <div>
          <p className="text-foreground text-sm font-semibold">Public profil</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Aç → favori listenle birlikte paylaşılabilir bir sayfa kazanırsın:
            <code className="bg-muted text-foreground mx-1 rounded px-1 py-0.5 font-mono text-[11px]">
              gidek.net/u/&lt;kullanıcı-adın&gt;
            </code>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="public_slug">Kullanıcı adı</Label>
          <Input
            id="public_slug"
            name="public_slug"
            type="text"
            defaultValue={initial.public_slug ?? ''}
            placeholder="örn. asli-yilmaz"
            maxLength={30}
            pattern="[a-z0-9_-]+"
            aria-invalid={err?.public_slug ? 'true' : undefined}
          />
          {err?.public_slug ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.public_slug[0]}</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              Küçük harf, rakam, _ ve - kullanılabilir. 3-30 karakter.
            </p>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={initial.is_public}
            className="accent-foreground size-4"
          />
          Profilim ve favori listem herkese açık olsun
        </label>
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="border-border flex justify-end gap-3 border-t pt-5">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          <Save className="size-4" aria-hidden="true" />
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}
