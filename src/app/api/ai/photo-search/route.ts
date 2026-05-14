import { NextResponse } from 'next/server';
import { estimateCostUsd, getBudgetStatus, recordSpend } from '@/lib/ai/budget';
import { searchDealsByImage } from '@/lib/ai/photo-search';
import { getCurrentUser } from '@/lib/security/auth';
import { checkAiRateLimit } from '@/lib/security/rate-limit';

export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ACCEPTED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

/**
 * Görsel ile fırsat arama — multipart form ile image alır, Gemini Vision
 * sonucunu döner. Auth + rate limit + budget kontrolü.
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

  let file: File | null = null;
  try {
    const form = await req.formData();
    const candidate = form.get('image');
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: 'Form okunamadı.' }, { status: 400 });
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Görsel ekle.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Görsel 4 MB\'tan büyük olamaz.' },
      { status: 413 },
    );
  }
  if (!ACCEPTED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: 'Desteklenen format: JPEG, PNG, WebP, HEIC.' },
      { status: 415 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await searchDealsByImage(buffer, file.type);
    // Vision call: input image tokens ~1000-2000 + output ~150
    await recordSpend(estimateCostUsd(1500, 150));
    return NextResponse.json({
      ok: true,
      analysis: result.analysis,
      deals: result.deals,
    });
  } catch (err) {
    console.error('photo search failed:', err);
    return NextResponse.json(
      { error: 'Görsel analiz edilemedi.' },
      { status: 500 },
    );
  }
}
