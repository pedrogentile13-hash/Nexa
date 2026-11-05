-- ============================================================================
-- Nexa — Planos (Plus e Pro) para o Nexa padrão
--
-- Duas "casas" no mesmo sistema:
--   · Nexa Escolas (o aluno/equipe vinculados a uma escola): SEM anúncios e SEM plano
--     de pagamento — quem paga é o contrato da escola. A regra é "ter escola".
--   · Nexa padrão (Estudos e Vestibular, sem escola): grátis com anúncios, ou Plus/Pro.
--
-- O Stripe é a fonte da verdade do pagamento. Esta parte só guarda o espelho
-- (`subscriptions`), escrito pelo webhook com a chave de serviço. O app nunca
-- escreve aqui pelo navegador.
-- ============================================================================

-- Cliente do Stripe de cada pessoa (criado no primeiro checkout).
create table if not exists public.billing_customers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
drop policy if exists billing_customers_select_own on public.billing_customers;
create policy billing_customers_select_own on public.billing_customers
  for select to authenticated using (user_id = auth.uid());
-- (Sem policy de escrita: só o webhook/servidor, com a chave de serviço.)

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_subscription_id text not null unique,
  plan text not null check (plan in ('plus', 'pro')),
  billing_interval text check (billing_interval in ('month', 'year')),
  -- Status do Stripe: active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired, paused
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (user_id = auth.uid());

-- Eventos do Stripe já processados (o Stripe reenvia; cada evento vale uma vez só).
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- (Sem policy: só a chave de serviço.)

-- O plano de quem está logado. Escola vence tudo: 'school' = sem anúncios, sem cobrança.
-- Assinatura vale enquanto o Stripe a considera ativa; `past_due` tem carência (o Stripe
-- ainda está tentando cobrar) e acabou o período, volta para grátis.
create or replace function public.my_plan()
returns table (plan text, status text, current_period_end timestamptz, cancel_at_period_end boolean, interval_name text)
language plpgsql stable security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_school uuid;
begin
  if v_me is null then
    return query select 'free'::text, null::text, null::timestamptz, false, null::text;
    return;
  end if;

  select p.school_id into v_school from public.profiles p where p.id = v_me;
  if v_school is not null then
    return query select 'school'::text, null::text, null::timestamptz, false, null::text;
    return;
  end if;

  return query
  select s.plan, s.status, s.current_period_end, s.cancel_at_period_end, s.billing_interval
  from public.subscriptions s
  where s.user_id = v_me
    and (
      s.status in ('active', 'trialing')
      or (s.status = 'past_due' and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
    )
    and (s.current_period_end is null or s.current_period_end > now() - interval '3 days')
  limit 1;

  if not found then
    return query select 'free'::text, null::text, null::timestamptz, false, null::text;
  end if;
end;
$$;

grant execute on function public.my_plan() to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
