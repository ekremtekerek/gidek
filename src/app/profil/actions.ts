'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';

export async function signOutAction() {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
