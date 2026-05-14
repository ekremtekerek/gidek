'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { profileUpdateSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export type ProfileActionState =
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = profileUpdateSchema.safeParse({
    display_name: formData.get('display_name'),
    phone: formData.get('phone'),
    public_slug: formData.get('public_slug'),
    is_public: formData.get('is_public'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // is_public açıksa slug zorunlu — slug yoksa public yapamayız
  if (parsed.data.is_public && !parsed.data.public_slug) {
    return {
      ok: false,
      fieldErrors: { public_slug: ['Public profil için bir kullanıcı adı belirle'] },
    };
  }

  const supabase = await getServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: parsed.data.display_name,
      phone: parsed.data.phone,
      public_slug: parsed.data.public_slug,
      is_public: parsed.data.is_public,
    })
    .eq('id', user.id);

  if (error) {
    // Slug çakışmasını okunabilir hâle getir
    if (error.code === '23505') {
      return {
        ok: false,
        fieldErrors: { public_slug: ['Bu kullanıcı adı alınmış — başka birini dene'] },
      };
    }
    return { ok: false, error: 'Profil güncellenemedi: ' + error.message };
  }

  revalidatePath('/profil');
  revalidatePath('/', 'layout');
  redirect(withToast('/profil', TOAST_KEYS.profileUpdated));
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

export async function uploadAvatarAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const file = formData.get('avatar');

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Dosya seçilmedi.' };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { ok: false, error: 'Sadece JPEG, PNG veya WebP yükleyebilirsin.' };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { ok: false, error: "Dosya 2 MB'tan büyük olamaz." };
  }

  const supabase = await getServerClient();
  const ext = extFromMime(file.type);
  const path = `${user.id}/avatar.${ext}`;

  // Remove older avatars in different extensions so we don't accumulate.
  await supabase.storage
    .from('avatars')
    .remove(
      ['jpg', 'png', 'webp']
        .filter((e) => e !== ext)
        .map((e) => `${user.id}/avatar.${e}`),
    );

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) {
    console.error('avatar upload failed:', uploadErr);
    return { ok: false, error: 'Yükleme başarısız: ' + uploadErr.message };
  }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so the new image overwrites the old one in browser caches.
  const url = `${publicData.publicUrl}?v=${Date.now()}`;

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id);
  if (updErr) return { ok: false, error: 'Profil güncellenemedi.' };

  revalidatePath('/profil');
  revalidatePath('/', 'layout');
  redirect(withToast('/profil', TOAST_KEYS.avatarUpdated));
}

export async function removeAvatarAction(): Promise<void> {
  const user = await requireUser();
  const supabase = await getServerClient();

  await supabase.storage
    .from('avatars')
    .remove(['jpg', 'png', 'webp'].map((e) => `${user.id}/avatar.${e}`));

  await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);

  revalidatePath('/profil');
  revalidatePath('/', 'layout');
  redirect(withToast('/profil', TOAST_KEYS.avatarRemoved));
}
