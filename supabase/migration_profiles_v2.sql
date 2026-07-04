-- Amber — profile photos, member details, and consent
-- Run in the Supabase SQL Editor after the earlier migrations.

alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists consent_at  timestamptz;

alter table public.beneficiaries
  add column if not exists avatar_path text,
  add column if not exists notes       text;
