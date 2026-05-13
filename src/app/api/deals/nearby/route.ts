import { z } from 'zod';
import { getPublicClient } from '@/lib/db/public';
import { haversineKm } from '@/lib/utils/geo';

export const runtime = 'nodejs';

const querySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
  limit: z.coerce.number().int().min(1).max(24).default(8),
  city: z.string().min(1).max(50).optional(),
});

/**
 * Konuma göre yakın aktif fırsatlar — anasayfa "Sana en yakın fırsatlar"
 * carousel'i konum izni alındığında çağırır. RAG değil, saf Haversine
 * sıralaması; cost yok, latency düşük.
 *
 * Şu anki şehir filtresinde gezinen kullanıcılar için yalnızca o şehrin
 * fırsatlarını döner — bbox kavramı yok, basit "en yakın N" döner.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  let parsed: z.infer<typeof querySchema>;
  try {
    parsed = querySchema.parse({
      lat: url.searchParams.get('lat'),
      lng: url.searchParams.get('lng'),
      limit: url.searchParams.get('limit'),
      city: url.searchParams.get('city') ?? undefined,
    });
  } catch {
    return Response.json({ error: 'invalid params' }, { status: 400 });
  }

  const supabase = getPublicClient();
  const nowIso = new Date().toISOString();

  // 200 satıra kadar aktif fırsat çek — birkaç şehir bazında küçük V1, top-N
  // sıralaması istemci dostu Haversine ile yapılır. pgvector index ya da
  // earthdistance hızlandırması ileride gerekirse eklenir.
  let q = supabase
    .from('deals')
    .select(`
      *,
      merchant:merchants!inner ( name, slug, city, district, lat, lng )
    `)
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso)
    .not('merchant.lat', 'is', null)
    .not('merchant.lng', 'is', null)
    .limit(200);

  if (parsed.city) q = q.eq('city', parsed.city);

  const { data, error } = await q;
  if (error) return Response.json({ error: 'fetch failed' }, { status: 500 });

  type RowMerchant = { lat: number | null; lng: number | null } | null;
  type Row = { id: string; merchant: RowMerchant; [k: string]: unknown };

  const withDist = (data ?? []).map((d) => {
    const m = (d as unknown as Row).merchant;
    const mLat = m?.lat;
    const mLng = m?.lng;
    if (mLat === null || mLat === undefined || mLng === null || mLng === undefined) {
      return { row: d, km: Number.POSITIVE_INFINITY };
    }
    return {
      row: d,
      km: haversineKm({ lat: parsed.lat, lng: parsed.lng }, { lat: Number(mLat), lng: Number(mLng) }),
    };
  });

  withDist.sort((a, b) => a.km - b.km);
  const top = withDist.slice(0, parsed.limit).map((x) => x.row);

  return Response.json(
    { deals: top },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
