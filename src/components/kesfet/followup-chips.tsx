'use client';

import { Sparkle } from 'lucide-react';

interface Props {
  onPick: (text: string) => void;
  disabled?: boolean;
}

const FOLLOWUPS = [
  'Daha uygun fiyatlısını öner',
  'Bu hafta sonu için bir öneri',
  'Yakınımda başka neler var?',
  'Bunlardan birini detaylıca anlat',
] as const;

/**
 * AI cevabı sonrası kullanıcıya hızlı takip seçenekleri. Tıklayınca direkt
 * yeni mesaj olarak gönderir, kullanıcının yazma yükü olmadan akış sürer.
 */
export function FollowupChips({ onPick, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] font-medium">
        <Sparkle className="size-3" aria-hidden="true" />
        Devam et:
      </span>
      {FOLLOWUPS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onPick(f)}
          disabled={disabled}
          className="border-border bg-background hover:border-foreground/40 hover:bg-muted disabled:opacity-50 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs"
        >
          {f}
        </button>
      ))}
    </div>
  );
}
