'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CITY_COOKIE, isSupportedCity } from '@/lib/security/user-context';

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setCityAction(city: string) {
  const store = await cookies();
  if (isSupportedCity(city)) {
    store.set(CITY_COOKIE, city, { path: '/', maxAge: YEAR_SECONDS, sameSite: 'lax' });
  }
  revalidatePath('/', 'layout');
}
