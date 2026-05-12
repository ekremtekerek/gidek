// NOTE: no `import 'server-only'` here — this module is imported by the
// standalone backfill script (scripts/backfill-embeddings.ts) via tsx, where
// the react-server condition isn't active and `server-only` throws at runtime.
// Protection is enforced at the call sites (rag.ts, API routes).
import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

/**
 * Lazily-constructed Gemini client. Throws if GEMINI_API_KEY is not set so
 * callers can short-circuit with an AI_NOT_CONFIGURED response instead of
 * crashing the route handler.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export const MODELS = {
  chat: process.env.AI_MODEL ?? 'gemini-2.5-flash',
  embedding: process.env.AI_EMBEDDING_MODEL ?? 'gemini-embedding-001',
} as const;

export const EMBEDDING_DIMENSIONS = 768;
