'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

type Status = 'unsupported' | 'denied' | 'disabled' | 'subscribed' | 'loading';

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Auth'lu kullanıcının push notification iznini ister, subscription'ı
 * server'a kaydeder. V1'de gönderim cron'u henüz yok — abonelik altyapısı
 * hazır olsun diye scaffolding.
 *
 * VAPID_PUBLIC_KEY env'de yoksa düğme görünmez (component sessizce null döner).
 */
export function PushOptIn() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? 'subscribed' : 'disabled');
      } catch {
        setStatus('unsupported');
      }
    })();
  }, []);

  async function subscribe() {
    try {
      setStatus('loading');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus(perm === 'denied' ? 'denied' : 'disabled');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      // lib.dom subscribe() ArrayBuffer<ArrayBuffer> bekliyor; SharedArrayBuffer
      // ihtimalini eleyen tip teyidiyle ArrayBuffer'a daralt.
      const buf = new ArrayBuffer(key.byteLength);
      new Uint8Array(buf).set(key);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: buf,
      });
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error('subscribe failed');
      setStatus('subscribed');
      toast.success('Bildirimler açık — önemli güncellemeler artık yandan gelecek.');
    } catch (err) {
      console.error(err);
      setStatus('disabled');
      toast.error('Bildirimler etkinleştirilemedi.');
    }
  }

  async function unsubscribe() {
    try {
      setStatus('loading');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setStatus('disabled');
        return;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'DELETE',
      });
      setStatus('disabled');
      toast.success('Bildirimler kapatıldı.');
    } catch {
      toast.error('Kapatılamadı.');
    }
  }

  if (status === 'unsupported') return null;

  if (status === 'denied') {
    return (
      <p className="text-muted-foreground text-xs">
        Tarayıcı bildirimlerini reddetmişsin. Site ayarlarından açabilirsin.
      </p>
    );
  }

  if (status === 'subscribed') {
    return (
      <Button type="button" variant="outline" size="sm" onClick={unsubscribe} className="gap-2">
        <BellOff className="size-4" aria-hidden="true" />
        Bildirimleri kapat
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={subscribe}
      disabled={status === 'loading'}
      className="gap-2"
    >
      {status === 'loading' ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Bell className="size-4" aria-hidden="true" />
      )}
      Bildirimleri aç
    </Button>
  );
}
