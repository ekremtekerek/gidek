import { z } from 'zod';
import { getPublicClient } from '@/lib/db/public';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';
import { getUserContext } from '@/lib/security/user-context-server';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
});

export interface SearchHit {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string;
  city: string;
  district: string | null;
  discounted_price: string | number;
  original_price: string | number;
  discount_percent: number | null;
}

export interface SearchCategoryHit {
  slug: string;
  name: string;
}

export interface SearchResponse {
  deals: SearchHit[];
  categories: SearchCategoryHit[];
}

/**
 * Type-ahead arama — deal başlık/subtitle ILIKE + kategori adı match.
 * Sadece aktif (yayında + henüz dolmamış) fırsatlar döner.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get('q') });
  if (!parsed.success) {
    return Response.json({ deals: [], categories: [] } satisfies SearchResponse);
  }

  const query = parsed.data.q;
  const normalized = query.toLocaleLowerCase('tr-TR');

  // Kategori match — client-side, sabit liste hızlı.
  const categories: SearchCategoryHit[] = MAIN_CATEGORIES.filter((c) =>
    c.name.toLocaleLowerCase('tr-TR').includes(normalized),
  )
    .slice(0, 3)
    .map((c) => ({ slug: c.slug, name: c.name }));

  // ILIKE pattern — escape Postgres wildcards so user query stays literal.
  const escaped = query.replace(/[%_\\]/g, (m) => `\\${m}`);
  const pattern = `%${escaped}%`;

  const ctx = await getUserContext();
  const supabase = getPublicClient();
  const nowIso = new Date().toISOString();

  let dealQuery = supabase
    .from('deals')
    .select(
      'id, slug, title, subtitle, cover_image, city, district, discounted_price, original_price, discount_percent',
    )
    .or(`title.ilike.${pattern},subtitle.ilike.${pattern}`)
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso)
    .order('sort_priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(5);

  if (ctx.city) dealQuery = dealQuery.eq('city', ctx.city);

  const { data, error } = await dealQuery;
  if (error) {
    return Response.json(
      { deals: [], categories } satisfies SearchResponse,
      { status: 500 },
    );
  }

  return Response.json({
    deals: (data ?? []) as SearchHit[],
    categories,
  } satisfies SearchResponse);
}
