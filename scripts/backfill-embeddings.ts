/**
 * One-time / on-demand: generate embeddings for every active deal that
 * doesn't have one yet. Run after seeding new deals or rotating the
 * embedding model.
 *
 *   npm run ai:backfill
 *
 * Requires GEMINI_API_KEY in .env.local. Uses the service role key so RLS
 * is bypassed.
 */
import { createClient } from '@supabase/supabase-js';
import { dealEmbeddingText, embed, toPgVector } from '../src/lib/ai/embeddings';
import type { Database } from '../src/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Check .env.local.');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY. Add it to .env.local first.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, title, subtitle, description, tags, audience, city, district, venue_name')
    .is('embedding', null)
    .eq('is_active', true);

  if (error) throw error;
  if (!deals || deals.length === 0) {
    console.log('No deals need embeddings.');
    return;
  }

  console.log(`Embedding ${deals.length} deals…`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    const text = dealEmbeddingText(deal);
    try {
      const vector = await embed(text);
      const { error: updErr } = await supabase
        .from('deals')
        .update({ embedding: toPgVector(vector) })
        .eq('id', deal.id);
      if (updErr) throw updErr;
      ok++;
      console.log(`  [${i + 1}/${deals.length}] ${deal.title}`);
    } catch (err) {
      fail++;
      console.error(`  Failed ${deal.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`Done. ok=${ok} fail=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
