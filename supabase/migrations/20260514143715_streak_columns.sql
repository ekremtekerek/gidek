-- Streak (haftalık aktiflik serisi) için profil alanları.
-- ============================================================================
-- streak_weeks: art arda kaç haftalık aktif (her hafta booking veya review)
-- streak_last_week: son güncellenen ISO hafta etiketi (YYYY-Www)
--
-- Güncelleme mantığı server-side: bir kullanıcı booking confirm ya da review
-- yazınca lib/gamification/streak.ts çağırılır.

alter table public.profiles
  add column if not exists streak_weeks integer not null default 0
    check (streak_weeks >= 0),
  add column if not exists streak_last_week text;
