import { cookies } from 'next/headers';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';

export const runtime = 'nodejs';
export const REF_COOKIE = 'gidek_pending_ref';

const bodySchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,12}$/, 'Geçersiz kod'),
});

/**
 * Landing'de ?ref=CODE varsa client component bunu POST eder. Kod gerçekten
 * varsa httpOnly cookie'ye yazılır; sonraki signup/onboarding adımında
 * otomatik claim edilir.
 */
export async function POST(req: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: ref } = await supabase
    .from('referrals')
    .select('user_id')
    .eq('code', parsed.code)
    .maybeSingle();

  if (!ref) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });

  const store = await cookies();
  store.set(REF_COOKIE, parsed.code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  });

  return Response.json({ ok: true });
}
