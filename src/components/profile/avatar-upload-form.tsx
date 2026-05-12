'use client';

import { useActionState, useRef, useState } from 'react';
import { Trash2, Upload, User as UserIcon } from 'lucide-react';
import {
  removeAvatarAction,
  uploadAvatarAction,
  type ProfileActionState,
} from '@/app/profil/duzenle/actions';
import { Button } from '@/components/ui/button';

interface Props {
  currentUrl: string | null;
  displayName: string;
}

const INITIAL: ProfileActionState = null;

export function AvatarUploadForm({ currentUrl, displayName }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [state, formAction, isFormPending] = useActionState(uploadAvatarAction, INITIAL);

  const uploading = pendingUpload || isFormPending;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* Preview */}
      <div className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full">
        {currentUrl ? (
          // Plain <img> so we don't have to add the local Supabase Storage
          // hostname to next/image's remotePatterns just for this. Avatars
          // are tiny — optimisation isn't a concern.
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentUrl}
            alt={displayName}
            className="size-full object-cover"
          />
        ) : (
          <UserIcon className="size-10" aria-hidden="true" />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-sm font-medium">Profil fotoğrafı</p>
        <p className="text-muted-foreground text-xs">
          JPEG, PNG veya WebP. En fazla 2 MB. Kare formatı önerilir.
        </p>

        {state?.error ? (
          <p
            role="alert"
            className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
          >
            {state.error}
          </p>
        ) : null}

        <form
          action={formAction}
          className="flex flex-wrap items-center gap-2"
          onSubmit={() => setPendingUpload(true)}
        >
          <input
            ref={fileInputRef}
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              if (e.currentTarget.files && e.currentTarget.files.length > 0) {
                // submit the parent form when a file is picked
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || pendingRemove}
          >
            <Upload className="size-4" aria-hidden="true" />
            {uploading ? 'Yükleniyor…' : currentUrl ? 'Değiştir' : 'Yükle'}
          </Button>

          {currentUrl ? (
            <Button
              formAction={removeAvatarAction}
              type="submit"
              variant="ghost"
              size="sm"
              disabled={uploading || pendingRemove}
              onClick={() => setPendingRemove(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Kaldır
            </Button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
