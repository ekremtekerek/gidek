'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * URL'de ?ref=CODE varsa bir kez backend'e POST eder → cookie'ye yazılır.
 * Sonraki signup / onboarding adımında server tarafı otomatik claim eder.
 * Hiçbir görsel render etmez.
 */
export function RefCapture() {
  const params = useSearchParams();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    const code = params?.get('ref')?.trim().toUpperCase();
    if (!code) return;
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return;
    sentRef.current = true;

    void fetch('/api/referral/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {
      // sessiz — kod yoksa veya hata varsa kullanıcıya gösterme.
    });
  }, [params]);

  return null;
}
