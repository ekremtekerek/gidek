import 'server-only';
import { getServerClient } from '@/lib/db/server';
import type { Database } from '@/types/supabase';

export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type ConversationMessageRow =
  Database['public']['Tables']['conversation_messages']['Row'];

/** Caller'ın sohbet listesi, en yenisi üstte. RLS otomatik scope. */
export async function listConversations(): Promise<ConversationRow[]> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConversationRow[];
}

export interface ConversationWithMessages {
  conversation: ConversationRow;
  messages: ConversationMessageRow[];
}

/**
 * Tek sohbet + tüm mesajları. Caller sahibi değilse RLS null döndürür,
 * burada null/null aktarıyoruz; sayfa not-found gösterir.
 */
export async function getConversationWithMessages(
  id: string,
): Promise<ConversationWithMessages | null> {
  const supabase = await getServerClient();
  const { data: conv, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !conv) return null;

  const { data: msgs, error: mErr } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });
  if (mErr) return null;

  return {
    conversation: conv as ConversationRow,
    messages: (msgs ?? []) as ConversationMessageRow[],
  };
}
