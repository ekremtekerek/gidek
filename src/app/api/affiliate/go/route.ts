import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { getCurrentUser } from '@/lib/security/auth';
import type { AffiliateOption } from '@/lib/affiliate/mapping';

// Yalnızca bu host'a redirect — open-redirect koruması.
const ALLOWED_HOST = 'firsatbufirsat.com';

const querySchema = z.object({
  deal: z.string().uuid('Geçersiz fırsat'),
  opt: z.string().min(1).max(64).optional(),
});

function isAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === ALLOWED_HOST || u.hostname.endsWith(`.${ALLOWED_HOST}`));
  } catch {
    return false;
  }
}

/**
 * Affiliate tıklama köprüsü: seçilen bilet tipinin/etkinliğin checkout linkine
 * 302 ile yönlendirir ve tıklamayı affiliate_clicks'e loglar. Hedef URL daima
 * deal'ın kendi affiliate_options/external_url'inden gelir → open-redirect yok.
 */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    deal: req.nextUrl.searchParams.get('deal') ?? undefined,
    opt: req.nextUrl.searchParams.get('opt') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
  }
  const { deal: dealId, opt } = parsed.data;

  const supabase = getServiceClient();
  const { data: deal, error } = await supabase
    .from('deals')
    .select('id, external_url, affiliate_options')
    .eq('id', dealId)
    .maybeSingle();

  if (error || !deal) {
    return NextResponse.json({ error: 'DEAL_NOT_FOUND' }, { status: 404 });
  }

  const options = (deal.affiliate_options as AffiliateOption[] | null) ?? [];
  const chosen = opt ? options.find((o) => o.subDealId === opt) : undefined;
  const target = chosen?.checkoutLink ?? deal.external_url ?? null;

  if (!target || !isAllowed(target)) {
    return NextResponse.json({ error: 'NO_VALID_TARGET' }, { status: 422 });
  }

  // Tıklamayı logla (best-effort — hata redirect'i engellemesin).
  try {
    const user = await getCurrentUser();
    await supabase.from('affiliate_clicks').insert({
      deal_id: deal.id,
      sub_deal_external_id: chosen?.subDealId ?? null,
      user_id: user?.id ?? null,
      referrer: req.headers.get('referer'),
    });
  } catch {
    // yut — analitik kaybı redirect'ten önemsiz.
  }

  return NextResponse.redirect(target, { status: 302 });
}
