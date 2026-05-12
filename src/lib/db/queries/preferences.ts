import 'server-only';
import { getServiceClient } from '@/lib/db/service';
import type { Database } from '@/types/supabase';

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

/**
 * Fetch a user's preferences via the service-role client so internal pipelines
 * (RAG, recommendations) can read them without depending on the caller's RLS
 * context. The function never throws — missing rows just return null.
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('getUserPreferences failed:', error);
    return null;
  }
  return data;
}

/**
 * Build the short human-readable context string fed to Gemini. Returns null
 * if the user has no useful preferences yet (so we can skip the bullet list
 * in the prompt entirely).
 */
export function summarisePreferences(p: UserPreferences | null): string | null {
  if (!p) return null;

  const parts: string[] = [];

  if (p.household_type) {
    const map: Record<string, string> = {
      single: 'tek yaşıyor',
      couple: 'çift',
      family_with_kids: 'çocuklu aile',
      family_no_kids: 'çocuksuz aile',
      friends: 'arkadaşlarıyla',
    };
    parts.push(map[p.household_type] ?? p.household_type);
  }

  if (p.kids_age_groups && p.kids_age_groups.length > 0) {
    parts.push(`çocuk yaş grupları: ${p.kids_age_groups.join(', ')}`);
  }

  const loc = [p.district, p.city].filter(Boolean).join(', ');
  if (loc) parts.push(`bölge: ${loc}`);

  if (p.budget_min !== null || p.budget_max !== null) {
    const min = p.budget_min !== null ? `${p.budget_min}` : '0';
    const max = p.budget_max !== null ? `${p.budget_max}` : '∞';
    parts.push(`tipik bütçe: ${min}-${max} TL`);
  }

  if (p.interests && p.interests.length > 0) {
    parts.push(`ilgi alanları: ${p.interests.join(', ')}`);
  }

  if (p.dietary && p.dietary.length > 0) {
    parts.push(`beslenme: ${p.dietary.join(', ')}`);
  }

  if (p.dislikes && p.dislikes.length > 0) {
    parts.push(`sevmediği: ${p.dislikes.join(', ')}`);
  }

  if (parts.length === 0) return null;
  return parts.join(' · ');
}
