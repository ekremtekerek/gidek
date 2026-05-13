import 'server-only';
import { createHash } from 'node:crypto';
import { embed, toPgVector } from '@/lib/ai/embeddings';
import { getServiceClient } from '@/lib/db/service';

/**
 * Semantic cache for the AI chat — hash + vector lookup.
 * - Hash (sha1 of normalized query) ile birebir aynı sorguya direkt hit.
 * - Hash kaçırırsa pgvector cosine ile %92+ benzer cache satırı varsa hit.
 *
 * Cache satırı sadece text yanıtları tutar (tool çağrıları içeren turları
 * cache'lemiyoruz — çünkü tool sonuçları zamana göre değişebilir, eski
 * yanıt kullanıcıyı yanıltır). Pratikte cache "merhaba", "sağol", "nasılsın"
 * gibi konuşma turlarını ve genel açıklayıcı soruları yakalar.
 */
export interface CachedResponse {
  text: string;
  source: 'exact' | 'semantic';
  ageSeconds: number;
}

const SEMANTIC_THRESHOLD = 0.92; // cosine similarity — yukarısı "aynı niyet"
const TTL_HOURS = 24;

function normalize(q: string): string {
  return q.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
}

function hashOf(q: string): string {
  return createHash('sha1').update(normalize(q)).digest('hex');
}

export interface CacheLookupResult {
  hit: CachedResponse | null;
  /** Vector hesabını boşa yapmayalım diye sonraki write için kullanılır. */
  queryEmbedding: number[] | null;
  queryHash: string;
}

/** Önce hash (ucuz), sonra vector benzerlik (1 embed çağrısı). */
export async function lookupCache(query: string): Promise<CacheLookupResult> {
  const supabase = getServiceClient();
  const queryHash = hashOf(query);

  const { data: exact } = await supabase
    .from('ai_cache')
    .select('response, created_at, hit_count')
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (exact?.response) {
    await supabase
      .from('ai_cache')
      .update({ hit_count: (exact.hit_count ?? 0) + 1 })
      .eq('query_hash', queryHash);
    return {
      hit: {
        text: (exact.response as { text?: string }).text ?? '',
        source: 'exact',
        ageSeconds: Math.round((Date.now() - new Date(exact.created_at).getTime()) / 1000),
      },
      queryEmbedding: null,
      queryHash,
    };
  }

  // Hash kaçtı — embedding-based fuzzy lookup.
  let embedding: number[];
  try {
    embedding = await embed(normalize(query));
  } catch {
    // Embedding yapamadıysak cache miss say, akış devam etsin.
    return { hit: null, queryEmbedding: null, queryHash };
  }

  const { data: nearby, error } = await supabase.rpc('match_ai_cache', {
    query_embedding: toPgVector(embedding),
    threshold: SEMANTIC_THRESHOLD,
  });

  if (error || !nearby || nearby.length === 0) {
    return { hit: null, queryEmbedding: embedding, queryHash };
  }

  const top = nearby[0];
  await supabase
    .from('ai_cache')
    .update({ hit_count: (top.hit_count ?? 0) + 1 })
    .eq('id', top.id);

  return {
    hit: {
      text: (top.response as { text?: string }).text ?? '',
      source: 'semantic',
      ageSeconds: Math.round((Date.now() - new Date(top.created_at).getTime()) / 1000),
    },
    queryEmbedding: embedding,
    queryHash,
  };
}

/**
 * Yanıtı cache'e yaz — sadece pure text yanıtlarını kabul ediyoruz.
 * Tool çağrısı yapılmış turlar gönderilmemeli (caller filtreler).
 */
export async function writeCache(args: {
  query: string;
  queryHash: string;
  embedding: number[] | null;
  text: string;
}): Promise<void> {
  const text = args.text.trim();
  if (text.length < 10) return;

  const supabase = getServiceClient();
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString();

  // Embedding yoksa şimdi üret — bir sonraki sorguda fuzzy lookup çalışsın.
  let embedding = args.embedding;
  if (!embedding) {
    try {
      embedding = await embed(normalize(args.query));
    } catch {
      // Tolere et — exact-hash cache yine de işine yarar.
    }
  }

  await supabase.from('ai_cache').upsert(
    {
      query_hash: args.queryHash,
      query_embedding: embedding ? toPgVector(embedding) : null,
      response: { text },
      user_segment: 'all',
      hit_count: 0,
      expires_at: expiresAt,
    },
    { onConflict: 'query_hash' },
  );
}
