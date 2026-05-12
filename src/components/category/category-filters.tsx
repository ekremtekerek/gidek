import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEAL_TAGS, SUPPORTED_CITIES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** Pathname the form posts back to (e.g. /k/yemek). */
  action: string;
  /** Currently applied values, pre-filled into the controls. */
  current: {
    city?: string;
    tags?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  };
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'En yeni' },
  { value: 'popular', label: 'En popüler' },
  { value: 'price-asc', label: 'Fiyat: artan' },
  { value: 'price-desc', label: 'Fiyat: azalan' },
] as const;

/**
 * URL-driven filter form. Plain HTML GET form so it works without JS:
 * submit navigates to the same path with new query params, the server
 * re-renders the page with the updated filtered list.
 */
export function CategoryFilters({ action, current }: Props) {
  const selectedTags = new Set(current.tags ?? []);

  return (
    <details className="border-border bg-background overflow-hidden rounded-lg border">
      <summary className="hover:bg-muted/40 flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium transition-colors sm:px-5">
        <span className="inline-flex items-center gap-2">
          <Filter className="size-4" aria-hidden="true" />
          Filtrele &amp; sırala
        </span>
        <span className="text-muted-foreground text-xs">Aç / kapat</span>
      </summary>

      <form action={action} method="get" className="border-border flex flex-col gap-6 border-t p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-city">Şehir</Label>
            <select
              id="filter-city"
              name="city"
              defaultValue={current.city ?? ''}
              className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-11 rounded-md border px-3.5 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="">Tüm şehirler</option>
              {SUPPORTED_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-min">En az ₺</Label>
            <Input
              id="filter-min"
              name="min"
              type="number"
              min={0}
              step={50}
              defaultValue={current.minPrice ?? ''}
              placeholder="0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-max">En çok ₺</Label>
            <Input
              id="filter-max"
              name="max"
              type="number"
              min={0}
              step={50}
              defaultValue={current.maxPrice ?? ''}
              placeholder="20000"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Sırala</Label>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  defaultChecked={(current.sort ?? 'newest') === opt.value}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'border-border bg-background hover:border-foreground/30 inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    'peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground',
                  )}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Etiketler</Label>
          <p className="text-muted-foreground text-xs">Birden fazla seçebilirsin (hepsi eşleşmeli).</p>
          <div className="flex flex-wrap gap-2">
            {DEAL_TAGS.map((t) => (
              <label key={t.slug} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="tag"
                  value={t.slug}
                  defaultChecked={selectedTags.has(t.slug)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'border-border bg-background hover:border-foreground/30 inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                    'peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground',
                  )}
                >
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-border flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
          <Button type="reset" variant="ghost" size="md" formAction={action} formMethod="get">
            Sıfırla
          </Button>
          <Button type="submit" variant="primary" size="md">
            Uygula
          </Button>
        </div>
      </form>
    </details>
  );
}
