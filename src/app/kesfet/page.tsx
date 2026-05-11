import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Info,
  Lock,
  Sparkles,
  TriangleAlert,
  Wand2,
} from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { HeroSearch } from '@/components/home/hero-search';
import { PickCard } from '@/components/kesfet/pick-card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { aiSearch, type AiSearchResult } from '@/lib/ai/rag';
import { listDeals } from '@/lib/db/queries/deals';
import { cn } from '@/lib/utils/cn';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI ile keşfet',
  description:
    'Ne yapmak istediğini yaz, gidek sana en uygun fırsatları AI ile bulsun.',
  alternates: { canonical: '/kesfet' },
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function KesfetPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  if (!query) {
    return <LandingState />;
  }

  return (
    <>
      <SearchHeader query={query} />
      <Container className="py-8 sm:py-10">
        <Suspense fallback={<ResultsSkeleton />}>
          <Results query={query} />
        </Suspense>
      </Container>
    </>
  );
}

async function LandingState() {
  const recent = await listDeals({ limit: 12 });
  return (
    <>
      <SearchHeader query="" />
      <Container className="pb-12">
        <div className="border-border bg-muted/30 mb-8 flex items-start gap-3 rounded-lg border p-4 sm:p-5">
          <Info className="text-foreground/60 mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">
            Yukarıdaki kutuya istediğini yaz veya ana sayfadaki örneklerden birine tıkla.
            Şimdilik aşağıda son fırsatlardan bir kesit var.
          </p>
        </div>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Son fırsatlar</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recent.map((d) => (
            <li key={d.id}>
              <DealCard deal={d} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}

function SearchHeader({ query }: { query: string }) {
  return (
    <section className="border-border border-b py-10 sm:py-14">
      <Container className="flex flex-col items-center gap-4 text-center">
        <Badge variant="default" size="md" className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI keşif
        </Badge>
        {query ? (
          <h1 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            “{query}”
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ne yapmak istediğini yaz
          </h1>
        )}
        <HeroSearch />
      </Container>
    </section>
  );
}

async function Results({ query }: { query: string }) {
  const result = await aiSearch(query);
  return result.ok ? <SuccessView result={result} /> : <ErrorView result={result} />;
}

function SuccessView({ result }: { result: Extract<AiSearchResult, { ok: true }> }) {
  if (result.picks.length === 0) {
    return (
      <Notice
        tone="muted"
        Icon={Info}
        title="Uygun bir aday bulamadık"
        body={result.note || 'Sorunu biraz daha açıklayarak tekrar dene.'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {result.note ? (
        <div className="border-violet-500/20 bg-violet-500/5 flex items-start gap-3 rounded-lg border p-4">
          <Wand2
            className="mt-0.5 size-5 shrink-0 text-violet-600 dark:text-violet-300"
            aria-hidden="true"
          />
          <p className="text-foreground/85 text-sm leading-relaxed">{result.note}</p>
        </div>
      ) : null}

      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.picks.map((p, i) => (
          <li key={p.deal.id}>
            <PickCard deal={p.deal} reason={p.reason} rank={i + 1} />
          </li>
        ))}
      </ol>

      <p className="text-muted-foreground text-center text-xs">
        Bugün kalan ücretsiz sorgu hakkın:{' '}
        <span className="text-foreground font-semibold">{result.remaining}</span>
      </p>
    </div>
  );
}

function ErrorView({ result }: { result: Extract<AiSearchResult, { ok: false }> }) {
  if (result.code === 'SIGNUP_REQUIRED') {
    return (
      <div className="border-amber-500/30 bg-amber-500/10 flex flex-col items-start gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="bg-amber-500/20 text-amber-700 dark:text-amber-300 inline-flex size-12 shrink-0 items-center justify-center rounded-full">
          <Lock className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Sınırsız öneri için ücretsiz üye ol
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {result.message} Üyelerin sınırı günde 30 sorgu.
          </p>
        </div>
        <Link
          href="/kayit?next=/kesfet"
          className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'shrink-0')}
        >
          Üye ol
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (result.code === 'AI_NOT_CONFIGURED') {
    return (
      <Notice
        tone="info"
        Icon={Wand2}
        title="AI yakında bağlanıyor"
        body={result.message}
      />
    );
  }

  if (result.code === 'RATE_LIMITED') {
    return (
      <Notice
        tone="warning"
        Icon={TriangleAlert}
        title="Günlük limitin doldu"
        body={result.message}
      />
    );
  }

  if (result.code === 'NO_CANDIDATES') {
    return (
      <Notice
        tone="muted"
        Icon={Info}
        title="Uygun fırsat bulamadık"
        body={`${result.message} Sorgunu biraz daha açık yazmayı dene.`}
      />
    );
  }

  return (
    <Notice tone="error" Icon={AlertTriangle} title="Bir sorun oluştu" body={result.message} />
  );
}

interface NoticeProps {
  tone: 'info' | 'warning' | 'error' | 'muted';
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  body: string;
}

function Notice({ tone, Icon, title, body }: NoticeProps) {
  const palette = {
    info: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    muted: 'border-border bg-muted/40 text-foreground/70',
  }[tone];

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-5 sm:p-6 ${palette}`}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <p className="text-foreground/75 mt-1 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 w-full rounded-lg" />
      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </li>
        ))}
      </ol>
    </div>
  );
}
