-- Amber — Admin dashboard migration
-- Run in Supabase SQL Editor after schema.sql (and migration_ai.sql / migration_family.sql
-- if you've enabled those). Adds an admin flag and the indexes the /admin dashboard's
-- growth-over-time queries need. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Admin flag
-- ---------------------------------------------------------------------------
-- Deliberately a separate column from `role` (schema-inheritance.sql), which means
-- creator | beneficiary | executor | advisor — a different concept from "can see the
-- admin dashboard". No RLS policy is added for this column: the dashboard reads through
-- a server-only service-role client (see lib/supabase/admin.ts), never through the
-- browser anon key, so admin-only data is never exposed by relaxing row-level security.

alter table public.profiles add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- Indexes the dashboard's time-series queries rely on (created_at is already the
-- natural sort key everywhere; these make "signups per day" / "items per day" fast
-- once you have more than a trivial number of rows).
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_created_at on public.profiles(created_at);
create index if not exists idx_content_created_at on public.content_items(created_at);
create index if not exists idx_messages_created_at on public.scheduled_messages(created_at);

-- ai_interactions only exists if you ran migration_ai.sql — index it too when present.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ai_interactions') then
    execute 'create index if not exists idx_ai_interactions_created_at on public.ai_interactions(created_at)';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Make yourself an admin. Run this once, with your own account's email:
-- ---------------------------------------------------------------------------
-- update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@theamberapp.com');
