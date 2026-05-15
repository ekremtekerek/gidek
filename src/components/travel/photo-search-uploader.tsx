'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  ImagePlus,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MatchResult {
  destination: string;
  score: number;
  why: string;
  searchKeyword: string;
}

interface AnalysisResult {
  vibe: string;
  setting: string;
  description: string;
  features: string[];
  colorPalette: string[];
  turkishMatches: MatchResult[];
  searchKeywords: string[];
}

const VIBE_LABELS: Record<string, string> = {
  chill: 'Sakin',
  adventurous: 'Maceralı',
  romantic: 'Romantik',
  family: 'Aile',
  party: 'Eğlenceli',
  cultural: 'Kültürel',
  wellness: 'Spa & Wellness',
};

const SETTING_LABELS: Record<string, string> = {
  beach: 'Plaj',
  mountain: 'Dağ',
  city: 'Şehir',
  cultural: 'Kültürel',
  desert: 'Çöl',
  island: 'Ada',
  lake: 'Göl',
  forest: 'Orman',
};

type State =
  | { kind: 'idle' }
  | { kind: 'preview'; file: File; previewUrl: string }
  | { kind: 'uploading'; previewUrl: string }
  | { kind: 'success'; previewUrl: string; result: AnalysisResult }
  | { kind: 'error'; message: string; previewUrl?: string };

export function PhotoSearchUploader() {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setState({ kind: 'error', message: 'JPG, PNG veya WebP formatı yükle.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setState({ kind: 'error', message: 'Foto en fazla 5 MB olabilir.' });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setState({ kind: 'preview', file, previewUrl });
  }, []);

  const onSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = '';
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const reset = useCallback(() => {
    if (state.kind !== 'idle' && 'previewUrl' in state && state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({ kind: 'idle' });
  }, [state]);

  const upload = useCallback(
    async (file: File, previewUrl: string) => {
      setState({ kind: 'uploading', previewUrl });
      try {
        const form = new FormData();
        form.append('photo', file);
        const res = await fetch('/api/tatil/foto-ara', {
          method: 'POST',
          body: form,
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setState({
            kind: 'error',
            message: data.error || 'Bir şeyler ters gitti.',
            previewUrl,
          });
          return;
        }
        setState({ kind: 'success', previewUrl, result: data.result });
      } catch {
        setState({
          kind: 'error',
          message: 'Bağlantı hatası. Tekrar dene.',
          previewUrl,
        });
      }
    },
    [],
  );

  if (state.kind === 'success') {
    return (
      <ResultPanel
        result={state.result}
        previewUrl={state.previewUrl}
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="photo-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all sm:p-12',
          dragOver
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
            : 'border-border bg-muted/30 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/20',
          state.kind === 'uploading' && 'pointer-events-none opacity-70',
        )}
      >
        {state.kind === 'preview' || state.kind === 'uploading' ? (
          <div className="relative w-full max-w-md">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={state.previewUrl}
                alt="Yüklenen foto"
                fill
                sizes="(min-width:640px) 28rem, 90vw"
                className="object-cover"
                unoptimized
              />
              {state.kind === 'uploading' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white backdrop-blur-sm">
                  <Loader2 className="size-10 animate-spin" aria-hidden="true" />
                  <p className="text-sm font-bold">AI fotoğrafını analiz ediyor…</p>
                  <p className="text-xs opacity-80">~5-10 saniye</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <span className="bg-sky-500/15 group-hover:bg-sky-500/25 inline-flex size-16 items-center justify-center rounded-full transition-colors">
              <ImagePlus
                className="text-sky-600 dark:text-sky-400 size-8"
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-base font-bold">
                Tatil fotoğrafı yükle
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Sürükle bırak veya tıklayıp seç — JPG, PNG, WebP (max 5MB)
              </p>
            </div>
            <p className="text-muted-foreground/80 mt-2 max-w-md text-xs leading-relaxed">
              Bali, Maldivler, Mykonos, İsviçre… AI fotoğrafı analiz edip
              Türkiye&apos;den benzer atmosfere sahip destinasyonlar önerir.
            </p>
          </>
        )}
        <input
          ref={inputRef}
          id="photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onSelect}
          className="sr-only"
          disabled={state.kind === 'uploading'}
        />
      </label>

      {state.kind === 'preview' ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => upload(state.file, state.previewUrl)}
            className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r px-6 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02]"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            AI ile analiz et
          </button>
          <button
            type="button"
            onClick={reset}
            className="border-border hover:bg-muted inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Vazgeç
          </button>
        </div>
      ) : null}

      {state.kind === 'error' ? (
        <div className="border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 rounded-xl border p-4">
          <p className="text-rose-900 dark:text-rose-100 inline-flex items-center gap-1.5 text-sm font-bold">
            <X className="size-4" aria-hidden="true" />
            {state.message}
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-rose-700 dark:text-rose-300 mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            <RefreshCcw className="size-3.5" aria-hidden="true" />
            Tekrar dene
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ResultPanel({
  result,
  previewUrl,
  onReset,
}: {
  result: AnalysisResult;
  previewUrl: string;
  onReset: () => void;
}) {
  const vibeLabel = VIBE_LABELS[result.vibe] ?? result.vibe;
  const settingLabel = SETTING_LABELS[result.setting] ?? result.setting;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onReset}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <Camera className="size-4" aria-hidden="true" />
        Yeni foto yükle
      </button>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        {/* Sol — Foto + analiz özet */}
        <div className="space-y-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-md">
            <Image
              src={previewUrl}
              alt="Yüklediğin foto"
              fill
              sizes="(min-width:1024px) 33vw, 90vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100 rounded-full px-2.5 py-0.5 text-xs font-bold">
              {vibeLabel}
            </span>
            <span className="bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-100 rounded-full px-2.5 py-0.5 text-xs font-bold">
              {settingLabel}
            </span>
            {result.features.slice(0, 5).map((f) => (
              <span
                key={f}
                className="border-border text-foreground/70 rounded-full border px-2.5 py-0.5 text-[11px]"
              >
                {f}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {result.description}
          </p>
        </div>

        {/* Sağ — Türkiye eşleşmeleri */}
        <div>
          <header className="mb-3">
            <p className="text-sky-700 dark:text-sky-300 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Türkiye&apos;den benzer atmosfer
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              {result.turkishMatches.length} destinasyon eşleşmesi
            </h2>
          </header>

          <ul className="space-y-2.5">
            {result.turkishMatches.map((m, i) => (
              <li
                key={`${m.destination}-${i}`}
                className="border-border bg-background flex gap-3 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md"
              >
                <span className="bg-gradient-to-br from-sky-500 to-cyan-500 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow">
                  {m.score}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-base font-bold tracking-tight">
                      {m.destination}
                    </p>
                    <span className="text-muted-foreground text-[11px]">
                      {m.score}/10 eşleşme
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {m.why}
                  </p>
                  <Link
                    href={`/tatil/ara?q=${encodeURIComponent(m.searchKeyword)}`}
                    className="text-sky-700 dark:text-sky-300 mt-2 inline-flex items-center gap-1 text-xs font-bold hover:underline"
                  >
                    {m.destination} fırsatlarını gör
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {result.searchKeywords.length > 0 ? (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">
                Arama önerileri
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.searchKeywords.map((k) => (
                  <Link
                    key={k}
                    href={`/tatil/ara?q=${encodeURIComponent(k)}`}
                    className="bg-muted hover:bg-foreground hover:text-background rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                  >
                    {k}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
