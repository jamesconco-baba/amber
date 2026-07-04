-- Amber — AI layer migration
-- Run in Supabase SQL Editor after schema.sql. Adds per-item AI consent.

alter table public.content_items
  add column if not exists ai_consent boolean not null default true;

-- (Optional) log of AI interactions, per the concept doc's AIInteractionLog entity.
create table if not exists public.ai_interactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  role              text not null default 'creator',   -- who asked (creator preview / beneficiary)
  query             text not null,
  answer            text,
  source_ids        uuid[] not null default '{}',
  guardian_status   text,                               -- approved | softened | blocked
  guardian_reason   text,
  created_at        timestamptz not null default now()
);

alter table public.ai_interactions enable row level security;
drop policy if exists "ai_interactions_owner" on public.ai_interactions;
create policy "ai_interactions_owner" on public.ai_interactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
