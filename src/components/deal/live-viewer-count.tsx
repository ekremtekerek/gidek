'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { getBrowserClient } from '@/lib/db/browser';

interface Props {
  /** Hangi deal — her deal kendi presence channel'ında. */
  dealSlug: string;
  /** Görünür threshold — 1'in altında render etme. */
  minToShow?: number;
}

/**
 * Bir fırsata şu an kaç kişinin baktığını gerçek zamanlı gösterir.
 * Supabase Realtime Presence kullanılır — DB'ye dokunulmaz, pure WebSocket.
 *
 * Component mount olunca channel'a katılır, anonim bir presence_key
 * (random) ile kendisini track eder. Diğer kullanıcıların katılması/ayrılması
 * `sync` event'iyle gelir; biz toplamı sayıp ekrana basıyoruz.
 *
 * Görünürlük: en az minToShow kişi (default 1, kendisi dahil) olunca pill
 * görünür — boş sayfada "0 izleyici" yazısı görünmesin.
 */
export function LiveViewerCount({ dealSlug, minToShow = 1 }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = getBrowserClient();
    const channelName = `viewers:${dealSlug}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: cryptoRandom() } },
    });

    const sync = () => {
      const state = channel.presenceState();
      const total = Object.keys(state).length;
      setCount(total);
    };

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ at: Date.now() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealSlug]);

  if (count < minToShow) return null;

  return (
    <span
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-300"
      title="Şu an bu fırsata bakanların sayısı"
    >
      <span className="relative inline-flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-75" />
        <span className="relative inline-flex size-full rounded-full bg-rose-500" />
      </span>
      <Eye className="size-3" aria-hidden="true" />
      {count} kişi şu an inceliyor
    </span>
  );
}

function cryptoRandom(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
