-- ============================================================================
-- coupons — promo kod sistemi
-- ============================================================================
--
-- V1 mock akış için pratik bir kupon altyapısı: yüzde veya sabit indirim,
-- min sepet, max kullanım, geçerlilik penceresi. Yorumda da yansıdığı üzere
-- gerçek ödeme entegrasyonu sonrası "tahsilat sonrası kullanım sayar" şekline
-- evrilecek. Şimdilik 'pending → confirmed' anında sayıyoruz; iptal halinde
-- geri alıyoruz.

create table public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null,
  description       text,
  discount_type     text not null check (discount_type in ('percent','fixed')),
  discount_value    numeric(10,2) not null check (discount_value >= 0),
  min_order_amount  numeric(10,2) not null default 0 check (min_order_amount >= 0),
  max_uses          integer check (max_uses is null or max_uses > 0),
  used_count        integer not null default 0 check (used_count >= 0),
  valid_from        timestamptz not null default now(),
  valid_until       timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Kod büyük harfe normalize edilmiş hâliyle unique olur — UI ne yazarsa yazsın
-- arama tek anlama gelir.
create unique index coupons_code_unique on public.coupons (upper(code));
create index coupons_active_idx on public.coupons (is_active, valid_until);

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- bookings.coupon_id + indirim tutarı
alter table public.bookings
  add column if not exists coupon_id uuid references public.coupons(id) on delete set null,
  add column if not exists discount_amount numeric(10,2) not null default 0
    check (discount_amount >= 0);

create index if not exists bookings_coupon_idx on public.bookings (coupon_id)
  where coupon_id is not null;

-- RLS: yalnız service-role + RPC. Doğrudan SELECT yok — kuponu öğrenmenin
-- tek yolu validate_coupon() çağrısı.
alter table public.coupons enable row level security;
-- (no policies — service_role bypasses RLS)

-- ----------------------------------------------------------------------------
-- validate_coupon: kullanıcının verdiği kodu/sepet tutarını alır, kuponun
-- geçerli olup olmadığını döner. İşletim mantığı:
--   - kod büyük harfe normalize edilir
--   - is_active = true
--   - valid_from <= now() and (valid_until is null or valid_until > now())
--   - max_uses null veya used_count < max_uses
--   - min_order_amount karşılanmış
-- İndirim hesabı:
--   - percent: amount * value / 100 (amount'u geçemez)
--   - fixed:   value (amount'u geçemez)
-- ----------------------------------------------------------------------------

create or replace function public.validate_coupon(
  p_code   text,
  p_amount numeric
)
returns table (
  coupon_id        uuid,
  discount_amount  numeric,
  reason           text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coupon public.coupons%rowtype;
  v_normalized text := upper(trim(coalesce(p_code, '')));
  v_discount   numeric(10,2);
begin
  if v_normalized = '' then
    coupon_id := null; discount_amount := 0; reason := 'empty';
    return next; return;
  end if;

  select * into v_coupon
    from public.coupons
   where upper(code) = v_normalized
   limit 1;

  if v_coupon.id is null then
    coupon_id := null; discount_amount := 0; reason := 'not_found';
    return next; return;
  end if;
  if not v_coupon.is_active then
    coupon_id := null; discount_amount := 0; reason := 'inactive';
    return next; return;
  end if;
  if v_coupon.valid_from > now() then
    coupon_id := null; discount_amount := 0; reason := 'not_started';
    return next; return;
  end if;
  if v_coupon.valid_until is not null and v_coupon.valid_until <= now() then
    coupon_id := null; discount_amount := 0; reason := 'expired';
    return next; return;
  end if;
  if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
    coupon_id := null; discount_amount := 0; reason := 'max_uses';
    return next; return;
  end if;
  if p_amount < v_coupon.min_order_amount then
    coupon_id := null; discount_amount := 0; reason := 'min_amount';
    return next; return;
  end if;

  if v_coupon.discount_type = 'percent' then
    v_discount := round((p_amount * v_coupon.discount_value / 100)::numeric, 2);
  else
    v_discount := v_coupon.discount_value;
  end if;
  if v_discount > p_amount then v_discount := p_amount; end if;

  coupon_id := v_coupon.id;
  discount_amount := v_discount;
  reason := 'ok';
  return next;
end;
$$;

revoke all on function public.validate_coupon(text, numeric) from public;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- confirm_booking_payment — kuponlu booking onaylanınca used_count + 1.
-- cancel_booking — confirmed kupon iptal edilirse used_count - 1.
-- ----------------------------------------------------------------------------

create or replace function public.confirm_booking_payment(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller  uuid := (select auth.uid());
  v_current public.bookings;
  v_result  public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_current
    from public.bookings
   where id = p_booking_id
     and user_id = v_caller;

  if v_current.id is null then
    raise exception 'booking not found' using errcode = 'P0002';
  end if;

  if v_current.status = 'confirmed' then
    return v_current;
  end if;

  if v_current.status <> 'pending' then
    raise exception 'booking not payable in status %', v_current.status
      using errcode = 'P0001';
  end if;

  update public.bookings
     set status = 'confirmed',
         updated_at = now()
   where id = p_booking_id
     and user_id = v_caller
     and status = 'pending'
  returning * into v_result;

  update public.deals
     set sold_count = sold_count + v_result.quantity
   where id = v_result.deal_id;

  if v_result.coupon_id is not null then
    update public.coupons
       set used_count = used_count + 1
     where id = v_result.coupon_id;
  end if;

  return v_result;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller     uuid := (select auth.uid());
  v_prev_row   public.bookings;
  v_result     public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_prev_row
    from public.bookings
   where id = p_booking_id
     and user_id = v_caller;

  update public.bookings
     set status = 'cancelled',
         updated_at = now()
   where id = p_booking_id
     and user_id = v_caller
     and status in ('confirmed','pending')
  returning * into v_result;

  if v_result.id is null then
    raise exception 'booking not found or not cancellable' using errcode = 'P0002';
  end if;

  if v_prev_row.status = 'confirmed' then
    update public.deals
       set sold_count = greatest(0, sold_count - v_result.quantity)
     where id = v_result.deal_id;

    if v_result.coupon_id is not null then
      update public.coupons
         set used_count = greatest(0, used_count - 1)
       where id = v_result.coupon_id;
    end if;
  end if;

  return v_result;
end;
$$;
