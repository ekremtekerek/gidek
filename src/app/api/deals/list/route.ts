import { z } from 'zod';
import { listDeals } from '@/lib/db/queries/deals';
import { getUserContext } from '@/lib/security/user-context-server';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    offset: url.searchParams.get('offset') ?? 0,
    limit: url.searchParams.get('limit') ?? 12,
  });
  if (!parsed.success) {
    return Response.json({ error: 'Geçersiz sorgu.' }, { status: 400 });
  }

  const ctx = await getUserContext();
  const { offset, limit } = parsed.data;
  // Bir fazla iste; tam dolarsa "nextOffset" set ederiz (daha var sinyali).
  const deals = await listDeals({ limit: limit + 1, offset, city: ctx.city });
  const hasMore = deals.length > limit;
  const page = hasMore ? deals.slice(0, limit) : deals;

  return Response.json({
    deals: page,
    nextOffset: hasMore ? offset + limit : null,
  });
}
