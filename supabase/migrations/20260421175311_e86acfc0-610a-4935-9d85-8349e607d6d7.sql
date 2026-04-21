
alter table public.access_grants
  add column if not exists plan text,
  add column if not exists amount numeric(10,2),
  add column if not exists product_name text;
