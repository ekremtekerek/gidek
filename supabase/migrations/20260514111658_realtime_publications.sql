-- Supabase Realtime — kullanmak istediğimiz tablolar publication'a eklenir.
-- bookings: admin + merchant panel'lerin canlı güncellemesi için.
-- Presence (viewers) DB'ye dokunmuyor; sadece broadcast/presence channel.

do $$
begin
  -- bookings'in publication'da olduğundan emin ol
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;
