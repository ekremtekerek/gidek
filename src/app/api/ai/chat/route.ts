import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { z } from 'zod';
import { getBudgetStatus, estimateCostUsd, recordSpend } from '@/lib/ai/budget';
import { lookupCache, writeCache } from '@/lib/ai/cache';
import { CHAT_SYSTEM_PROMPT, buildTimeContextLine } from '@/lib/ai/chat-prompt';
import { inferAndMergeProfile } from '@/lib/ai/profile-extract';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { buildChatTools } from '@/lib/ai/tools';
import { getServiceClient } from '@/lib/db/service';
import { getUserPreferences, summarisePreferences } from '@/lib/db/queries/preferences';
import { reverseGeocode } from '@/lib/maps/reverse-geocode';
import { getCurrentUser } from '@/lib/security/auth';
import { checkAiRateLimit } from '@/lib/security/rate-limit';
import { isTurnstileEnabled, verifyTurnstileToken } from '@/lib/security/turnstile';
import { getUserContext } from '@/lib/security/user-context-server';

export const maxDuration = 30;

const bodySchema = z.object({
  messages: z.array(z.unknown()),
  lat: z.number().finite().min(-90).max(90).optional(),
  lng: z.number().finite().min(-180).max(180).optional(),
  /** Cloudflare Turnstile token — anon kullanıcılar için zorunlu. */
  turnstileToken: z.string().max(2048).optional(),
});

const MAX_OUTPUT_TOKENS = 800;

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      {
        error:
          'AI henüz yapılandırılmadı. GEMINI_API_KEY .env.local dosyasına eklendiğinde devreye girer.',
        code: 'AI_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  const rate = await checkAiRateLimit(user?.id ?? null);
  if (!rate.allowed) {
    return Response.json(
      { error: rate.message, code: rate.code },
      { status: rate.code === 'SIGNUP_REQUIRED' ? 401 : 429 },
    );
  }

  // Günlük bütçe devresi — Gemini'nin batırmaması için sert kapı.
  const budget = await getBudgetStatus();
  if (!budget.open) {
    return Response.json(
      {
        error:
          'AI bugünlük dinleniyor — günlük bütçe doldu. Yarın aynı saatte tekrar buluşalım.',
        code: 'BUDGET_EXHAUSTED',
      },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: 'Geçersiz istek.', code: 'INVALID_INPUT' }, { status: 400 });
  }
  const messages = parsed.messages as UIMessage[];

  // Turnstile bot koruması — anon kullanıcılarda zorunlu. Auth'lu kullanıcılar
  // zaten hesabıyla bağlı olduğundan widget göstermiyoruz; rate limit + budget
  // koruması yeterli.
  if (!user && isTurnstileEnabled()) {
    const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ts = await verifyTurnstileToken(parsed.turnstileToken, remoteIp);
    if (!ts.ok) {
      return Response.json(
        {
          error:
            'Bot kontrolü başarısız. Sayfayı yenileyip tekrar dener misin?',
          code: 'TURNSTILE_FAILED',
        },
        { status: 403 },
      );
    }
  }

  const prefsContext = user ? summarisePreferences(await getUserPreferences(user.id)) : null;
  const ctx = await getUserContext();
  const geo =
    parsed.lat !== undefined && parsed.lng !== undefined
      ? await reverseGeocode(parsed.lat, parsed.lng)
      : null;

  const timeLine = buildTimeContextLine();
  const locationLine = geo
    ? `Kullanıcının ŞU ANKİ konumu: ${geo.label} (lat=${parsed.lat!.toFixed(4)}, lng=${parsed.lng!.toFixed(4)}). "Bana yakın", "yakınımda", "buradan", "yakın" ifadelerini bu konum olarak yorumla — searchDeals çağırırken query metnine bu semti ekle.`
    : null;

  const contextLine = `Aktif şehir (kullanıcının default'u): ${ctx.city}.

searchDeals.city parametresi seçim kuralı (KRİTİK — yanlış şehir göndermek 0 sonuç döndürür):
1) Kullanıcının mesajında bir destinasyon/şehir/ilçe/koy adı varsa (örn. Bodrum, Antalya, Marmaris, Yalıkavak, Türkbükü, Çeşme, Alaçatı, Kapadokya, Göreme, Uludağ, Uzungöl, Kemer, Lara, Didim, Fethiye, vb.) → city='<tam o ad>' kullan. Aktif şehri TAMAMEN YOK SAY.
2) "Yakın", "yakınımda", "buradan" gibi konum referansı varsa → city=aktif şehir.
3) Kullanıcı hiçbir konum söylemediyse → city=aktif şehir.

DB'de Bodrum = Muğla'nın district'i, Yalıkavak = Bodrum'un alt-koyu vs. — city parametresi hem city hem district eşleşmesi yapar; tam destinasyon adını yolla.`;
  const systemPrompt = [
    CHAT_SYSTEM_PROMPT,
    timeLine,
    contextLine,
    locationLine,
    prefsContext ? `KULLANICI PROFİLİ (gizli notlar): ${prefsContext}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Semantic cache — son kullanıcı mesajı tool gerektirmeyen genel bir
  // sohbet/açıklayıcı mesajsa ve hash/embedding eşleşirse Gemini'yi atla.
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === 'user') ?? null;
  const lastUserText = extractText(lastUserMessage);

  let cacheLookup = null as Awaited<ReturnType<typeof lookupCache>> | null;
  // Sadece TEK kullanıcı turu varsa cache check yap — uzun bağlamlı sohbette
  // cache yanıltır (önceki turlardaki tool sonuçları yok sayılır).
  if (messages.length === 1 && messages[0].role === 'user' && lastUserText.length >= 4) {
    cacheLookup = await lookupCache(lastUserText);
    if (cacheLookup.hit) {
      // Cache hit — stream'i taklit eden basit bir UI message response dön.
      return cachedResponse(cacheLookup.hit.text);
    }
  }

  const startedAt = Date.now();
  const modelMessages = await convertToModelMessages(messages);

  // Tool'ları kullanıcı bağlamıyla bind et — searchDeals'a default lat/lng + min 3 sonuç.
  const tools = buildChatTools({
    nearLat: parsed.lat ?? null,
    nearLng: parsed.lng ?? null,
    minResults: 3,
  });

  const result = streamText({
    model: google(CHAT_MODEL),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    temperature: 0.6,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: {
      google: {
        // Thinking mode boş cevap üretiyordu — chat için kapalı.
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
    // Multi-step agentic — kullanıcı "Bodrum eylül başı paket" derse zincir:
    // getSeasonAdvice → getWeather → searchDeals → buildTravelPackage → text.
    // 8 step bu chain'lere yer açar; tool result + text + opsiyonel takip.
    stopWhen: stepCountIs(8),
  });

  // Stream sonrası işler — log + cost track + cache write.
  void (async () => {
    try {
      const finalText = await result.text;
      const usage = await Promise.resolve(result.usage).catch(() => null);
      const inputTokens = usage?.inputTokens ?? 0;
      const outputTokens = usage?.outputTokens ?? 0;
      const cost = estimateCostUsd(inputTokens, outputTokens);

      // Cache yaz — sadece tool çağrısı YAPILMAYAN turlar (saf metin). Tool
      // dönen yanıtlar zamana bağlı, cache yanıltır.
      const steps = await Promise.resolve(result.steps).catch(() => []);
      const calledTool = steps.some((s) => (s.toolCalls?.length ?? 0) > 0);
      if (!calledTool && finalText.trim().length >= 10 && cacheLookup) {
        await writeCache({
          query: lastUserText,
          queryHash: cacheLookup.queryHash,
          embedding: cacheLookup.queryEmbedding,
          text: finalText,
        });
      }

      await recordSpend(cost);

      // Profil inference — sadece auth'lu ve niyetli (tool çağırılmış) turlarda.
      // Conservative merge: mevcut alanları ezmez, array'lara ekler. Fire-and-forget.
      if (user && calledTool && lastUserText.length >= 20) {
        void inferAndMergeProfile({
          userId: user.id,
          userText: lastUserText,
          existingHint: prefsContext,
        });
      }

      const supabase = getServiceClient();
      await supabase.from('ai_query_logs').insert({
        status: 'success',
        query_text: lastUserText.slice(0, 500) || '(empty)',
        user_id: user?.id ?? null,
        ip_hash: rate.identifier.ipHash,
        retrieved_deal_ids: [],
        response_deal_ids: [],
        model_used: CHAT_MODEL,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        cache_hit: false,
        duration_ms: Date.now() - startedAt,
      });
    } catch (err) {
      console.error('chat post-process failed:', err);
    }
  })();

  return result.toUIMessageStreamResponse();
}

function extractText(m: UIMessage | null): string {
  if (!m) return '';
  return (m.parts ?? [])
    .filter((p) => p.type === 'text')
    .map((p) => ('text' in p && typeof p.text === 'string' ? p.text : ''))
    .join(' ')
    .trim();
}

/**
 * Cache hit'inde manuel SSE stream üretiyoruz — useChat client'in beklediği
 * UI message chunk format'ında. Tool yok, sadece tek text part.
 */
function cachedResponse(text: string): Response {
  const id = `cache-${Date.now().toString(36)}`;
  const events = [
    { type: 'start' },
    { type: 'start-step' },
    { type: 'text-start', id },
    { type: 'text-delta', id, delta: text },
    { type: 'text-end', id },
    { type: 'finish-step' },
    { type: 'finish', finishReason: 'stop' },
  ];

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      for (const ev of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'X-AI-Cache': 'hit',
      'Cache-Control': 'no-store',
    },
  });
}
