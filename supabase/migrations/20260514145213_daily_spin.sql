-- ============================================================================
-- daily spin — günlük şans çarkı
-- ============================================================================
--
-- Her kullanıcı günde 1 kez "çarkı çevirir":
--   * %35 — boş ("yarın tekrar dene")
--   * %25 — 25 puan
--   * %15 — 50 puan
--   * %10 — 100 puan
--   * %8  — %5 indirim kuponu (tek kullanım, 14 gün)
--   * %5  — %10 indirim kuponu (tek kullanım, 14 gün)
--   * %2  — %20 indirim kuponu (tek kullanım, 7 gün)

create table public.user_daily_spins (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  spin_date    date not null default current_date,
  prize_kind   text not null check (prize_kind in ('none','points','coupon')),
  points       integer,
  coupon_code  text,
  coupon_value integer,
  label        text not null,
  spun_at      timestamptz not null default now(),
  primary key (user_id, spin_date)
);

create index user_daily_spins_user_idx on public.user_daily_spins (user_id, spin_date desc);

alter table public.user_daily_spins enable row level security;

create policy "daily_spins: self read"
  on public.user_daily_spins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- spin_daily — kullanıcı için günlük çarkı çevirir.
-- Aynı gün ikinci kez çağrılırsa 'already_spun' hatası fırlatır.
-- ----------------------------------------------------------------------------

create or replace function public.spin_daily(p_user_id uuid)
returns table (
  prize_kind   text,
  points       integer,
  coupon_code  text,
  coupon_value integer,
  label        text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today        date := current_date;
  v_existing     public.user_daily_spins;
  v_roll         numeric;
  v_prize_kind   text;
  v_points       integer;
  v_coupon_code  text;
  v_coupon_value integer;
  v_label        text;
begin
  if p_user_id is null then
    raise exception 'user id required' using errcode = '42501';
  end if;

  select * into v_existing
    from public.user_daily_spins
   where user_id = p_user_id and spin_date = v_today;
  if v_existing.user_id is not null then
    raise exception 'already_spun' using errcode = 'P0001';
  end if;

  v_roll := random();

  if v_roll < 0.35 then
    v_prize_kind := 'none';
    v_label      := 'Yarın tekrar dene';
  elsif v_roll < 0.60 then
    v_prize_kind := 'points'; v_points := 25;
    v_label      := '+25 puan';
  elsif v_roll < 0.75 then
    v_prize_kind := 'points'; v_points := 50;
    v_label      := '+50 puan';
  elsif v_roll < 0.85 then
    v_prize_kind := 'points'; v_points := 100;
    v_label      := '+100 puan';
  elsif v_roll < 0.93 then
    v_prize_kind  := 'coupon'; v_coupon_value := 5;
    v_label       := '%5 indirim kuponu';
  elsif v_roll < 0.98 then
    v_prize_kind  := 'coupon'; v_coupon_value := 10;
    v_label       := '%10 indirim kuponu';
  else
    v_prize_kind  := 'coupon'; v_coupon_value := 20;
    v_label       := '%20 indirim kuponu';
  end if;

  if v_prize_kind = 'coupon' then
    v_coupon_code := 'SPIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.coupons (
      code, description, discount_type, discount_value,
      min_order_amount, max_uses, valid_from, valid_until, is_active
    ) values (
      v_coupon_code,
      'Günlük çark ödülü — ' || v_label,
      'percent', v_coupon_value,
      0, 1, now(),
      case when v_coupon_value >= 20
           then now() + interval '7 days'
           else now() + interval '14 days'
      end,
      true
    );
  elsif v_prize_kind = 'points' then
    update public.profiles
       set loyalty_points = loyalty_points + v_points
     where id = p_user_id;
  end if;

  insert into public.user_daily_spins (
    user_id, spin_date, prize_kind, points, coupon_code, coupon_value, label
  ) values (
    p_user_id, v_today, v_prize_kind, v_points, v_coupon_code, v_coupon_value, v_label
  );

  prize_kind   := v_prize_kind;
  points       := v_points;
  coupon_code  := v_coupon_code;
  coupon_value := v_coupon_value;
  label        := v_label;
  return next;
end;
$$;

revoke all on function public.spin_daily(uuid) from public;
-- Service-role'den çağrılır.
