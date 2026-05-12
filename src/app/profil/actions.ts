'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export async function signOutAction() {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(withToast('/', TOAST_KEYS.logoutSuccess));
}
