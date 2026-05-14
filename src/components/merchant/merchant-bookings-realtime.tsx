'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getBrowserClient } from '@/lib/db/browser';

interface Props {
  /** Merchant'a ait deal id'leri — yalnız bunlar için bildirim. */
  dealIds: string[];
}

/**
 * Merchant'ın /isletme/rezervasyonlar sayfasında çalışır. INSERT
 * payload'ında deal_id varsa whitelist ile filtreler; bu sayede başka
 * işletmelerin booking'lerine reaksiyon vermez.
 *
 * Not: Supabase realtime postgres_changes filter parametresi tek filter
 * destekliyor (eq/in için). RLS server-side enforcement zaten merchant'ın
 * kendi deal'leri dışındakini engelliyor olsa da, deal_id whitelist ile
 * client-side de gürültü filtresi koyuyoruz.
 */
export function MerchantBookingsRealtime({ dealIds }: Props) {
  const router = useRouter();
  const seenIds = useRef(new Set<string>());
  const dealSet = useRef(new Set(dealIds));

  useEffect(() => {
    dealSet.current = new Set(dealIds);
  }, [dealIds]);

  useEffect(() => {
    if (dealIds.length === 0) return;

    const supabase = getBrowserClient();
    const channel = supabase
      .channel('merchant:bookings:inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const row = payload.new as { id?: string; deal_id?: string; booking_code?: string };
          if (!row.deal_id || !dealSet.current.has(row.deal_id)) return;
          if (row.id && seenIds.current.has(row.id)) return;
          if (row.id) seenIds.current.add(row.id);

          toast.success('Yeni rezervasyon!', {
            description: row.booking_code ? `Kod: ${row.booking_code}` : undefined,
          });
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // dealIds re-render her seferinde array referansı değişebilir ama içerik
    // genelde sabit; setup tek sefer. dealSet ref ile freshness korunuyor.
  }, [dealIds.length, router]);

  return null;
}
