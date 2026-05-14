-- Gamification — rozet sistemi.
-- ============================================================================
-- badges: katalog (admin tarafından düzenlenebilir, ama seed ile başlıyor)
-- user_badges: kullanıcının kazandığı rozetler (her rozet bir kere)
-- Değerlendirme server-side (evaluateAndGrantBadges) — booking/review action
-- sonrası çağırılır. Trigger değil çünkü kategori bilgisi join'li hesaplama
-- gerektiriyor, plpgsql'de karmaşıklaşıyor.

create table public.badges (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  description     text not null,
  emoji           text not null,
  tier            text not null check (tier in ('bronze','silver','gold','platinum')),
  /** Hangi metriğe göre kazanılır */
  criteria_type   text not null check (criteria_type in (
    'booking_count',
    'category_first',
    'category_count',
    'district_count',
    'review_count',
    'favorite_count',
    'streak_weeks'
  )),
  /** Eşik değer (örn. 5 booking, 6 semt) */
  criteria_value  integer not null default 1 check (criteria_value > 0),
  /** category_first / category_count için kategori slug'ı; diğerleri için null */
  criteria_extra  text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index badges_sort_idx on public.badges (sort_order, tier);

create table public.user_badges (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index user_badges_user_idx on public.user_badges (user_id, earned_at desc);

-- RLS — herkes okur (kataloglar + kullanıcı rozetleri public görünür);
-- insert/update yalnız service-role üzerinden (evaluator)
alter table public.badges enable row level security;
create policy badges_select_public on public.badges
  for select to anon, authenticated using (true);

alter table public.user_badges enable row level security;
create policy user_badges_select_public on public.user_badges
  for select to anon, authenticated using (true);

-- ============================================================================
-- Seed: ilk rozet kataloğu (13 rozet)
-- ============================================================================

insert into public.badges (slug, name, description, emoji, tier, criteria_type, criteria_value, criteria_extra, sort_order) values
  -- İlk adımlar
  ('first-booking',     'İlk Adım',          'gidek''te ilk rezervasyonun',                    '🎯', 'bronze',   'booking_count',  1, null,        1),
  ('reviewer-bronze',   'Yorumcu',           'İlk 3 yorumunu yazdın',                          '✍️',  'bronze',   'review_count',   3, null,        2),
  ('collector-bronze',  'Koleksiyoncu',      '10 fırsatı favorilere ekledin',                  '❤️',  'bronze',   'favorite_count', 10, null,       3),

  -- Sadakat
  ('regular',           'Müşteri',           '5 fırsatı tamamladın',                           '⭐', 'silver',   'booking_count',  5, null,        4),
  ('loyal',             'Sadık Dost',        '15 fırsatı tamamladın',                          '💎', 'gold',     'booking_count', 15, null,        5),
  ('legend',            'Efsane',            '50 fırsatı tamamladın — gidek''in efsanesisin', '👑', 'platinum', 'booking_count', 50, null,        6),

  -- Kategori ustaları
  ('theater-master',    'Tiyatro Sevdalısı', '5 tiyatro fırsatı tamamladın',                   '🎭', 'silver',   'category_count', 5, 'tiyatro',  10),
  ('brunch-master',     'Brunch Ustası',     '5 kahvaltı fırsatı tamamladın',                  '🥐', 'silver',   'category_count', 5, 'kahvalti', 11),
  ('spa-master',        'Spa Keşfedicisi',   '5 masaj/spa fırsatı tamamladın',                 '💆', 'silver',   'category_count', 5, 'masaj',    12),
  ('foodie',            'Yemek Gurmesi',     '10 yemek fırsatı tamamladın',                    '🍷', 'gold',     'category_count', 10, 'yemek',   13),
  ('concert-fan',       'Konser Hayranı',    '5 konser fırsatı tamamladın',                    '🎶', 'silver',   'category_count', 5, 'konser',   14),

  -- Keşif
  ('explorer',          'İstanbul Kâşifi',   '6 farklı semtte rezervasyon yaptın',             '🗺️', 'gold',     'district_count', 6, null,       20),

  -- Streak
  ('streak-3',          'Sıcak Seri',        '3 hafta üst üste aktif kaldın',                  '🔥', 'silver',   'streak_weeks',   3, null,       30);
