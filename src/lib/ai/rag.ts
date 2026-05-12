import 'server-only';
import { MODELS, getGeminiClient } from '@/lib/ai/gemini';
import { embed, toPgVector } from '@/lib/ai/embeddings';
import { SYSTEM_PROMPT, userPrompt, type CandidateForPrompt } from '@/lib/ai/prompts';
import {
  RECOMMENDATION_RESPONSE_SCHEMA,
  recommendationSchema,
  type Recommendation,
} from '@/lib/ai/schema';
import { getServiceClient } from '@/lib/db/service';
import { getUserPreferences, summarisePreferences } from '@/lib/db/queries/preferences';
import { getCurrentUser } from '@/lib/security/auth';
import { checkAiRateLimit } from '@/lib/security/rate-limit';

const TOP_K = 20;
const FINAL_K = 5;

export type MatchedDeal = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  cover_image: string;
  city: string;
  district: string | null;
  venue_name: string | null;
  duration_minutes: number | null;
  original_price: number;
  discounted_price: number;
  discount_percent: number;
  audience: string[];
  tags: string[];
  similarity: number;
};

export type AiSearchSuccess = {
  ok: true;
  query: string;
  picks: Array<{ deal: MatchedDeal; reason: string }>;
  note: string;
  remaining: number;
};

export type AiSearchError = {
  ok: false;
  code:
    | 'INVALID_INPUT'
    | 'AI_NOT_CONFIGURED'
    | 'RATE_LIMITED'
    | 'SIGNUP_REQUIRED'
    | 'NO_CANDIDATES'
    | 'AI_FAILED';
  message: string;
};

export type AiSearchResult = AiSearchSuccess | AiSearchError;

/**
 * End-to-end pipeline: rate-limit → embed → vector search → Gemini ranking →
 * hallucination filter → log. Server-side only. Caller is identified via the
 * cookie-bound auth client.
 */
export async function aiSearch(query: string): Promise<AiSearchResult> {
  const start = Date.now();
  const trimmed = query.trim();

  if (trimmed.length < 3 || trimmed.length > 500) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Sorgu 3-500 karakter olmalı.' };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      ok: false,
      code: 'AI_NOT_CONFIGURED',
      message:
        'AI henüz yapılandırılmadı. GEMINI_API_KEY .env.local dosyasına eklendiğinde devreye girer.',
    };
  }

  const user = await getCurrentUser();
  const userId = user?.id ?? null;

  const rate = await checkAiRateLimit(userId);
  if (!rate.allowed) {
    await logQuery({
      status: 'rate_limited',
      query_text: trimmed,
      user_id: userId,
      ip_hash: rate.ipHash,
      duration_ms: Date.now() - start,
    });
    return { ok: false, code: rate.code, message: rate.message };
  }

  // Embed
  let queryVector: number[];
  try {
    queryVector = await embed(trimmed);
  } catch (err) {
    console.error('Gemini embedding failed:', err);
    await logQuery({
      status: 'error',
      query_text: trimmed,
      user_id: userId,
      ip_hash: rate.identifier.ipHash,
      duration_ms: Date.now() - start,
      error_message: String(err),
    });
    return { ok: false, code: 'AI_FAILED', message: 'Sorgun işlenirken bir sorun oluştu.' };
  }

  // Vector search
  const supabase = getServiceClient();
  const { data, error: rpcErr } = await supabase.rpc('match_deals', {
    query_embedding: toPgVector(queryVector),
    match_count: TOP_K,
    filter_city: null,
  });

  if (rpcErr) {
    console.error('match_deals RPC failed:', rpcErr);
    await logQuery({
      status: 'error',
      query_text: trimmed,
      user_id: userId,
      ip_hash: rate.identifier.ipHash,
      duration_ms: Date.now() - start,
      error_message: rpcErr.message,
    });
    return { ok: false, code: 'AI_FAILED', message: 'Fırsat aramasında bir sorun oluştu.' };
  }

  const matched = (data ?? []) as MatchedDeal[];
  if (matched.length === 0) {
    await logQuery({
      status: 'success',
      query_text: trimmed,
      user_id: userId,
      ip_hash: rate.identifier.ipHash,
      duration_ms: Date.now() - start,
    });
    return {
      ok: false,
      code: 'NO_CANDIDATES',
      message: 'Aradığın kriterlere uyan aktif bir fırsat bulamadık.',
    };
  }

  // Personalisation context: pull the caller's saved preferences and turn
  // them into a one-line note for Gemini. Anonymous users get null.
  const userContext = userId ? summarisePreferences(await getUserPreferences(userId)) : null;

  // Gemini ranking
  let recommendation: Recommendation;
  try {
    const candidatesForPrompt: CandidateForPrompt[] = matched.map((d) => ({
      id: d.id,
      title: d.title,
      subtitle: d.subtitle ?? undefined,
      city: d.city,
      district: d.district ?? undefined,
      audience: d.audience,
      tags: d.tags,
      price: Number(d.discounted_price),
      duration_minutes: d.duration_minutes ?? undefined,
    }));

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: userPrompt(trimmed, candidatesForPrompt, userContext),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        // 2.5 Flash's thinking shares this budget with the JSON output;
        // 2000 leaves plenty of room for 5 picks with Turkish reasons.
        maxOutputTokens: 2048,
        // We don't need chain-of-thought for a ranking task — keep latency
        // and cost predictable by turning thinking off.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: RECOMMENDATION_RESPONSE_SCHEMA,
      },
    });

    const rawText = response.text;
    if (!rawText) throw new Error('Gemini returned empty response');
    try {
      recommendation = recommendationSchema.parse(JSON.parse(rawText));
    } catch (parseErr) {
      console.error('Gemini returned non-JSON or schema mismatch:', rawText.slice(0, 500));
      throw parseErr;
    }
  } catch (err) {
    console.error('Gemini rank failed:', err);
    await logQuery({
      status: 'error',
      query_text: trimmed,
      user_id: userId,
      ip_hash: rate.identifier.ipHash,
      retrieved_deal_ids: matched.map((m) => m.id),
      duration_ms: Date.now() - start,
      error_message: String(err),
    });
    return { ok: false, code: 'AI_FAILED', message: 'AI yanıt veremedi. Lütfen tekrar dene.' };
  }

  // Hallucination filter: keep only ids that exist in the candidate set
  const dealMap = new Map(matched.map((c) => [c.id, c]));
  const finalPicks = recommendation.picks
    .filter((p) => dealMap.has(p.deal_id))
    .slice(0, FINAL_K)
    .map((p) => ({ deal: dealMap.get(p.deal_id)!, reason: p.reason }));

  await logQuery({
    status: 'success',
    query_text: trimmed,
    user_id: userId,
    ip_hash: rate.identifier.ipHash,
    retrieved_deal_ids: matched.map((m) => m.id),
    response_deal_ids: finalPicks.map((p) => p.deal.id),
    duration_ms: Date.now() - start,
  });

  return {
    ok: true,
    query: trimmed,
    picks: finalPicks,
    note: recommendation.coverage_note,
    remaining: rate.remaining,
  };
}

async function logQuery(params: {
  status: 'success' | 'rate_limited' | 'circuit_broken' | 'error';
  query_text: string;
  user_id: string | null;
  ip_hash: string | null;
  retrieved_deal_ids?: string[];
  response_deal_ids?: string[];
  duration_ms: number;
  error_message?: string;
}) {
  const supabase = getServiceClient();
  await supabase.from('ai_query_logs').insert({
    status: params.status,
    query_text: params.query_text,
    user_id: params.user_id,
    ip_hash: params.ip_hash,
    retrieved_deal_ids: params.retrieved_deal_ids ?? [],
    response_deal_ids: params.response_deal_ids ?? [],
    model_used: MODELS.chat,
    duration_ms: params.duration_ms,
    error_message: params.error_message,
  });
}
