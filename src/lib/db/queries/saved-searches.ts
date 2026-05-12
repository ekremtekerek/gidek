import 'server-only';
import { getServerClient } from '@/lib/db/server';
import type { Database } from '@/types/supabase';

export type SavedSearch = Database['public']['Tables']['saved_searches']['Row'];

/** Auth'lu kullanıcının kaydettiği AI sorguları, en yeniden eskiye. */
export async function listSavedSearches(): Promise<SavedSearch[]> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}
