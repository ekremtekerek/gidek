-- ============================================================================
-- loyalty_rewards — eşik bazlı otomatik kupon ödülleri
-- ============================================================================
--
-- Kullanıcı belirli puan eşiklerine ulaştığında otomatik tek-kullanımlık
-- kupon kazanır. Idempotent: aynı eşik için ikinci kez verme.
--
-- Eşikler (puan → kupon yüzdesi, geçerlilik gün):
--   100  → %10, 30 gün
--   250  → %15, 30 gün
--   500  → %20, 30 gün
--   1000 → %25, 60 gün

create table public.user_loyalty_rewards (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  threshold   integer not null,
  coupon_code text not null,
  granted_at  timestamptz not null default now(),
  primary key (user_id, threshold)
);

create index user_loyalty_rewards_user_idx on public.user_loyalty_rewards (user_id);

alter table public.user_loyalty_rewards enable row level security;

create policy "loyalty_rewards: self read"
  on public.user_loyalty_rewards
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- evaluate_loyalty_rewards — kullanıcının mevcut puanına göre hak ettiği
-- eşikleri tarar, henüz verilmediyse kupon yaratır ve kayıt ekler.
-- Servis-rol'den (post-confirm hook) çağrılır.
-- ----------------------------------------------------------------------------

create or replace function public.evaluate_loyalty_rewards(p_user_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_points    integer;
  v_thresh    integer;
  v_existing  integer;
  v_code      text;
  v_pct       integer;
  v_days      integer;
  v_granted   text[] := '{}';
  v_thresholds integer[] := array[100, 250, 500, 1000];
begin
  if p_user_id is null then
    return v_granted;
  end if;

  select loyalty_points into v_points
    from public.profiles
   where id = p_user_id;
  if v_points is null then return v_granted; end if;

  foreach v_thresh in array v_thresholds loop
    if v_points >= v_thresh then
      select 1 into v_existing
        from public.user_loyalty_rewards
       where user_id = p_user_id and threshold = v_thresh;
      if v_existing is null then
        v_pct  := case v_thresh
                    when 100  then 10
                    when 250  then 15
                    when 500  then 20
                    when 1000 then 25
                  end;
        v_days := case when v_thresh >= 1000 then 60 else 30 end;
        v_code := 'LOYAL' || v_thresh || '-' ||
                  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

        insert into public.coupons (
          code, description, discount_type, discount_value,
          min_order_amount, max_uses, valid_from, valid_until, is_active
        ) values (
          v_code,
          'Sadakat ödülü — ' || v_thresh || ' puan eşiği',
          'percent', v_pct,
          0, 1,
          now(), now() + (v_days || ' days')::interval,
          true
        );

        insert into public.user_loyalty_rewards (user_id, threshold, coupon_code)
          values (p_user_id, v_thresh, v_code);

        v_granted := array_append(v_granted, v_code);
      end if;
      v_existing := null;
    end if;
  end loop;

  return v_granted;
end;
$$;

revoke all on function public.evaluate_loyalty_rewards(uuid) from public;
