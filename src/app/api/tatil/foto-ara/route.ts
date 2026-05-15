import { NextResponse } from 'next/server';
import { checkAiRateLimit } from '@/lib/security/rate-limit';
import { getServerClient } from '@/lib/db/server';
import { analyzeVacationPhoto } from '@/lib/ai/travel-photo-search';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Foto-tabanlı tatil arama. Kullanıcı bir tatil fotoğrafı yükler, Gemini
 * Vision ile analiz edilir, Türkiye'den benzer destinasyon önerileri döner.
 */
export async function POST(request: Request) {
  try {
    const supabase = await getServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const rate = await checkAiRateLimit(userId);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: rate.message, code: rate.code },
        { status: 429 },
      );
    }

    const form = await request.formData();
    const file = form.get('photo');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'photo alanı zorunlu.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Foto en fazla 5 MB olabilir.' },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG veya WebP formatı kabul edilir.' },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await analyzeVacationPhoto(buffer, file.type);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('[/api/tatil/foto-ara] failed:', err);
    return NextResponse.json(
      { error: 'Foto analiz edilemedi. Tekrar dene.', detail: message },
      { status: 500 },
    );
  }
}
