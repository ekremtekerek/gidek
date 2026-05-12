-- ============================================================================
-- match_deals: deals × merchants join'i ile lat/lng döner. AI sonuçları
-- haritada pinlenebilir olsun diye return tablosuna iki kolon eklendi.
-- CREATE OR REPLACE return type değiştirmeyi engellediği için önce DROP.
-- ============================================================================

drop function if exists public.match_deals(extensions.vector(768), integer, text);

create or replace function public.match_deals(
  query_embedding extensions.vector(768),
  match_count integer default 20,
  filter_city text default null
)
returns table (
  id               uuid,
  slug             text,
  title            text,
  subtitle         text,
  description      text,
  cover_image      text,
  city             text,
  district         text,
  venue_name       text,
  duration_minutes integer,
  original_price   numeric,
  discounted_price numeric,
  discount_percent integer,
  audience         text[],
  tags             text[],
  lat              numeric,
  lng              numeric,
  similarity       real
)
language sql
stable
security invoker
set search_path = ''
as $$
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
    (1 - (d.embedding operator(extensions.<=>) query_embedding))::real as similarity
  from public.deals d
  inner join public.merchants m on m.id = d.merchant_id
  where d.is_active
    and d.published_at is not null
    and d.published_at <= now()
    and d.valid_until > now()
    and d.embedding is not null
    and (filter_city is null or d.city = filter_city)
  order by d.embedding operator(extensions.<=>) query_embedding
  limit greatest(1, least(match_count, 50))
$$;

revoke all on function public.match_deals(extensions.vector(768), integer, text) from public;
grant execute on function public.match_deals(extensions.vector(768), integer, text)
  to anon, authenticated, service_role;
