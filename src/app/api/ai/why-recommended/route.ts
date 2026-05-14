import { NextResponse } from 'next/server';
import { z } from 'zod';
import { estimateCostUsd, getBudgetStatus, recordSpend } from '@/lib/ai/budget';
import { generateRecommendationRationale } from '@/lib/ai/recommendation-rationale';
import { getCurrentUser } from '@/lib/security/auth';
import { checkAiRateLimit } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  dealId: z.string().uuid(),
  userQuery: z.string().trim().max(500).optional(),
});

export const maxDuration = 20;

/**
 * "Neden bu öneri?" tooltip endpoint'i. Chat'te bir deal kartının yanındaki
 * "?" butonundan çağrılır. Kullanıcı sorusu + (varsa) profili + deal
 * bağlamıyla Gemini'den kısa rationale döner.
 */
export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI yapılandırılmamış.' },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  const rate = await checkAiRateLimit(user?.id ?? null);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: rate.message },
      { status: rate.code === 'SIGNUP_REQUIRED' ? 401 : 429 },
    );
  }

  const budget = await getBudgetStatus();
  if (!budget.open) {
    return NextResponse.json(
      { error: 'AI bugünlük dinleniyor — günlük bütçe dolu.' },
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

  const rationale = await generateRecommendationRationale({
    dealId: parsed.dealId,
    userQuery: parsed.userQuery,
    userId: user?.id ?? null,
  });

  if (!rationale) {
    return NextResponse.json(
      { error: 'Açıklama üretilemedi.' },
      { status: 500 },
    );
  }

  // Rationale ~400 input + 150 output token
  await recordSpend(estimateCostUsd(400, 150));

  return NextResponse.json({ ok: true, rationale });
}
