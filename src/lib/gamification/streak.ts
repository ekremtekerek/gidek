import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Streak (haftalık aktiflik serisi) güncelleme.
 *
 * ISO hafta etiketi (`YYYY-Www`) ile kullanıcının son aktivite haftasını
 * tutuyoruz. Bir aktivite (booking confirm, review yazma) gerçekleşince:
 *   - Aynı hafta → streak değişmez (zaten o hafta aktif sayılıyor)
 *   - Bir önceki hafta → streak +1 (seriye devam)
 *   - Daha eski → streak = 1 (seri sıfırlandı, yeniden başladı)
 *
 * Fire-and-forget olarak çağırılır.
 *
 * @returns Güncel streak değeri (yeni veya değişmemiş)
 */
export async function updateStreak(userId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_weeks, streak_last_week')
    .eq('id', userId)
    .maybeSingle();

  const currentWeek = isoWeekTag(new Date());
  const lastWeek = profile?.streak_last_week ?? null;
  const currentStreak = profile?.streak_weeks ?? 0;

  let nextStreak: number;
  if (!lastWeek) {
    nextStreak = 1;
  } else if (lastWeek === currentWeek) {
    return currentStreak; // aynı hafta, güncelleme yok
  } else if (lastWeek === isoWeekTag(addWeeks(parseIsoWeek(currentWeek), -1))) {
    nextStreak = currentStreak + 1;
  } else {
    nextStreak = 1; // gap
  }

  await supabase
    .from('profiles')
    .update({ streak_weeks: nextStreak, streak_last_week: currentWeek })
    .eq('id', userId);

  return nextStreak;
}

/**
 * ISO 8601 hafta etiketi — "YYYY-Www" (ör. "2026-W19").
 * Pazartesi haftanın 1. günü; Perşembe günü yılı belirler (ISO kuralı).
 */
function isoWeekTag(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Pazartesi=1 ... Pazar=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Perşembe
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function parseIsoWeek(tag: string): Date {
  const m = /^(\d{4})-W(\d{2})$/.exec(tag);
  if (!m) return new Date();
  const year = Number(m[1]);
  const week = Number(m[2]);
  // ISO haftanın ilk Perşembe günü
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d;
}
