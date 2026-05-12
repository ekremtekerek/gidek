'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { MAIN_CATEGORIES, type CategorySlug } from '@/lib/utils/constants';
import { CATEGORY_STYLE } from '@/lib/utils/category-styles';
import { cn } from '@/lib/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  selected: CategorySlug | null;
  onSelect: (slug: CategorySlug | null) => void;
}

/**
 * Tüm kategorileri büyük kart grid'inde gösteren modal. Harita üzerindeki
 * yatay scroll kategori bar'ı tek tıkla 13'ünü birden gösteren bu modal'ı
 * açar; kullanıcı seçtikten sonra modal kapanır ve harita filtresi güncel.
 */
export function CategoryModal({ open, onClose, selected, onSelect }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof window === 'undefined') return null;

  const sheet = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kategori seç"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
    >
      <button
        type="button"
        aria-label="Kapat"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />

      <div className="border-border bg-background relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl">
        <header className="border-border flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Tüm kategoriler</h2>
            <p className="text-muted-foreground text-xs">Birini seç, harita o kategoriyi filtrelesin.</p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="hover:bg-muted inline-flex size-9 items-center justify-center rounded-md transition-colors"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="max-h-[70svh] overflow-y-auto p-4 sm:p-5">
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <li>
              <CategoryCard
                bg="bg-muted"
                fg="text-foreground"
                label="Hepsi"
                glyph="✦"
                active={selected === null}
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
              />
            </li>
            {MAIN_CATEGORIES.map((c) => {
              const style = CATEGORY_STYLE[c.slug];
              if (!style) return null;
              const { Icon, bg, fg } = style;
              return (
                <li key={c.slug}>
                  <CategoryCard
                    bg={bg}
                    fg={fg}
                    label={c.name}
                    icon={<Icon className="size-5" aria-hidden="true" />}
                    active={selected === c.slug}
                    onClick={() => {
                      onSelect(c.slug);
                      onClose();
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

interface CardProps {
  bg: string;
  fg: string;
  label: string;
  icon?: React.ReactNode;
  glyph?: string;
  active: boolean;
  onClick: () => void;
}

function CategoryCard({ bg, fg, label, icon, glyph, active, onClick }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'border-border bg-background hover:border-foreground/30 group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm',
        active && 'border-foreground shadow-sm ring-foreground/20 ring-2',
      )}
    >
      <span
        className={cn(
          'inline-flex size-12 items-center justify-center rounded-full transition-transform group-hover:scale-110',
          bg,
          fg,
        )}
      >
        {icon ?? <span className="text-lg font-semibold">{glyph}</span>}
      </span>
      <span className="text-sm font-medium tracking-tight">{label}</span>
      {active ? (
        <span className="bg-foreground text-background absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  );
}
