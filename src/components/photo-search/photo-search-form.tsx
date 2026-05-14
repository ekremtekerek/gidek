'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface VisionAnalysis {
  themes: string[];
  category: string;
  searchQuery: string;
  confidence: 'low' | 'medium' | 'high';
}

interface DealResult {
  id: string;
  slug: string;
  title: string;
  city: string;
  district: string | null;
  cover_image: string;
  discounted_price: number;
  original_price: number;
  similarity: number;
}

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Fotoğrafla arama UI — drag/drop + click upload, preview, "Analiz et" CTA.
 * Sonuç: Gemini'nin görsel analizi + RAG'tan dönen 5 deal.
 */
export function PhotoSearchForm() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [deals, setDeals] = useState<DealResult[]>([]);

  function handleFile(f: File) {
    if (!f.type.startsWith('image/')) {
      toast.error('Sadece görsel kabul ediyorum.');
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Görsel 4 MB'tan büyük olamaz.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setAnalysis(null);
    setDeals([]);
  }

  function clear() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAnalysis(null);
    setDeals([]);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function analyze() {
    if (!file || pending) return;
    setPending(true);
    setAnalysis(null);
    setDeals([]);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/ai/photo-search', { method: 'POST', body: form });
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        toast.error(
          res.status === 401
            ? 'Giriş yapmalısın.'
            : res.status === 429
              ? 'Çok hızlı denedin, biraz bekle.'
              : `Sunucu hatası (${res.status})`,
        );
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'Analiz başarısız.');
        return;
      }
      setAnalysis(data.analysis as VisionAnalysis);
      setDeals(data.deals as DealResult[]);
    } catch (err) {
      console.error(err);
      toast.error('Beklenmeyen hata.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <label
        htmlFor="photo-upload"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          'border-border bg-background hover:bg-muted/30 relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragOver ? 'border-foreground bg-foreground/5' : null,
          previewUrl ? 'p-2' : null,
        )}
      >
        <input
          ref={inputRef}
          id="photo-upload"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Önizleme"
              className="max-h-[360px] w-auto rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                clear();
              }}
              aria-label="Görseli kaldır"
              className="bg-background border-border text-foreground hover:bg-muted absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full border shadow"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <span className="bg-muted text-muted-foreground inline-flex size-12 items-center justify-center rounded-full">
              <ImagePlus className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium">
              Görsel sürükle bırak veya <span className="underline">seç</span>
            </p>
            <p className="text-muted-foreground text-xs">
              JPEG, PNG, WebP · max 4 MB
            </p>
          </>
        )}
      </label>

      {file ? (
        <button
          type="button"
          onClick={analyze}
          disabled={pending}
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-12 items-center justify-center gap-2 self-stretch rounded-md px-6 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              AI analiz ediyor…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden="true" />
              {analysis ? 'Tekrar analiz et' : 'AI ile analiz et'}
            </>
          )}
        </button>
      ) : null}

      {analysis ? (
        <section
          aria-label="AI analizi"
          className={cn(
            'rounded-xl border p-5',
            analysis.confidence === 'low'
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-emerald-500/30 bg-emerald-500/5',
          )}
        >
          <header className="mb-3 flex items-center gap-2">
            {analysis.confidence === 'low' ? (
              <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4 text-emerald-600" aria-hidden="true" />
            )}
            <p className="text-sm font-semibold">
              {analysis.confidence === 'low'
                ? 'Görsel net analiz için yetersiz'
                : 'Görselden çıkardığım'}
            </p>
          </header>
          <p className="text-foreground/90 text-sm leading-relaxed">
            <strong>Aranan deneyim:</strong> &ldquo;{analysis.searchQuery}&rdquo;
          </p>
          {analysis.themes.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {analysis.themes.map((t) => (
                <li
                  key={t}
                  className="bg-background/70 text-foreground rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                >
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {deals.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-semibold tracking-tight">
            Önerilen fırsatlar
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {deals.map((d, idx) => {
              const showDiscount = d.discounted_price < d.original_price;
              return (
                <li key={d.id}>
                  <Link
                    href={`/f/${d.slug}`}
                    className="border-border bg-background hover:border-foreground/30 flex gap-3 overflow-hidden rounded-lg border p-2 transition-colors"
                  >
                    <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={d.cover_image}
                        alt={d.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        priority={idx === 0}
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {d.title}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {[d.district, d.city].filter(Boolean).join(', ')} ·{' '}
                        <span className="text-emerald-700 dark:text-emerald-300">
                          {(d.similarity * 100).toFixed(0)}% eşleşme
                        </span>
                      </p>
                      <p className="mt-auto inline-flex items-baseline gap-1.5">
                        {showDiscount ? (
                          <span className="text-muted-foreground text-[10px] line-through">
                            {formatTRY(d.original_price)}
                          </span>
                        ) : null}
                        <span className="text-sm font-semibold">
                          {formatTRY(d.discounted_price)}
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : analysis && analysis.confidence !== 'low' ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-lg border border-dashed p-6 text-center text-sm">
          Bu görsele yakın bir fırsat bulamadım — biraz daha karakteristik bir
          görselle dener misin?
        </p>
      ) : null}
    </div>
  );
}
