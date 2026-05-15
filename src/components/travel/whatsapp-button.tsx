import { MessageCircle } from 'lucide-react';

interface Props {
  /** Tesis veya destek telefonu (TR format, +90... veya başında 5..) */
  phone?: string | null;
  /** Mesaj template — deal başlığı vb. */
  dealTitle: string;
  /** Konum (varsa) */
  location?: string | null;
  /** Variant — büyük CTA (detayda) ya da küçük (sticky bar yanında) */
  variant?: 'full' | 'compact';
}

/**
 * WhatsApp direkt rezervasyon butonu. wa.me deep link ile yeni sekmede açar.
 * Telefon yoksa varsayılan destek hattı (mock — canlıya çıkışta env'den gelir).
 */
export function WhatsAppButton({
  phone,
  dealTitle,
  location,
  variant = 'full',
}: Props) {
  // Default destek hattı (mock)
  const rawPhone = phone || '+905468011939';
  const clean = rawPhone.replace(/[^\d+]/g, '');
  const normalized = clean.startsWith('+')
    ? clean.substring(1)
    : clean.startsWith('00')
      ? clean.substring(2)
      : clean.startsWith('0')
        ? `90${clean.substring(1)}`
        : clean;

  const message = `Merhaba, "${dealTitle}"${location ? ` (${location})` : ''} fırsatı hakkında bilgi almak istiyorum.`;
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;

  if (variant === 'compact') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ile sor"
        className="bg-emerald-500 hover:bg-emerald-600 inline-flex size-10 items-center justify-center rounded-full text-white shadow-md transition-all hover:scale-110"
      >
        <MessageCircle className="size-5 fill-white" aria-hidden="true" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg"
    >
      <MessageCircle className="size-5 fill-white/90 transition-transform group-hover:rotate-6" aria-hidden="true" />
      WhatsApp ile sor
      <span className="text-[10px] font-normal opacity-75">
        · {phone ? 'tesise' : 'desteğe'}
      </span>
    </a>
  );
}
