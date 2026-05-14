-- bookings tablosuna admin operasyon alanları:
--   admin_notes        — operasyon ekibinin kayıt ettiği serbest metin
--   cancelled_by_admin_at — admin tarafından iptalin zaman damgası
--   refunded_at        — admin'in iadeyi mock olarak işaretlediği an
--
-- V1 mock olduğu için "refund" gerçek tahsilat geri çekmesi değil; sadece
-- operasyon panelinde gözükecek bir bilgi etiketi.

alter table public.bookings
  add column if not exists admin_notes text,
  add column if not exists cancelled_by_admin_at timestamptz,
  add column if not exists refunded_at timestamptz;
