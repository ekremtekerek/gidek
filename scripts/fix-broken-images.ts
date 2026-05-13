/**
 * Tek seferlik bakım: DB'deki tüm deal cover_image + images URL'lerini test
 * eder, 404/erişilmez olanları aynı kategorinin çalışan havuzundan biriyle
 * değiştirir. Yedek olarak picsum.photos (her zaman çalışır) kullanılır.
 *
 *   npm run images:fix
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Check .env.local.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// seed.ts'teki havuzun aynısı — pool ID'lerin hangi kategoride olduğunu
// bilmek için. URL inşası: https://images.unsplash.com/photo-{id}?w=1200&q=70&auto=format&fit=crop
const CATEGORY_POOL: Record<string, string[]> = {
  kahvalti: [
    '1414235077428-338989a2e8c0', '1525351484163-7529414344d8',
    '1551218808-94e220e084d2', '1525755662778-989d0524087e', '1467003909585-2f8a72700288',
  ],
  yemek: [
    '1546069901-ba9599a7e63c', '1517248135467-4c7edcad34c4',
    '1567620905732-2d1ec7ab7445', '1555939594-58d7cb561ad1', '1565299624946-b28f40a0ae38',
  ],
  tiyatro: [
    '1503095396549-807759245b35', '1507676184212-d03ab07a01bf', '1518609878373-06d740f60d8b',
  ],
  konser: [
    '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f',
    '1459749411175-04bf5292ceea', '1429962714451-bb934ecdc4ec',
  ],
  'stand-up': [
    '1531058020387-3be344556be6', '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f',
  ],
  aktivite: [
    '1448375240586-882707db888b', '1517649763962-0c623066013b',
    '1518609878373-06d740f60d8b', '1502602898657-3e91760cbb34',
  ],
  masaj: [
    '1540555700478-4be289fbecef', '1544161515-4ab6ce6db874',
    '1583416750470-965b2707b355', '1487412947147-5cebf100ffc2',
  ],
  guzellik: [
    '1522337360788-8b13dee7a37e', '1487412947147-5cebf100ffc2', '1532635241-17e820acc59f',
  ],
  turlar: [
    '1564501049412-61c2a3083791', '1551882547-ff40c63fe5fa',
    '1542314831-068cd1dbfeeb', '1549294413-26f195200c16',
  ],
  'sehir-otelleri': [
    '1551882547-ff40c63fe5fa', '1542314831-068cd1dbfeeb',
    '1549294413-26f195200c16', '1564501049412-61c2a3083791',
  ],
  'tatil-otelleri': [
    '1571003123894-1f0594d2b5d9', '1582719508461-905c673771fd',
    '1566073771259-6a8506099945', '1540541338287-41700207dee6',
  ],
  kurs: [
    '1503676260728-1c00da094a0b', '1488521787991-ed7bbaae773c',
    '1454165804606-c3d57bc86b40', '1543269865-cbf427effbad',
  ],
  hizmet: [
    '1581578731548-c64695cc6952', '1558618666-fcd25c85cd64', '1521587760476-6c12a4b040da',
  ],
};

function urlFor(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=1200&q=70&auto=format&fit=crop`;
}

function picsumFallback(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;
}

async function urlOk(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

async function main() {
  console.log('Kategori havuzlarını tarıyorum…');

  // Önce her kategori havuzundaki photo ID'leri test et — hangileri çalışıyor.
  const goodByCategory: Record<string, string[]> = {};
  for (const [cat, ids] of Object.entries(CATEGORY_POOL)) {
    const checks = await Promise.all(ids.map(async (id) => ({ id, ok: await urlOk(urlFor(id)) })));
    goodByCategory[cat] = checks.filter((c) => c.ok).map((c) => c.id);
    const broken = checks.filter((c) => !c.ok).map((c) => c.id);
    console.log(
      `  ${cat}: ${goodByCategory[cat].length}/${ids.length} ok${broken.length ? ` — bozuk: ${broken.join(', ')}` : ''}`,
    );
  }

  console.log('\nDeal cover_image / images alanlarını tarıyorum…');

  // Tüm aktif olmasa bile var olan deal'ları çek, primary category'leriyle birlikte.
  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      id, slug, cover_image, images,
      deal_categories ( category:categories ( slug ) )
    `);
  if (error) throw error;
  if (!deals) return;

  // URL → ok cache (paralel HEAD'lar yapacağız).
  const urlCache = new Map<string, boolean>();
  async function check(url: string): Promise<boolean> {
    if (urlCache.has(url)) return urlCache.get(url)!;
    const ok = await urlOk(url);
    urlCache.set(url, ok);
    return ok;
  }

  // Önce tüm URL'leri topla, paralel test et (concurrency = 10).
  const allUrls = new Set<string>();
  for (const d of deals) {
    if (d.cover_image) allUrls.add(d.cover_image);
    for (const u of (d.images ?? [])) if (u) allUrls.add(u);
  }
  console.log(`  ${allUrls.size} benzersiz URL test edilecek…`);

  const queue = Array.from(allUrls);
  let done = 0;
  await Promise.all(
    Array.from({ length: 10 }, async () => {
      while (queue.length > 0) {
        const u = queue.shift()!;
        await check(u);
        done++;
        if (done % 25 === 0) console.log(`    [${done}/${allUrls.size}]`);
      }
    }),
  );

  const broken = Array.from(urlCache.entries()).filter(([, ok]) => !ok).map(([u]) => u);
  console.log(`\nBozuk URL: ${broken.length}`);
  if (broken.length === 0) {
    console.log('Hiçbir şey yapılacak yok.');
    return;
  }

  // Şimdi her deal için kapağı ve images dizisini gözden geçir, gerekenleri swap et.
  let updatedCount = 0;
  for (const d of deals) {
    type CategoryRow = { category: { slug: string } | null } | null;
    const rawCats = (d as unknown as { deal_categories: CategoryRow[] | null }).deal_categories ?? [];
    const primaryCat = rawCats
      .map((dc) => dc?.category?.slug)
      .filter((s): s is string => Boolean(s))[0];

    const pool = primaryCat ? goodByCategory[primaryCat] ?? [] : [];
    const h = hashSlug(d.slug);

    function replacement(idx: number): string {
      if (pool.length > 0) {
        return urlFor(pool[(h + idx) % pool.length]);
      }
      return picsumFallback(`${d.slug}-${idx}`);
    }

    let needsUpdate = false;
    let newCover = d.cover_image;
    if (newCover && urlCache.get(newCover) === false) {
      newCover = replacement(0);
      needsUpdate = true;
    }

    const newImages: string[] = [];
    (d.images ?? []).forEach((u, i) => {
      if (u && urlCache.get(u) === false) {
        newImages.push(replacement(i + 1));
        needsUpdate = true;
      } else {
        newImages.push(u);
      }
    });

    if (needsUpdate) {
      const { error: updErr } = await supabase
        .from('deals')
        .update({ cover_image: newCover, images: newImages })
        .eq('id', d.id);
      if (updErr) {
        console.error(`  ${d.slug}: ${updErr.message}`);
      } else {
        updatedCount++;
        console.log(`  ✓ ${d.slug}`);
      }
    }
  }

  console.log(`\nBitti. Güncellenen deal sayısı: ${updatedCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
