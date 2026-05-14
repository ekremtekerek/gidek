import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Şehir bingosu: kullanıcı aynı şehirde 5 farklı ilçeden onaylı booking
 * yapınca özel %15 kupon kazanır. Her şehir başına bir kez verilir.
 *
 * Booking onayından sonra fire-and-forget olarak çağrılır. RPC idempotent:
 * mevcut claim varsa o kodu döner. Service role'den çalışır, user_id'yi
 * dışarıdan alır — request context'ine bağımlı değil.
 *
 * @param userId
 * @param city — fırsatın bulunduğu şehir (deals.city)
 * @returns Kazanılan/mevcut kupon kodu, yoksa null
 */
export async function maybeClaimCityBingo(
  userId: string,
  city: string | null,
): Promise<string | null> {
  const c = (city ?? '').trim();
  if (!c) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc('claim_city_bingo', {
    p_user_id: userId,
    p_city: c,
  });
  if (error) {
    console.error('[bingo] claim_city_bingo failed:', error);
    return null;
  }
  return data ?? null;
}

export interface BingoCityProgress {
  city: string;
  districts: string[];
  districtCount: number;
  claimed: boolean;
  couponCode: string | null;
}

/**
 * Profile sayfası için: kullanıcının tüm şehirlerde ilçe ilerlemesi.
 * service client ile çekiyoruz; RPC security-definer + p_user_id ile çalışır.
 */
export async function listBingoProgress(userId: string): Promise<BingoCityProgress[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc('bingo_progress_for_user', {
    p_user_id: userId,
  });
  if (error) {
    console.error('[bingo] progress fetch failed:', error);
    return [];
  }
  interface RawRow {
    city: string | null;
    districts: string[] | null;
    district_count: number | null;
    claimed: boolean | null;
    coupon_code: string | null;
  }
  const rows = (data ?? []) as unknown as RawRow[];
  return rows.map((r) => ({
    city: r.city ?? '',
    districts: r.districts ?? [],
    districtCount: r.district_count ?? 0,
    claimed: r.claimed ?? false,
    couponCode: r.coupon_code ?? null,
  }));
}

export const BINGO_THRESHOLD = 5;
