-- Amber — Family Tree migration
-- Run in Supabase SQL Editor after schema.sql.

create table if not exists public.family_members (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  name           text not null,
  relationship   text,
  parent_id      uuid references public.family_members on delete set null,
  partner_name   text,
  birth_year     text,
  death_year     text,
  note           text,
  beneficiary_id uuid references public.beneficiaries on delete set null,
  content_ids    uuid[] not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists idx_family_user on public.family_members(user_id);

alter table public.family_members enable row level security;
drop policy if exists "family_owner" on public.family_members;
create policy "family_owner" on public.family_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
