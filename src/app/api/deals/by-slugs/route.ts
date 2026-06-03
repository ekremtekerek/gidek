import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDealsBySlugs } from '@/lib/db/queries/deals';

// Kısa slug listesi (recently viewed) → aktif deal'lar. GET query, en fazla 20 slug.
const schema = z.object({
  slugs: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20))
    .pipe(z.array(z.string().max(220)).max(20)),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({ slugs: req.nextUrl.searchParams.get('slugs') ?? '' });
  if (!parsed.success || parsed.data.slugs.length === 0) {
    return NextResponse.json({ deals: [] });
  }
  const deals = await getDealsBySlugs(parsed.data.slugs);
  return NextResponse.json({ deals });
}
