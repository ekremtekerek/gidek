-- ============================================================================
-- merchants.working_hours — çalışma saatleri
-- ============================================================================
--
-- Şema:
--   {
--     "mon": [{"open": "09:00", "close": "23:00"}],
--     "tue": [...],
--     ...
--     "sun": [{"open": "11:00", "close": "20:00"}]
--   }
--
-- Birden fazla aralık desteklenir (öğle arası vb.). Bir gün boş array →
-- o gün kapalı. Null → bilgi yok (UI "—" gösterir).

alter table public.merchants
  add column if not exists working_hours jsonb;

create index merchants_working_hours_idx on public.merchants
  using gin (working_hours) where working_hours is not null;
