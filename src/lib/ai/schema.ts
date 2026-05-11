import 'server-only';
import { z } from 'zod';

/**
 * JSON schema passed to Gemini via responseSchema. Gemini guarantees the
 * output conforms; we still re-validate with zod for safety.
 */
export const RECOMMENDATION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    picks: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          deal_id: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['deal_id', 'reason'],
      },
    },
    coverage_note: { type: 'string' },
  },
  required: ['picks', 'coverage_note'],
} as const;

export const recommendationSchema = z.object({
  picks: z
    .array(
      z.object({
        deal_id: z.string().min(1),
        reason: z.string().min(1).max(300),
      }),
    )
    .max(5),
  coverage_note: z.string().max(500),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
