-- ============================================================================
-- Nexa — test harness: minimal stand-in for Supabase's managed `auth` schema.
--
-- Loaded ONLY by scripts/test-db.sh against a throwaway Postgres, so the
-- migrations, the RLS policies and the grade views can be exercised for real
-- without a Supabase project. Never applied to a real database.
--
-- It mirrors the pieces the schema depends on:
--   * auth.users            — the FK target of every user_id column
--   * auth.uid()            — reads the impersonated user from a GUC, exactly
--                             like PostgREST sets request.jwt.claim.sub
--   * the three Supabase roles and their default privileges
-- ============================================================================

create extension if not exists pgcrypto;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;

-- Matches Supabase: new objects in public are reachable by the API roles, and
-- RLS — not table grants — is what actually protects the rows.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
