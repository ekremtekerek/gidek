import { getDealsInBounds } from '@/lib/db/queries/deals';
import { boundsQuerySchema } from '@/lib/security/validators';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

const CATEGORY_SLUGS = new Set(MAIN_CATEGORIES.map((c) => c.slug as string));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = boundsQuerySchema.safeParse({
    swLat: url.searchParams.get('swLat'),
    swLng: url.searchParams.get('swLng'),
    neLat: url.searchParams.get('neLat'),
    neLng: url.searchParams.get('neLng'),
  });

  if (!parsed.success) {
    return Response.json(
      { error: 'Geçersiz harita sınırları.', code: 'INVALID_BOUNDS' },
      { status: 400 },
    );
  }

  const rawCategory = url.searchParams.get('category')?.trim();
  const categorySlug = rawCategory && CATEGORY_SLUGS.has(rawCategory) ? rawCategory : undefined;

  const { swLat, swLng, neLat, neLng } = parsed.data;
  const deals = await getDealsInBounds(
    { sw: { lat: swLat, lng: swLng }, ne: { lat: neLat, lng: neLng } },
    { categorySlug },
  );

  return Response.json({ deals });
}
