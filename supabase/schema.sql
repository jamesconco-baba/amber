-- Voice Beyond Time — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where practical).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text,
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.beneficiaries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  name          text not null,
  relationship  text,
  email         text,
  birthday      date,
  created_at    timestamptz not null default now()
);

create table if not exists public.content_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  type            text not null,               -- voice | video | photo | document | letter
  title           text not null,
  note            text,
  transcript      text,
  tags            text[] not null default '{}',
  beneficiary_ids uuid[] not null default '{}',
  prompt_id       text,
  media_path      text,                        -- path in the 'vault' storage bucket
  media_mime      text,
  media_filename  text,
  media_duration  integer,
  created_at      timestamptz not null default now()
);

create table if not exists public.scheduled_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  content_id    uuid references public.content_items on delete set null,
  title         text not null,
  note          text,
  beneficiary_id uuid references public.beneficiaries on delete set null,
  trigger       text not null,                 -- immediate | date | milestone
  release_date  date,
  milestone     text,
  status        text not null default 'scheduled', -- draft | scheduled | delivered
  created_at    timestamptz not null default now()
);

create index if not exists idx_beneficiaries_user on public.beneficiaries(user_id);
create index if not exists idx_content_user on public.content_items(user_id);
create index if not exists idx_messages_user on public.scheduled_messages(user_id);

-- ---------------------------------------------------------------------------
-- Row-level security: every row is private to its owner
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.beneficiaries     enable row level security;
alter table public.content_items     enable row level security;
alter table public.scheduled_messages enable row level security;

-- profiles keyed by the auth user id
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "beneficiaries_owner" on public.beneficiaries;
create policy "beneficiaries_owner" on public.beneficiaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "content_owner" on public.content_items;
create policy "content_owner" on public.content_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages_owner" on public.scheduled_messages;
create policy "messages_owner" on public.scheduled_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for media (private) + per-user folder policies
-- Files are stored under: vault/<user_id>/<uuid>.<ext>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

drop policy if exists "vault_read_own" on storage.objects;
create policy "vault_read_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vault_insert_own" on storage.objects;
create policy "vault_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vault_update_own" on storage.objects;
create policy "vault_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "vault_delete_own" on storage.objects;
create policy "vault_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Auto-create an empty profile row when a user signs up (optional convenience)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
