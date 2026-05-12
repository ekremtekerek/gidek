import { z } from 'zod';
import { getPublicClient } from '@/lib/db/public';
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get('q') });
  if (!parsed.success) {
    return Response.json({ deals: [] satisfies SearchHit[] });
  }

  // ILIKE pattern — escape Postgres wildcards so user query stays literal.
  const escaped = parsed.data.q.replace(/[%_\\]/g, (m) => `\\${m}`);
  const pattern = `%${escaped}%`;

  const ctx = await getUserContext();
  const supabase = getPublicClient();

  let query = supabase
    .from('deals')
    .select(
      'id, slug, title, subtitle, cover_image, city, district, discounted_price, original_price, discount_percent',
    )
    .or(`title.ilike.${pattern},subtitle.ilike.${pattern}`)
    .order('sort_priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(8);

  if (ctx.city) query = query.eq('city', ctx.city);

  const { data, error } = await query;
  if (error) {
    return Response.json({ deals: [] satisfies SearchHit[] }, { status: 500 });
  }

  return Response.json({ deals: (data ?? []) as SearchHit[] });
}
