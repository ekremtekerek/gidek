import 'server-only';
import { cookies } from 'next/headers';
import {
  CITY_COOKIE,
  DEFAULT_CITY,
  isSupportedCity,
  type UserContext,
} from '@/lib/security/user-context';

/** Server'dan bağlamı oku — RSC layout/page'lerinde kullanılır. */
export async function getUserContext(): Promise<UserContext> {
  const store = await cookies();
  const cityRaw = store.get(CITY_COOKIE)?.value;
  return {
    city: isSupportedCity(cityRaw) ? cityRaw : DEFAULT_CITY,
  };
}
