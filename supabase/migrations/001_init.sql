-- =====================================================
-- DevPortal – Supabase Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: vjxscunztqeksxaamuxl
-- =====================================================

-- 1. API Keys table (persists user-created keys with RLS)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  key_value text not null,
  masked_key text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  created_at timestamptz default now() not null,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked boolean default false not null
);

alter table public.api_keys enable row level security;

create policy "Users can view own keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- 2. Request history table (powers analytics + sandbox replay)
--    Written by SandboxPage on every executed request.
--    Read by AnalyticsPage to show real call volume, errors, latency.
create table if not exists public.request_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  api_id text not null,
  method text not null,
  url text not null,
  path_params jsonb default '{}',
  query_params jsonb default '{}',
  headers jsonb default '{}',
  body text,
  response_status int,
  response_latency int,
  created_at timestamptz default now() not null
);

alter table public.request_history enable row level security;

create policy "Users can manage own history"
  on public.request_history for all
  using (auth.uid() = user_id);

-- Index for analytics queries (filter by user + api + date)
create index if not exists idx_request_history_user_api_date
  on public.request_history(user_id, api_id, created_at desc);
