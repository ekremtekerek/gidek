import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Sparkles, Zap } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { searchDealsByQuery } from '@/lib/ai/search-core';
import { getServiceClient } from '@/lib/db/service';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'gidek AI — klasik arama vs anlamsal arama',
  description: 'Aynı sorguyu klasik keyword araması ve gidek AI yan yana çalıştırıyoruz.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const SAMPLE_QUERIES = [
  'Cumartesi akşam çiftler için romantik bir akşam yemeği',
  'Haftasonu ailecek çocuk dostu bir aktivite',
  'Stresliyim, beni rahatlatacak bir şey',
  "İstanbul'da deniz manzaralı brunch",
  'Yorgunum, kısa ve hızlı bir kaçamak',
  'Doğum günümü kutlayacak şık bir mekan',
];

interface ClassicResult {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string;
  city: string;
  district: string | null;
  discounted_price: number;
  original_price: number;
}

async function classicSearch(q: string): Promise<ClassicResult[]> {
  const supabase = getServiceClient();
  // websearch_to_tsquery doğal dildeki birleşik sorguyu parse eder; simple
  // config (deals.search_text aynı config'i kullanıyor) Türkçe stemming yapmaz
  // — bu KASITLI: AI farkı görünsün, "romantik" yazınca "romantizm" eşleşmez.
  const { data } = await supabase
    .from('deals')
    .select(
      'id, slug, title, subtitle, cover_image, city, district, discounted_price, original_price',
    )
    .eq('is_active', true)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .gt('valid_until', new Date().toISOString())
    .textSearch('search_text', q, { config: 'simple', type: 'websearch' })
    .limit(5);

  return (data ?? []) as ClassicResult[];
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const hasQuery = query.length >= 3;

  const [classic, ai] = hasQuery
    ? await Promise.all([
        classicSearch(query),
        searchDealsByQuery(query, { maxResults: 5 }),
      ])
    : [[], []];

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Demo · klasik arama vs gidek AI
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Aynı sorgu, iki dünya
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Sol: klasik keyword araması (kelimesi geçen sonuçlar). Sağ:
          gidek&apos;in semantik AI ranker&apos;ı — anlamı, niyeti ve bağlamı yakalıyor.
        </p>
      </header>

      <form action="/demo" method="get" className="mx-auto mb-4 flex max-w-2xl items-stretch gap-2">
        <input
          name="q"
          type="text"
          defaultValue={query}
          placeholder="Bir şey iste — örn. 'cumartesi akşam çiftler için romantik bir yer'"
          autoFocus
          className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-12 w-full rounded-lg border px-4 text-base transition-colors focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-12 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors"
        >
          <Search className="size-4" aria-hidden="true" />
          Karşılaştır
        </button>
      </form>

      <div className="mx-auto mb-10 flex max-w-3xl flex-wrap justify-center gap-2">
        {SAMPLE_QUERIES.map((s) => (
          <Link
            key={s}
            href={`/demo?q=${encodeURIComponent(s)}`}
            className={cn(
              'border-border bg-background hover:bg-muted text-foreground/80 hover:text-foreground rounded-full border px-3 py-1.5 text-xs transition-colors',
              s === query ? 'bg-foreground text-background border-foreground' : null,
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      {!hasQuery ? (
        <div className="text-muted-foreground border-border bg-muted/30 mx-auto max-w-2xl rounded-xl border border-dashed p-10 text-center text-sm">
          Bir sorgu yaz veya yukarıdaki örneklerden birini seç — iki sistem yan yana
          aynı sorguya cevap verecek.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Klasik arama kolonu */}
          <section
            aria-labelledby="classic-h"
            className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4 sm:p-5"
          >
            <header className="flex items-baseline justify-between border-b border-dashed pb-3">
              <h2
                id="classic-h"
                className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
              >
                <Search className="text-muted-foreground size-4" aria-hidden="true" />
                Klasik arama
              </h2>
              <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
                keyword · ts_vector
              </span>
            </header>

            {classic.length === 0 ? (
              <EmptyResult
                tone="bad"
                title="Hiç sonuç bulamadı"
                hint="Sorgudaki kelimelerin TAM eşleşeni yok. Klasik arama anlam çıkaramıyor — kullanıcı gider."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {classic.map((d, i) => (
                  <ResultCard
                    key={d.id}
                    rank={i + 1}
                    href={`/f/${d.slug}`}
                    title={d.title}
                    subtitle={d.subtitle}
                    cover={d.cover_image}
                    location={[d.district, d.city].filter(Boolean).join(', ')}
                    discountedPrice={d.discounted_price}
                    originalPrice={d.original_price}
                    tone="classic"
                  />
                ))}
              </ul>
            )}
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              Bu kolon, başlık + alt başlık + açıklama metinlerinde sorgu
              kelimelerini arayan klasik bir full-text search. &ldquo;Romantik&rdquo;
              yazarsan &ldquo;romantizm&rdquo;i bulamaz; &ldquo;stres&rdquo; yazarsan
              &ldquo;rahatlatıcı&rdquo;yı hiç eşleştirmez.
            </p>
          </section>

          {/* AI ranker kolonu */}
          <section
            aria-labelledby="ai-h"
            className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-background to-background p-4 sm:p-5"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <header className="flex items-baseline justify-between border-b border-dashed border-emerald-500/30 pb-3">
              <h2
                id="ai-h"
                className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
              >
                <Sparkles className="size-4 text-emerald-600" aria-hidden="true" />
                gidek AI
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <Zap className="size-3" aria-hidden="true" />
                semantic · RAG + embedding
              </span>
            </header>

            {ai.length === 0 ? (
              <EmptyResult
                tone="bad"
                title="Sonuç gelmedi"
                hint="Genelde semantic search bir şey bulur — embedding eksikse vakanın seedlenmesi gerekiyor olabilir."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {ai.map((d, i) => (
                  <ResultCard
                    key={d.id}
                    rank={i + 1}
                    href={`/f/${d.slug}`}
                    title={d.title}
                    subtitle={d.subtitle}
                    cover={d.cover_image}
                    location={[d.district, d.city].filter(Boolean).join(', ')}
                    discountedPrice={Number(d.discounted_price)}
                    originalPrice={Number(d.original_price)}
                    similarity={d.similarity}
                    tone="ai"
                  />
                ))}
              </ul>
            )}
            <p className="text-emerald-700 dark:text-emerald-300 mt-1 text-[11px] leading-relaxed">
              gidek sorgunun anlamını embedding&apos;e çevirip 1000+ fırsat
              arasından kosinüs yakınlığıyla sıralıyor. &ldquo;Stres&rdquo; → &ldquo;spa,
              masaj, sakin&rdquo;; &ldquo;çiftler&rdquo; → &ldquo;romantik, sessiz, akşam&rdquo;
              eşleşmeleri otomatik gelir.
            </p>
          </section>
        </div>
      )}

      <FooterCallout />
    </Container>
  );
}

function ResultCard({
  rank,
  href,
  title,
  subtitle,
  cover,
  location,
  discountedPrice,
  originalPrice,
  similarity,
  tone,
}: {
  rank: number;
  href: string;
  title: string;
  subtitle: string | null;
  cover: string;
  location: string;
  discountedPrice: number;
  originalPrice: number;
  similarity?: number;
  tone: 'classic' | 'ai';
}) {
  const showDiscount = discountedPrice < originalPrice;
  return (
    <li>
      <Link
        href={href}
        target="_blank"
        className="border-border bg-background hover:border-foreground/40 flex items-stretch gap-3 rounded-lg border p-2 transition-colors"
      >
        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center self-center rounded-full text-xs font-bold tabular-nums',
            tone === 'ai'
              ? 'bg-emerald-500 text-white'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {rank}
        </span>
        <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-md">
          <Image
            src={cover}
            alt={title}
            fill
            sizes="64px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <p className="line-clamp-1 text-sm font-semibold">{title}</p>
          {subtitle ? (
            <p className="text-muted-foreground line-clamp-1 text-xs">{subtitle}</p>
          ) : null}
          <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-2 text-[11px]">
            <span className="truncate">{location || '—'}</span>
            {typeof similarity === 'number' ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-medium tabular-nums">
                · {(similarity * 100).toFixed(0)}% eşleşme
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center text-right">
          {showDiscount ? (
            <span className="text-muted-foreground text-[10px] line-through">
              {formatTRY(originalPrice)}
            </span>
          ) : null}
          <span className="text-sm font-semibold">{formatTRY(discountedPrice)}</span>
        </div>
      </Link>
    </li>
  );
}

function EmptyResult({
  tone,
  title,
  hint,
}: {
  tone: 'bad' | 'neutral';
  title: string;
  hint: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center',
        tone === 'bad'
          ? 'border-rose-500/30 bg-rose-500/5'
          : 'border-border bg-muted/30',
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">{hint}</p>
    </div>
  );
}

function FooterCallout() {
  return (
    <aside className="border-border bg-muted/30 mx-auto mt-10 max-w-3xl rounded-xl border p-5 text-center">
      <p className="text-foreground/90 text-sm leading-relaxed">
        Bu demo, gidek&apos;in farkını yan yana göstermek için kuruldu. Asıl ürün
        çok daha fazlasını yapıyor:{' '}
        <strong className="text-foreground">çok turlu sohbet</strong>,{' '}
        <strong className="text-foreground">profil + tercih hafızası</strong>,{' '}
        <strong className="text-foreground">haritada keşif</strong>,{' '}
        <strong className="text-foreground">rezervasyon + e-bilet</strong>.
      </p>
      <p className="mt-3 text-xs">
        <Link
          href="/"
          className="text-foreground inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          Tam akışı denemek için ana sayfaya git
        </Link>
      </p>
    </aside>
  );
}
