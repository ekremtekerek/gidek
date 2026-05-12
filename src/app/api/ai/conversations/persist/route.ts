import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { getCurrentUser } from '@/lib/security/auth';

export const dynamic = 'force-dynamic';

const persistSchema = z.object({
  conversationId: z.string().uuid(),
  /** İlk user mesajından otomatik title; sadece conversation yoksa kullanılır. */
  title: z.string().trim().min(1).max(200).optional(),
  message: z.object({
    role: z.enum(['user', 'assistant']),
    parts: z.array(z.unknown()).max(50),
  }),
});

/**
 * Chat akışından bağımsız persistence endpoint'i.
 * - Client her sendMessage öncesi user message için POST atar.
 * - useChat.onFinish callback'i assistant message için POST atar.
 * - Conversation yoksa burada upsert edilir; title da burada set edilir.
 * Anonim kullanıcıda no-op (sessizce 204 döner).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 204 });

  let parsed;
  try {
    parsed = persistSchema.parse(await req.json());
  } catch {
    return Response.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const supabase = await getServerClient();

  // Conversation upsert — ilk mesajda title set, mevcut ise sadece updated_at touch
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', parsed.conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    const fallbackTitle = parsed.title ?? 'Yeni sohbet';
    const { error: insErr } = await supabase.from('conversations').insert({
      id: parsed.conversationId,
      user_id: user.id,
      title: fallbackTitle.slice(0, 200),
    });
    if (insErr) {
      return Response.json({ error: 'Sohbet oluşturulamadı.' }, { status: 500 });
    }
  } else {
    // Sadece updated_at touch — trigger güncelleyecek
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', parsed.conversationId);
  }

  const { error: msgErr } = await supabase.from('conversation_messages').insert({
    conversation_id: parsed.conversationId,
    role: parsed.message.role,
    parts: parsed.message.parts,
  });

  if (msgErr) {
    return Response.json({ error: 'Mesaj kaydedilemedi.' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
