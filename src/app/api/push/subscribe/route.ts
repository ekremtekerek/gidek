import { headers } from 'next/headers';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { getCurrentUser } from '@/lib/security/auth';

export const runtime = 'nodejs';

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(8).max(100),
  }),
});

/**
 * PushManager.subscribe() çıktısını alır, push_subscriptions'a yazar.
 * Aynı endpoint tekrar gönderilirse user_id + last_used_at güncellenir.
 * Sadece auth'lu kullanıcılar abone olabilir.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: 'auth' }, { status: 401 });

  let parsed: z.infer<typeof subscriptionSchema>;
  try {
    parsed = subscriptionSchema.parse(await req.json());
  } catch {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const hdrs = await headers();
  const userAgent = hdrs.get('user-agent')?.slice(0, 200) ?? null;

  const supabase = getServiceClient();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth_secret: parsed.keys.auth,
      user_agent: userAgent,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) {
    console.error('push subscribe failed:', error);
    return Response.json({ ok: false, error: 'db' }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: 'auth' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return Response.json({ ok: false, error: 'invalid' }, { status: 400 });

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
  if (error) return Response.json({ ok: false, error: 'db' }, { status: 500 });
  return Response.json({ ok: true });
}
