'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';

interface GeneratedContent {
  subtitle: string;
  description: string;
  highlights: string[];
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  audience: string[];
}

interface Props {
  /** Aynı sayfa içindeki <form> ID'si — DOM API ile alanları doldurmak için. */
  formId: string;
}

/**
 * Admin deal oluştururken Gemini'ye başlık + ipucu verip
 * subtitle/description/highlights/meta/tags/audience üretir. Üretilen
 * içerik preview'da düzenlenebilir; admin "uygula" deyince formdaki ilgili
 * alanlar DOM API ile doldurulur (React uncontrolled defaultValue input'lar
 * için input event dispatch'i ile senkron tutuyoruz).
 */
export function DealAiAssist({ formId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [keywords, setKeywords] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);

  async function handleGenerate() {
    if (title.trim().length < 3) {
      toast.error('Önce kısa bir başlık yaz (en az 3 karakter).');
      return;
    }
    setPending(true);
    setResult(null);
    try {
      // Form'daki merchant + city'yi de yardımcı bağlam olarak gönder.
      const form = document.getElementById(formId) as HTMLFormElement | null;
      const merchantSelect = form?.elements.namedItem('merchant_id') as
        | HTMLSelectElement
        | null;
      const merchantName = merchantSelect
        ? merchantSelect.options[merchantSelect.selectedIndex]?.text
        : undefined;
      const cityInput = form?.elements.namedItem('city') as HTMLInputElement | null;
      const districtInput = form?.elements.namedItem('district') as HTMLInputElement | null;

      const res = await fetch('/api/admin/deals/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          categorySlug: categorySlug || undefined,
          merchantName: merchantName || undefined,
          city: cityInput?.value || undefined,
          district: districtInput?.value || undefined,
          keywords: keywords.trim() || undefined,
        }),
      });
      // Sunucu auth/yetki başarısızlığında HTML redirect dönebilir; JSON
      // parse'tan önce content-type kontrolü ile temiz hata gösteriyoruz.
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        toast.error(
          res.status === 401
            ? 'Önce giriş yapmalısın.'
            : res.status === 403
              ? 'Bu özelliğe erişim yetkin yok.'
              : `Sunucu hatası (${res.status}). Tekrar dene.`,
        );
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'İçerik üretilemedi.');
        return;
      }
      setResult(data.content as GeneratedContent);
      toast.success('İçerik üretildi — önizlemeyi gözden geçir.');
    } catch (err) {
      console.error(err);
      toast.error('Beklenmeyen bir hata oldu.');
    } finally {
      setPending(false);
    }
  }

  function applyToField(name: string, value: string) {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function applyChipGroup(name: string, values: string[]) {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const inputs = form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`);
    for (const input of inputs) {
      input.checked = values.includes(input.value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function applyAll() {
    if (!result) return;
    applyToField('subtitle', result.subtitle);
    applyToField('description', result.description);
    applyToField('highlights', result.highlights.join('\n'));
    applyChipGroup('tags', result.tags);
    applyChipGroup('audience', result.audience);
    toast.success('Tüm alanlar dolduruldu — kaydetmeden önce gözden geçir.');
    setOpen(false);
  }

  return (
    <section className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-background to-background relative overflow-hidden rounded-xl border p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-emerald-500/20 blur-3xl"
      />

      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
            <Sparkles className="size-4 text-emerald-600" aria-hidden="true" />
            AI yardımcı
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Gemini Flash
            </span>
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Başlık + birkaç ipucu yaz, AI description/highlights/meta/tags üretsin.
            Gözden geçirip uygula.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 text-xs font-medium underline-offset-2 hover:underline"
        >
          {open ? 'Kapat' : 'Aç'}
        </button>
      </header>

      {open ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-title">Başlık</Label>
              <input
                id="ai-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="örn. Bostancı'da bahçeli aile akşam yemeği"
                className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-10 w-full rounded-md border px-3 text-sm transition-colors focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ai-cat">Kategori (opsiyonel)</Label>
              <select
                id="ai-cat"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="border-border bg-background focus:border-foreground/50 h-10 w-full rounded-md border px-3 text-sm focus:outline-none"
              >
                <option value="">— Seçme —</option>
                {MAIN_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-kw">İpuçları (opsiyonel)</Label>
            <textarea
              id="ai-kw"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={2}
              placeholder="örn. Bahçe alanı 80 kişilik, vejetaryen menü var, 2 saatlik oturuş, açık hava."
              className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 min-h-[64px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
            />
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={pending}
            className="self-start gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Üretiliyor…
              </>
            ) : (
              <>
                <Wand2 className="size-4" aria-hidden="true" />
                İçerik üret
              </>
            )}
          </Button>

          {result ? (
            <div className="border-border bg-background mt-3 flex flex-col gap-4 rounded-lg border p-4">
              <header className="flex items-baseline justify-between gap-3 border-b border-dashed pb-3">
                <h3 className="text-sm font-semibold">Önizleme</h3>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={applyAll}
                  className="gap-1.5"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Tüm alanları forma uygula
                </Button>
              </header>

              <PreviewField label="Alt başlık" value={result.subtitle} />
              <PreviewField label="Açıklama" value={result.description} multiline />
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">Öne çıkanlar</p>
                <ul className="text-foreground/90 list-inside list-disc text-sm leading-relaxed">
                  {result.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <PreviewField label="Meta başlık (SEO)" value={result.metaTitle} />
                <PreviewField
                  label="Meta açıklama (SEO)"
                  value={result.metaDescription}
                  multiline
                />
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                  Önerilen etiketler ({result.tags.length})
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {result.tags.map((t) => (
                    <li
                      key={t}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                      )}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">Hedef kitle</p>
                <ul className="flex flex-wrap gap-1.5">
                  {result.audience.map((a) => (
                    <li
                      key={a}
                      className="bg-foreground/10 text-foreground rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PreviewField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-xs font-medium">{label}</p>
      <p
        className={cn(
          'text-foreground/90 bg-muted/30 rounded-md p-2.5 text-sm leading-relaxed',
          multiline ? 'whitespace-pre-line' : 'line-clamp-2',
        )}
      >
        {value}
      </p>
    </div>
  );
}
