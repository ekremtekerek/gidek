import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** Tüm ekran ortasında merkezle (loading.tsx full-page). */
  fullPage?: boolean;
  label?: string;
  className?: string;
}

/**
 * Marka uyumlu loader: "gidek." yazısı + altında bir konum pin'in kesik
 * çizgi rota üzerinde sağa doğru "yolculuk" yapması. Tek yönlü animasyon —
 * sona varır, görünmez olur ve baştan başlar. "Gidiyor" hissini sürdürür.
 */
export function GidekLoader({ fullPage, label = 'Yola çıkılıyor', className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-5 text-center',
        fullPage && 'min-h-[60svh]',
        className,
      )}
    >
      <div className="gidek-shimmer-text text-3xl font-semibold tracking-tight sm:text-4xl">
        gidek.
      </div>

      <div className="relative h-8 w-48 sm:w-56" aria-hidden="true">
        {/* Kesikli rota çizgisi */}
        <span className="border-foreground/15 absolute inset-x-1 top-1/2 -translate-y-1/2 border-t border-dashed" />
        {/* Başlangıç noktası */}
        <span className="bg-foreground/40 absolute left-0 top-1/2 size-2 -translate-y-1/2 rounded-full" />
        {/* Hedef noktası */}
        <span className="bg-foreground/40 absolute right-0 top-1/2 size-2 -translate-y-1/2 rounded-full" />
        {/* Yolcu pin'i — sola sıfır → sağ kenara, kayboluverir, baştan döner */}
        <MapPin className="text-foreground gidek-traveler absolute top-0 size-5 fill-rose-500/15" />
      </div>

      <p className="text-muted-foreground text-xs font-medium">{label}…</p>
      <span className="sr-only">İçerik yükleniyor</span>
    </div>
  );
}
