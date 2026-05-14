import { Coins, Gift, Sparkles } from 'lucide-react';

/**
 * Spin sayfasının yanında, sürekli dönen mini çark ikonu + ödül listesi.
 * lg+ ekranlarda görünür (mobile'da yer daralmasın diye gizlenir).
 *
 * Animasyon CSS @keyframes ile; saniyede ~24 derece dönüş (15sn / tur).
 */
export function SpinPromoBanner() {
  return (
    <aside className="from-rose-500/10 via-amber-500/10 to-violet-500/10 border-rose-500/20 hidden h-full flex-col justify-between rounded-2xl border bg-gradient-to-br p-6 lg:flex">
      <div>
        <p className="text-rose-700 dark:text-rose-300 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Günlük şans
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight">
          Çevir, puan
          <br />
          ya da kupon
          <br />
          kazan!
        </h2>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          Her gün bir kez ücretsiz. Sömestir yok, hafta sonu farkı yok.
        </p>
      </div>

      {/* Dönen mini çark */}
      <div className="my-6 flex justify-center">
        <div className="relative aspect-square w-36">
          {/* Halka */}
          <div className="bg-gradient-to-br from-amber-300 via-rose-400 to-violet-500 absolute inset-0 rounded-full p-1 shadow-xl">
            <div className="bg-background rounded-full p-1">
              {/* Dönen disk */}
              <div
                className="spin-promo-disk relative aspect-square w-full rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, #cbd5e1 0deg 51.4deg, #fcd34d 51.4deg 102.8deg, #fbbf24 102.8deg 154.2deg, #fb923c 154.2deg 205.6deg, #7dd3fc 205.6deg 257deg, #a78bfa 257deg 308.4deg, #fb7185 308.4deg 360deg)',
                }}
              >
                {/* Merkez */}
                <span className="bg-gradient-to-br from-amber-400 to-rose-500 absolute left-1/2 top-1/2 inline-flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white shadow-inner">
                  <Sparkles className="size-4 text-white" aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
          {/* Pointer */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-0.5">
            <div className="size-0 border-x-[8px] border-t-[14px] border-x-transparent border-t-rose-600 drop-shadow" />
          </div>
        </div>
      </div>

      {/* Ödül listesi */}
      <ul className="space-y-2 text-xs">
        <li className="inline-flex items-center gap-2">
          <Coins className="size-3.5 text-amber-600" aria-hidden="true" />
          <span>
            <strong className="text-foreground">25 / 50 / 100</strong> puan
          </span>
        </li>
        <li className="inline-flex items-center gap-2">
          <Gift className="size-3.5 text-violet-600" aria-hidden="true" />
          <span>
            <strong className="text-foreground">%5 / %10 / %20</strong> indirim kuponu
          </span>
        </li>
        <li className="text-muted-foreground inline-flex items-center gap-2">
          <span aria-hidden="true">·</span>
          14–60 gün geçerli, tek kullanım
        </li>
      </ul>

      <style>{`
        @keyframes spin-promo-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin-promo-disk {
          animation: spin-promo-rotate 15s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .spin-promo-disk { animation: none; }
        }
      `}</style>
    </aside>
  );
}
