
-- Status enum
create type public.access_status as enum ('active', 'refunded', 'chargeback', 'manual_revoked');

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status public.access_status not null default 'active',
  order_id text,
  source text default 'yampi',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index access_grants_email_idx on public.access_grants (lower(email));

alter table public.access_grants enable row level security;

-- The logged-in user can read their own grant (matched by email)
create policy "Users can view their own access grant"
on public.access_grants
for select
to authenticated
using (lower(email) = lower((auth.jwt() ->> 'email')));

-- No client-side writes; only edge functions (service role) can write.

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger access_grants_set_updated_at
before update on public.access_grants
for each row execute function public.set_updated_at();
