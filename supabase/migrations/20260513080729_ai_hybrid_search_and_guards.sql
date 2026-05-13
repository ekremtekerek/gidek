-- match_deals'a near_lat / near_lng parametreleri ekle.
-- - Koordinat verilirse: cosine similarity + Haversine mesafesinden hibrit skor
--   (0.7 anlam + 0.3 yakınlık). Bostancı'daki bir aramada Beşiktaş'tan önce
--   Bostancı çıksın diye.
-- - Verilmezse: eski davranış (sadece cosine).
create or replace function public.match_deals(
  query_embedding extensions.vector(768),
  match_count int default 5,
  filter_city text default null,
  near_lat double precision default null,
  near_lng double precision default null
)
returns table (
  id uuid,
  slug text,
  title text,
  subtitle text,
  description text,
  cover_image text,
  city text,
  district text,
  venue_name text,
  duration_minutes int,
  original_price numeric,
  discounted_price numeric,
  discount_percent int,
  audience text[],
  tags text[],
  lat double precision,
  lng double precision,
  similarity real,
  distance_km real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with scored as (
    select
      d.id,
      d.slug,
      d.title,
      d.subtitle,
      d.description,
      d.cover_image,
      d.city,
      d.district,
      d.venue_name,
      d.duration_minutes,
      d.original_price,
      d.discounted_price,
      d.discount_percent,
      d.audience,
      d.tags,
      m.lat,
      m.lng,
      (1 - (d.embedding operator(extensions.<=>) query_embedding))::real as similarity,
      -- Haversine km. Koordinat yoksa null; final order'da null skor=0 sayılır.
      case
        when near_lat is null or near_lng is null or m.lat is null or m.lng is null then null
        else (
          2 * 6371 * asin(sqrt(
            power(sin(radians((m.lat - near_lat) / 2)), 2) +
            cos(radians(near_lat)) * cos(radians(m.lat)) *
            power(sin(radians((m.lng - near_lng) / 2)), 2)
          ))
        )::real
      end as distance_km
    from public.deals d
    inner join public.merchants m on m.id = d.merchant_id
    where d.is_active
      and d.published_at is not null
      and d.published_at <= now()
      and d.valid_until > now()
      and d.embedding is not null
      and (filter_city is null or d.city = filter_city)
    order by d.embedding operator(extensions.<=>) query_embedding
    limit greatest(1, least(match_count, 50)) * 3 -- önce geniş çek, sonra hibrit yeniden sırala
  )
  select
    s.id, s.slug, s.title, s.subtitle, s.description, s.cover_image,
    s.city, s.district, s.venue_name, s.duration_minutes,
    s.original_price, s.discounted_price, s.discount_percent,
    s.audience, s.tags, s.lat, s.lng,
    s.similarity, s.distance_km
  from scored s
  order by
    case
      when near_lat is null or near_lng is null then s.similarity
      -- Hibrit: similarity (0..1) + (50 - min(distance, 50)) / 50 (1=yakın, 0=uzak)
      else (s.similarity * 0.7) + (greatest(0, 50 - coalesce(s.distance_km, 50)) / 50 * 0.3)
    end desc
  limit greatest(1, least(match_count, 50));
$$;

-- ai_cache lookup için pgvector index — semantic cache N satırda bile linear
-- scan istemez (ileride büyürse).
create index if not exists ai_cache_embedding_ivfflat
  on public.ai_cache
  using ivfflat (query_embedding extensions.vector_cosine_ops)
  with (lists = 50);

-- query_hash unique olsun ki upsert (onConflict) çalışsın. NULL embedding
-- satırlarını da koruyoruz; hash yine de eşsiz olur.
create unique index if not exists ai_cache_query_hash_uniq
  on public.ai_cache (query_hash);

-- Cache fuzzy lookup — yeni sorgunun vector'ini al, son 24 saat içinde
-- benzerliği threshold üstü olan ilk satırı dön. Aynı niyet farklı kelimelerle
-- gelse de aynı cevabı verebilelim.
create or replace function public.match_ai_cache(
  query_embedding extensions.vector(768),
  threshold real default 0.92
)
returns table (
  id bigint,
  response jsonb,
  hit_count integer,
  created_at timestamptz,
  similarity real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.response,
    c.hit_count,
    c.created_at,
    (1 - (c.query_embedding operator(extensions.<=>) query_embedding))::real as similarity
  from public.ai_cache c
  where c.query_embedding is not null
    and c.expires_at > now()
    and (1 - (c.query_embedding operator(extensions.<=>) query_embedding)) >= threshold
  order by c.query_embedding operator(extensions.<=>) query_embedding
  limit 1;
$$;
