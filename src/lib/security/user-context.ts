/**
 * Header bağlam chip'i (şehir) için saf tipler/sabitler/guard'lar.
 * Bu dosya hem server hem client tarafından güvenle import edilebilir.
 * Server-side cookie okuma: `user-context-server.ts`.
 * Server action: `user-context-actions.ts`.
 */
import { SUPPORTED_CITIES, type SupportedCity } from '@/lib/utils/constants';

export interface UserContext {
  city: SupportedCity;
}

export const CITY_COOKIE = 'gidek_city';
export const DEFAULT_CITY: SupportedCity = 'İstanbul';

export function isSupportedCity(v: string | undefined): v is SupportedCity {
  return v !== undefined && (SUPPORTED_CITIES as readonly string[]).includes(v);
}
