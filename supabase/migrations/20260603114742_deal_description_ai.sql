-- Affiliate açıklamaları SEO için AI ile yeniden yazılır (duplike içerik riskini
-- azaltmak). Bu bayrak, bir deal'ın açıklamasının özgünleştirilmiş olup olmadığını
-- işaretler — sync idempotent kalsın: zaten yeniden yazılmış açıklamayı her
-- senkronda ham API metniyle ezmesin, yeniden AI çağrısı yapmasın.
alter table public.deals
  add column if not exists description_ai boolean not null default false;
