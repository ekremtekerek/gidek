'use client';

import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Props {
  code: string;
  link: string;
}

export function ShareReferralCard({ code, link }: Props) {
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);

  function copy(value: string, field: 'code' | 'link') {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedField(field);
        toast.success(field === 'code' ? 'Kod kopyalandı' : 'Link kopyalandı');
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => toast.error('Kopyalanamadı.'));
  }

  async function nativeShare() {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({
          title: 'gidek.net davetiyem',
          text: `Şu kodla kayıt ol, ikimiz de 100 TL kupon kazanalım: ${code}`,
          url: link,
        });
        return;
      }
      copy(link, 'link');
    } catch {
      // share iptal edildi
    }
  }

  return (
    <div className="border-border bg-background flex flex-col gap-5 rounded-2xl border p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Davet kodun
        </p>
        <div className="mt-2 flex items-center gap-3">
          <code className="bg-muted rounded-lg px-4 py-3 text-2xl font-bold tracking-[0.18em] tabular-nums">
            {code}
          </code>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => copy(code, 'code')}
            className="gap-2"
          >
            {copiedField === 'code' ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copiedField === 'code' ? 'Kopyalandı' : 'Kodu kopyala'}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Davet linkin
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="border-border bg-background flex-1 truncate rounded-md border px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => copy(link, 'link')}
            className={cn('gap-2', copiedField === 'link' && 'text-emerald-600 dark:text-emerald-400')}
          >
            {copiedField === 'link' ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copiedField === 'link' ? 'Kopyalandı' : 'Linki kopyala'}
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={nativeShare}
        className="w-full gap-2"
      >
        <Share2 className="size-4" aria-hidden="true" />
        Hızlıca paylaş
      </Button>
    </div>
  );
}
