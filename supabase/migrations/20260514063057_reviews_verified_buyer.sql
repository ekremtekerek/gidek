-- Bir kullanıcı bir fırsata yalnızca tek yorum yazabilir. Anon yorumlar
-- (user_id null, ileride iletişim formu vs.) için kısıt yok.
--
-- Asıl "yorum sadece rezervasyon sahibi" kontrolü server action katmanında
-- yapılır; ancak RLS de güvenlik ağı olarak kalır (user_id = auth.uid()).

create unique index if not exists reviews_user_deal_unique
  on public.reviews (user_id, deal_id)
  where user_id is not null;
