import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import type { Database } from '@/types/supabase';

export type Category = Database['public']['Tables']['categories']['Row'];

export async function listRootCategories(): Promise<Category[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listActiveCategorySlugs(): Promise<string[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true)
    .is('parent_id', null);

  if (error) throw error;
  return (data ?? []).map((row) => row.slug);
}
