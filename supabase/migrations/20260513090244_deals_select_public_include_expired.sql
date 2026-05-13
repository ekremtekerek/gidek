-- Public SELECT artık sona ermiş / deaktive edilmiş ama bir kez yayınlanmış
-- fırsatları da görsün — /gecmis-firsatlar arşiv sayfası, /f/[slug] detail
-- "Bu fırsat kaçtı" UI'sı, sitemap.xml ve diğer SEO ihtiyaçları için.
--
-- Aktif/expired ayrımı artık sorgu seviyesinde (`status` parametresi) yapılır;
-- RLS yalnızca taslak (published_at NULL) ve hiç yayınlanmamış kayıtları
-- gizler.
drop policy if exists deals_select_public on public.deals;

create policy deals_select_public on public.deals
  for select
  to anon, authenticated
  using (
    published_at is not null
    and published_at <= now()
  );
