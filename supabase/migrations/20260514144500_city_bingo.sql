-- ============================================================================
-- city bingo — şehir keşif rozeti + tek seferlik kupon
-- ============================================================================
--
-- Bir kullanıcı aynı şehirde 5 farklı ilçeden onaylanmış/kullanılmış booking
-- yaptığında "şehir bingosu" tamamlanır ve özel bir tek-kullanımlık %15 indirim
-- kuponu kazanır. Her şehir başına yalnız bir kez verilir.

create extension if not exists unaccent with schema extensions;

create table public.user_city_bingos (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  city           text not null,
  coupon_code    text not null,
  district_count integer not null,
  claimed_at     timestamptz not null default now(),
  primary key (user_id, city)
);

create index user_city_bingos_user_idx on public.user_city_bingos (user_id);

alter table public.user_city_bingos enable row level security;

-- Kullanıcı sadece kendi bingo'larını okuyabilir; yazma yalnız RPC'den.
create policy "city_bingos: self read"
  on public.user_city_bingos
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- claim_city_bingo: belirli bir şehir için bingo'yu değerlendirir.
--   1. Daha önce claim varsa mevcut kodu dön (idempotent)
--   2. Yoksa kullanıcının o şehirdeki confirmed/used booking'lerindeki
--      distinct district sayısını ölç
--   3. >= 5 ise: tek-kullanımlık %15 kupon oluştur, claim'i kaydet, kod dön
--   4. Aksi halde null dön
-- ----------------------------------------------------------------------------

create or replace function public.claim_city_bingo(p_user_id uuid, p_city text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller          uuid := p_user_id;
  v_existing_code   text;
  v_district_count  integer;
  v_new_code        text;
  v_new_coupon_id   uuid;
  v_city            text := nullif(trim(p_city), '');
begin
  if v_caller is null then
    raise exception 'user id required' using errcode = '42501';
  end if;
  if v_city is null then
    return null;
  end if;

  select coupon_code into v_existing_code
    from public.user_city_bingos
   where user_id = v_caller and city = v_city;
  if v_existing_code is not null then
    return v_existing_code;
  end if;

  select count(distinct d.district) into v_district_count
    from public.bookings b
    join public.deals    d on d.id = b.deal_id
   where b.user_id = v_caller
     and b.status in ('confirmed','used')
     and d.city = v_city
     and d.district is not null
     and length(trim(d.district)) > 0;

  if coalesce(v_district_count, 0) < 5 then
    return null;
  end if;

  -- BINGO-<CITY_ASCII>-<6char>
  v_new_code := 'BINGO-' ||
                upper(regexp_replace(extensions.unaccent(v_city), '[^A-Za-z0-9]', '', 'g')) ||
                '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.coupons (
    code, description, discount_type, discount_value,
    min_order_amount, max_uses, valid_from, valid_until, is_active
  ) values (
    v_new_code,
    'Şehir bingosu ödülü — ' || v_city || ' (5 farklı ilçeyi keşfettin)',
    'percent', 15,
    0, 1,
    now(), now() + interval '60 days',
    true
  )
  returning id into v_new_coupon_id;

  insert into public.user_city_bingos (user_id, city, coupon_code, district_count)
    values (v_caller, v_city, v_new_code, v_district_count);

  return v_new_code;
end;
$$;

revoke all on function public.claim_city_bingo(uuid, text) from public;
-- Service-role'den çağrılacak (post-confirm fire-and-forget). Kullanıcı doğrudan
-- çağırırsa istenmedik claim mümkün olur — authenticated'a grant verme.

-- ----------------------------------------------------------------------------
-- bingo_progress_for_user — UI için: tüm şehirler ve mevcut ilçe sayıları.
-- Sadece kullanıcının booking'i olduğu şehirleri döner.
-- ----------------------------------------------------------------------------

create or replace function public.bingo_progress_for_user(p_user_id uuid)
returns table (
  city            text,
  districts       text[],
  district_count  integer,
  claimed         boolean,
  coupon_code     text
)
language sql
security definer
set search_path = ''
as $$
  with visits as (
    select d.city,
           array_agg(distinct d.district)
             filter (where d.district is not null and length(trim(d.district)) > 0)
             as districts
      from public.bookings b
      join public.deals    d on d.id = b.deal_id
     where b.user_id = p_user_id
       and b.status in ('confirmed','used')
       and d.city is not null
       and length(trim(d.city)) > 0
     group by d.city
  )
  select v.city,
         v.districts,
         coalesce(array_length(v.districts, 1), 0) as district_count,
         (c.coupon_code is not null) as claimed,
         c.coupon_code
    from visits v
    left join public.user_city_bingos c
      on c.user_id = p_user_id and c.city = v.city
   order by 3 desc, v.city asc;
$$;

revoke all on function public.bingo_progress_for_user(uuid) from public;
grant execute on function public.bingo_progress_for_user(uuid) to authenticated;
