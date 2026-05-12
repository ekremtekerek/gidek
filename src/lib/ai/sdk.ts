import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Vercel AI SDK provider, explicitly configured with our env key so we
 * don't have to keep both GEMINI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY
 * in sync. Used by /api/ai/chat for streaming + tool calling.
 *
 * Embeddings still go through @google/genai (lib/ai/embeddings.ts) so the
 * backfill script can run via tsx without the AI SDK runtime.
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const CHAT_MODEL = process.env.AI_MODEL ?? 'gemini-2.5-flash';
