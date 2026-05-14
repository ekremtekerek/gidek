'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getBrowserClient } from '@/lib/db/browser';

/**
 * Admin /admin/bookings ve /admin/bookings/[code] sayfalarında çalışır.
 * Sunucu-rendered liste/detay zaten DB'den geliyor; biz yeni booking
 * INSERT'lerini dinleyip router.refresh ile sayfayı sessizce yeniliyoruz.
 *
 * Toast atıyoruz ki admin "bir şey eklendi" diye bilsin — sayfa içeriği
 * RSC tarafında değiştiği için kullanıcı manuel refresh atmadan da güncel
 * görür.
 */
export function BookingsRealtimeRefresh() {
  const router = useRouter();
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel('admin:bookings:inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (id && seenIds.current.has(id)) return;
          if (id) seenIds.current.add(id);

          const code = (payload.new as { booking_code?: string })?.booking_code;
          toast.success('Yeni rezervasyon geldi', {
            description: code ? `Kod: ${code}` : undefined,
          });
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
