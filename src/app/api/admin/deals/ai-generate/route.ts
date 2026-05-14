import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getBudgetStatus, estimateCostUsd, recordSpend } from '@/lib/ai/budget';
import { generateDealContent } from '@/lib/ai/generate-deal-content';
import { getCurrentMerchantId, getCurrentUser, isAdmin } from '@/lib/security/auth';

const bodySchema = z.object({
  title: z.string().trim().min(3, 'Başlık en az 3 karakter').max(120),
  categorySlug: z.string().trim().max(40).optional(),
  merchantName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  keywords: z.string().trim().max(500).optional(),
});

export const maxDuration = 30;

/**
 * Content-creator-only deal content generation. Hem admin hem merchant
 * portalındaki "yeni fırsat" akışından çağrılır.
 *
 * Auth tek seviye guard:
 *  - user yoksa 401
 *  - admin değilse VE merchant_id yoksa 403
 *  - günlük bütçe doluysa 503
 *
 * requireAdmin()/requireMerchant() kullanmıyoruz — onlar redirect ediyor ve
 * browser'a HTML dönüyor; fetch JSON parse hatası alıyor.
 */
export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI yapılandırılmamış (GEMINI_API_KEY eksik).' },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Giriş yapmalısın.' },
      { status: 401 },
    );
  }

  const userIsAdmin = isAdmin(user);
  const merchantId = userIsAdmin ? null : await getCurrentMerchantId(user);
  if (!userIsAdmin && !merchantId) {
    return NextResponse.json(
      { error: 'Bu özelliğe erişim yetkin yok.' },
      { status: 403 },
    );
  }

  const budget = await getBudgetStatus();
  if (!budget.open) {
    return NextResponse.json(
      { error: 'AI bugünlük dinleniyor — günlük bütçe dolu. Yarın yeniden dene.' },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? 'Geçersiz istek.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  try {
    const content = await generateDealContent(parsed);
    await recordSpend(estimateCostUsd(800, 600));
    return NextResponse.json({ ok: true, content });
  } catch (err) {
    console.error('AI deal content generation failed:', err);
    return NextResponse.json(
      { error: 'İçerik üretilemedi. Birkaç saniye sonra tekrar dene.' },
      { status: 500 },
    );
  }
}
