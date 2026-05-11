import 'server-only';
import { EMBEDDING_DIMENSIONS, MODELS, getGeminiClient } from './gemini';

/**
 * Generate a 768-dim embedding for a single piece of text.
 * Matches the dimensionality stored on deals.embedding / user_preferences.embedding.
 */
export async function embed(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Cannot embed empty text');

  const ai = getGeminiClient();
  const response = await ai.models.embedContent({
    model: MODELS.embedding,
    contents: trimmed,
    config: { outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  const vector = response.embeddings?.[0]?.values;
  if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding failed: expected ${EMBEDDING_DIMENSIONS}-d vector, got ${vector?.length ?? 'none'}`,
    );
  }
  return vector;
}

/**
 * Compose the text input used to embed a deal. Tags and audience are repeated
 * so they have more weight in the average-pooled embedding.
 */
export function dealEmbeddingText(deal: {
  title: string;
  subtitle?: string | null;
  description: string;
  tags: string[];
  audience: string[];
  city: string;
  district?: string | null;
  venue_name?: string | null;
}): string {
  const location = [deal.city, deal.district, deal.venue_name].filter(Boolean).join(' ');
  return [
    deal.title,
    deal.subtitle ?? '',
    deal.description,
    location,
    deal.tags.join(' '),
    deal.audience.join(' '),
    // Boost signals
    deal.tags.join(' '),
    deal.audience.join(' '),
  ]
    .filter((s) => s.trim().length > 0)
    .join('\n');
}

/** pgvector accepts `[1.2,3.4,...]` literal strings. */
export function toPgVector(vector: number[]): string {
  return `[${vector.join(',')}]`;
}
