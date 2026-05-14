'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Check, Copy, Coins, Gift, Sparkles, X } from 'lucide-react';
import { spinDailyAction, type SpinPrize, type SpinState } from '@/app/cark/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * Çarkın 7 dilimi — RPC ile aynı sırada olmalı çünkü ödülün hangi dilime
 * denk geldiğini bulup oraya rotate edeceğiz.
 */
const SEGMENTS: Array<{
  key: string;
  label: string;
  short: string;
  gradient: string;
  textCls: string;
}> = [
  { key: 'none',     label: 'Yarın tekrar', short: 'Boş',      gradient: 'from-slate-300 to-slate-400',    textCls: 'text-slate-900' },
  { key: 'p25',      label: '+25 puan',     short: '+25',      gradient: 'from-amber-200 to-amber-400',    textCls: 'text-amber-950' },
  { key: 'p50',      label: '+50 puan',     short: '+50',      gradient: 'from-amber-300 to-amber-500',    textCls: 'text-amber-950' },
  { key: 'p100',     label: '+100 puan',    short: '+100',     gradient: 'from-orange-400 to-orange-600',  textCls: 'text-white' },
  { key: 'c5',       label: '%5 kupon',     short: '%5',       gradient: 'from-sky-300 to-sky-500',        textCls: 'text-sky-950' },
  { key: 'c10',      label: '%10 kupon',    short: '%10',      gradient: 'from-violet-400 to-violet-600',  textCls: 'text-white' },
  { key: 'c20',      label: '%20 kupon',    short: '%20',      gradient: 'from-rose-500 to-pink-600',      textCls: 'text-white' },
];

const SEG_DEG = 360 / SEGMENTS.length;

function prizeToSegmentIndex(prize: SpinPrize): number {
  if (prize.kind === 'none') return 0;
  if (prize.kind === 'points') {
    if (prize.points === 25) return 1;
    if (prize.points === 50) return 2;
    if (prize.points === 100) return 3;
  }
  if (prize.kind === 'coupon') {
    if (prize.couponValue === 5) return 4;
    if (prize.couponValue === 10) return 5;
    if (prize.couponValue === 20) return 6;
  }
  return 0;
}

interface Props {
  alreadySpunToday: boolean;
  todayPrize: SpinPrize | null;
}

export function SpinWheel({ alreadySpunToday, todayPrize }: Props) {
  const [pending, startTransition] = useTransition();
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [shownPrize, setShownPrize] = useState<SpinPrize | null>(todayPrize);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doneToday, setDoneToday] = useState(alreadySpunToday);
  const [showModal, setShowModal] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  function handleSpin() {
    if (animating || doneToday) return;
    setErrorMsg(null);

    startTransition(async () => {
      const result: SpinState = await spinDailyAction();
      if (!result || !result.ok) {
        setErrorMsg(result?.message ?? 'Bilinmeyen hata.');
        if (result?.reason === 'already_spun') setDoneToday(true);
        return;
      }

      const idx = prizeToSegmentIndex(result.prize);
      // Dilimin orta açısı (12 yönü = 0). Pointer top-center'da olduğu için
      // hedef rotasyon: target = -(idx * SEG_DEG + SEG_DEG/2). Buna 5 tam tur
      // ekliyoruz ki çark gerçekçi şekilde dönsün.
      const targetWithin = -(idx * SEG_DEG + SEG_DEG / 2);
      const fullSpins = 360 * 5;
      // Mevcut rotation'a göre hep ileri dönmesi için modulo trick.
      const currentMod = ((rotation % 360) + 360) % 360;
      const targetMod = ((targetWithin % 360) + 360) % 360;
      const delta = (targetMod - currentMod + 360) % 360;
      const next = rotation + fullSpins + delta;

      setAnimating(true);
      setRotation(next);

      // 4.5sn sonra sonucu göster (CSS transition süresiyle uyumlu)
      window.setTimeout(() => {
        setShownPrize(result.prize);
        setShowModal(true);
        setDoneToday(true);
        setAnimating(false);
      }, 4500);
    });
  }

  return (
    <div className="flex flex-col items-center">
      {/* Çark */}
      <div className="relative mx-auto aspect-square w-full max-w-[360px]">
        {/* Pointer (top-center, çarka doğru bakar) */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
          <div className="size-0 border-x-[14px] border-t-[22px] border-x-transparent border-t-rose-600 drop-shadow-lg" />
        </div>

        {/* Halka — dış parıltı */}
        <div className="bg-gradient-to-br from-amber-300 via-rose-400 to-violet-500 absolute inset-0 rounded-full p-[6px] shadow-2xl">
          <div className="bg-background rounded-full p-1.5">
            {/* Çarkın kendisi — bütün dilimler tek conic-gradient */}
            <div
              ref={wheelRef}
              className={cn(
                'relative aspect-square w-full overflow-hidden rounded-full',
                animating && 'transition-transform duration-[4500ms] ease-[cubic-bezier(0.16,0.84,0.34,1)]',
              )}
              style={{
                transform: `rotate(${rotation}deg)`,
                background: buildConicGradient(),
              }}
            >
              {/* Dilim etiketleri */}
              {SEGMENTS.map((s, i) => {
                const angle = i * SEG_DEG + SEG_DEG / 2;
                return (
                  <div
                    key={s.key}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 origin-bottom-left"
                    style={{
                      transform: `translate(0, -50%) rotate(${angle}deg) translateY(-40%)`,
                    }}
                  >
                    <span
                      className={cn(
                        'inline-block whitespace-nowrap text-xs font-bold tracking-wide drop-shadow',
                        s.textCls,
                      )}
                    >
                      {s.short}
                    </span>
                  </div>
                );
              })}

              {/* Merkez dekoratif daire */}
              <div className="absolute left-1/2 top-1/2 z-10 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-gradient-to-br from-amber-400 to-rose-500 shadow-inner sm:size-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Spin button */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <Button
          type="button"
          onClick={handleSpin}
          disabled={pending || animating || doneToday}
          size="lg"
          className="bg-gradient-to-r from-rose-500 to-amber-500 px-10 text-base font-bold tracking-wide text-white shadow-lg transition-transform hover:scale-105 hover:from-rose-600 hover:to-amber-600 disabled:scale-100 disabled:opacity-60"
        >
          <Sparkles className="size-5" aria-hidden="true" />
          {animating ? 'Dönüyor…' : doneToday ? 'Bugün çevirildi' : 'ÇEVİR'}
        </Button>

        {doneToday && shownPrize ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
          >
            Bugünün ödülünü tekrar göster
          </button>
        ) : null}

        {errorMsg ? (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
        ) : null}
      </div>

      {/* Result modal */}
      {showModal && shownPrize ? (
        <PrizeModal prize={shownPrize} onClose={() => setShowModal(false)} />
      ) : null}
    </div>
  );
}

function buildConicGradient(): string {
  const stops: string[] = [];
  // Tailwind class içindeki gradient renkleri inline gradient'e karşılık gelmiyor;
  // basit pastelden parlak'a düz renk haritası yapıyoruz.
  const colors = ['#cbd5e1', '#fcd34d', '#fbbf24', '#fb923c', '#7dd3fc', '#a78bfa', '#fb7185'];
  for (let i = 0; i < SEGMENTS.length; i++) {
    const a = i * SEG_DEG;
    const b = (i + 1) * SEG_DEG;
    stops.push(`${colors[i]} ${a}deg ${b}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(', ')})`;
}

function PrizeModal({
  prize,
  onClose,
}: {
  prize: SpinPrize;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function copyCode() {
    if (prize.kind !== 'coupon') return;
    try {
      await navigator.clipboard.writeText(prize.couponCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const icon =
    prize.kind === 'coupon' ? (
      <Gift className="size-10 text-white" aria-hidden="true" />
    ) : prize.kind === 'points' ? (
      <Coins className="size-10 text-white" aria-hidden="true" />
    ) : (
      <Sparkles className="size-10 text-white" aria-hidden="true" />
    );

  const accent =
    prize.kind === 'coupon'
      ? 'from-violet-500 to-rose-500'
      : prize.kind === 'points'
        ? 'from-amber-500 to-orange-500'
        : 'from-slate-400 to-slate-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spin-result-title"
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Kapat"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div className="bg-background relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="hover:bg-muted absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div
          className={cn(
            'relative flex flex-col items-center gap-3 bg-gradient-to-br px-6 py-8 text-center text-white',
            accent,
          )}
        >
          {/* Konfeti benzeri parlak noktalar */}
          <span className="absolute left-6 top-6 size-1.5 rounded-full bg-white/70" />
          <span className="absolute right-8 top-10 size-2 rounded-full bg-white/60" />
          <span className="absolute left-10 bottom-8 size-1 rounded-full bg-white/70" />
          <span className="absolute right-6 bottom-12 size-1.5 rounded-full bg-white/60" />

          <div className="bg-white/15 mb-1 inline-flex size-20 items-center justify-center rounded-full backdrop-blur">
            {icon}
          </div>
          <p id="spin-result-title" className="text-xs font-semibold uppercase tracking-widest opacity-80">
            {prize.kind === 'none' ? 'Bu sefer olmadı' : 'Tebrikler!'}
          </p>
          <p className="text-2xl font-bold tracking-tight">{prize.label}</p>
        </div>

        <div className="p-5">
          {prize.kind === 'coupon' ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">
                Kupon kodun aşağıda — ödeme sayfasında kullanabilirsin.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5">
                <code className="flex-1 truncate text-sm font-semibold tracking-wide">
                  {prize.couponCode}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  aria-label="Kuponu kopyala"
                  className="hover:bg-violet-500/15 inline-flex size-8 items-center justify-center rounded-md text-violet-800 transition-colors dark:text-violet-200"
                >
                  {copied ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          ) : prize.kind === 'points' ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Puanların loyalty hesabına işlendi. Profil sayfanda görebilirsin.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bugün şansına bir şey çıkmadı — yarın tekrar gel, ödüller daha cömert
              olabilir.
            </p>
          )}

          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="mt-4 w-full"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}
