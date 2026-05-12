'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const REGISTRY: Record<string, () => void> = {
  'login-success': () => toast.success('Tekrar hoş geldin'),
  'signup-success': () =>
    toast.success('Hesabın hazır', {
      description: 'Birkaç tercih ekle, AI önerileri kişiselleşsin.',
    }),
  'logout-success': () => toast.success('Çıkış yapıldı'),
  'profile-updated': () => toast.success('Profil güncellendi'),
  'avatar-updated': () => toast.success('Profil fotoğrafı güncellendi'),
  'avatar-removed': () => toast.success('Profil fotoğrafı kaldırıldı'),
  'onboarding-done': () => toast.success('Tercihlerin kaydedildi'),
  'booking-created': () =>
    toast.success('Rezervasyon oluşturuldu', {
      description: 'Ödeme adımına yönlendiriliyorsun.',
    }),
  'payment-success': () =>
    toast.success('Ödeme onaylandı', {
      description: 'E-biletin aşağıda — yazdırabilir veya QR kodu gösterebilirsin.',
    }),
  'password-updated': () => toast.success('Şifre güncellendi'),
  'search-saved': () =>
    toast.success('Arama kaydedildi', {
      description: 'Profil → Aramalarım sayfasından dönebilirsin.',
    }),
  'search-deleted': () => toast.success('Arama silindi'),
};

/**
 * Reads a `?toast=<key>` query param on each navigation and fires the
 * matching sonner toast, then strips the param so a refresh doesn't repeat
 * the message. Using a ref to ignore React StrictMode's double-mount in dev.
 */
export function ToastBridge() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const seenRef = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams.get('toast');
    if (!key) {
      seenRef.current = null;
      return;
    }
    if (seenRef.current === key) return;
    seenRef.current = key;

    const fire = REGISTRY[key];
    if (fire) fire();

    // Strip ?toast from the URL so refresh/back doesn't replay it.
    const params = new URLSearchParams(searchParams);
    params.delete('toast');
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
