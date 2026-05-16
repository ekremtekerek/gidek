-- match_deals.filter_city — kullanıcı "Bodrum" derken AI city='Bodrum'
-- gönderiyor ama DB'de Bodrum aslında Muğla'nın bir district'i. Eski
-- `d.city = filter_city` exact match 0 sonuç döndürüyordu, AI da bağlamdaki
-- aktif şehre düşüp İstanbul önerilerini sergiliyordu. Fix:
--   - case-insensitive (`ilike`) — "bodrum"/"Bodrum"/"BODRUM" hepsi geçer
--   - district eşleşmesi de eklendi (Bodrum/Yalıkavak/Türkbükü vb.)

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
      and (
        filter_city is null
        OR d.city ilike filter_city
        OR d.district ilike filter_city
      )
    order by d.embedding operator(extensions.<=>) query_embedding
    limit greatest(1, least(match_count, 50)) * 3
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
      else (s.similarity * 0.7) + (greatest(0, 50 - coalesce(s.distance_km, 50)) / 50 * 0.3)
    end desc
  limit greatest(1, least(match_count, 50));
$$;
