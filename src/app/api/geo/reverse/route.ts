import { z } from 'zod';
import { reverseGeocode } from '@/lib/maps/reverse-geocode';

export const runtime = 'nodejs';

const querySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
});

/**
 * Hafif reverse geocode — chat container kullanıcının semt adını öğrenmek
 * için çağırır. Mapbox cevabı module-level LRU'da cache'lendiği için aynı
 * koordinat tekrar tekrar maliyet çıkarmaz.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  let parsed: z.infer<typeof querySchema>;
  try {
    parsed = querySchema.parse({
      lat: url.searchParams.get('lat'),
      lng: url.searchParams.get('lng'),
    });
  } catch {
    return Response.json({ error: 'invalid coords' }, { status: 400 });
  }

  const result = await reverseGeocode(parsed.lat, parsed.lng);
  if (!result) {
    return Response.json({ district: null, city: null, label: null });
  }
  return Response.json(
    { district: result.district, city: result.city, label: result.label },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
