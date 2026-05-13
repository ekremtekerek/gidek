'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/utils/site-config';

interface Props {
  token: string;
}

/**
 * Tek tıkla favori listesi linkini panoya kopyala. Toast'la onay; share API
 * varsa native share'i de tetikler.
 */
export function ShareWishlistButton({ token }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE.url}/p/favoriler/${encodeURIComponent(token)}`;

  async function onShare() {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          await navigator.share({
            title: 'Favori fırsatlarım',
            text: 'gidek.net favori listemi paylaşıyorum:',
            url,
          });
          return;
        } catch {
          // Kullanıcı iptal ettiyse veya share desteklemiyorsa pano fallback.
        }
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link kopyalandı — paylaşabilirsin.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Link kopyalanamadı. Tarayıcı izni gerekiyor olabilir.');
    }
  }

  return (
    <Button type="button" variant="outline" size="md" onClick={onShare} className="gap-2">
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Link2 className="size-4" aria-hidden="true" />
      )}
      {copied ? 'Kopyalandı' : 'Listeyi paylaş'}
    </Button>
  );
}
