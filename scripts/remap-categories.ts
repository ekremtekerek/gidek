/**
 * Kategori yeniden eşleme — mevcut firsatbufirsat deal'larının kategorisini
 * saklı external_tags + title üzerinden YENİDEN hesaplar ve deal_categories'i
 * reconcile eder (sil + tek doğru kategoriyi yaz). Embedding/açıklamaya DOKUNMAZ.
 *
 *   npx tsx --env-file=.env.production.local scripts/remap-categories.ts        # uygula
 *   npx tsx --env-file=.env.production.local scripts/remap-categories.ts --dry  # sadece rapor
 *
 * service_role anahtarı kullanır → RLS bypass. Tam sync gerektirmeyen, hızlı,
 * idempotent bir bakım işi; mapCategory mantığı değiştiğinde tekrar çalıştırılır.
 */
import { createClient } from '@supabase/supabase-js';
import { mapCategory } from '../src/lib/affiliate/mapping';
import type { Database } from '../src/types/supabase';

const SOURCE = 'firsatbufirsat';
const DRY = process.argv.includes('--dry');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env (--env-file=.env.production.local ?).');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log(`▶ kategori remap ${DRY ? '(DRY — yazma yok)' : '(uygula)'} | hedef: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  // 1) categories: slug → id
  const { data: cats, error: cErr } = await supabase.from('categories').select('id, slug');
  if (cErr) throw cErr;
  const catId = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  // 2) tüm firsatbufirsat deal'larını sayfa sayfa çek
  type Row = { id: string; title: string; external_tags: string[] | null; city: string | null; district: string | null };
  const deals: Row[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('deals')
      .select('id, title, external_tags, city, district')
      .eq('source', SOURCE)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    deals.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  console.log(`  ${deals.length} deal okundu`);

  // 3) mevcut junction'ları oku (değişen var mı raporlamak için)
  const currentCat = new Map<string, string[]>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('deal_categories')
      .select('deal_id, category_id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data ?? []) {
      const arr = currentCat.get(r.deal_id) ?? [];
      arr.push(r.category_id);
      currentCat.set(r.deal_id, arr);
    }
    if (!data || data.length < PAGE) break;
  }

  // 4) yeniden hesapla
  const idToSlug = new Map([...catId.entries()].map(([s, i]) => [i, s]));
  const targets: { deal_id: string; category_id: string; slug: string }[] = [];
  const changes = new Map<string, number>(); // "eski→yeni" → adet
  const samples = new Map<string, string[]>(); // "eski→yeni" → örnek başlıklar
  let changed = 0;
  for (const d of deals) {
    const tags = d.external_tags ?? [];
    const haystack = [tags.join(' '), d.title].filter(Boolean).join(' ');
    // event'lerde external_tags boş → isEvent davranışı (default tiyatro)
    const slug = mapCategory(haystack, {
      tags,
      isEvent: tags.length === 0,
      city: d.city,
      district: d.district,
    });
    const newId = catId.get(slug);
    if (!newId) continue;
    targets.push({ deal_id: d.id, category_id: newId, slug });

    const cur = currentCat.get(d.id) ?? [];
    const isSame = cur.length === 1 && cur[0] === newId;
    if (!isSame) {
      changed++;
      const oldSlug = cur.length ? cur.map((i) => idToSlug.get(i) ?? '?').join('+') : '(yok)';
      const key = `${oldSlug} → ${slug}`;
      changes.set(key, (changes.get(key) ?? 0) + 1);
      const arr = samples.get(key) ?? [];
      if (arr.length < 8) arr.push(`${d.title.slice(0, 40)} [${d.city ?? '-'}/${d.district ?? '-'}]`);
      samples.set(key, arr);
    }
  }

  console.log(`\n  Değişecek deal: ${changed}/${deals.length}`);
  for (const [k, n] of [...changes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`    ${String(n).padStart(4)}  ${k}`);
  }

  if (DRY) {
    for (const key of ['sehir-otelleri → tatil-otelleri', 'turlar → tatil-otelleri']) {
      const ex = samples.get(key);
      if (ex) {
        console.log(`\n  örnekler — ${key}:`);
        for (const e of ex) console.log(`    · ${e}`);
      }
    }
    console.log('\n(DRY) yazma yapılmadı.');
    return;
  }

  // 5) reconcile: bu deal'ların junction'larını sil + tek doğru kategoriyi yaz
  const dealIds = targets.map((t) => t.deal_id);
  for (const part of chunk(dealIds, 200)) {
    const { error } = await supabase.from('deal_categories').delete().in('deal_id', part);
    if (error) throw error;
  }
  for (const part of chunk(targets.map((t) => ({ deal_id: t.deal_id, category_id: t.category_id })), 1000)) {
    const { error } = await supabase
      .from('deal_categories')
      .upsert(part, { onConflict: 'deal_id,category_id' });
    if (error) throw error;
  }
  console.log(`\n✓ ${targets.length} junction yeniden yazıldı (${changed} değişti).`);
}

main().catch((e) => {
  console.error('REMAP FAILED:', e);
  process.exit(1);
});
