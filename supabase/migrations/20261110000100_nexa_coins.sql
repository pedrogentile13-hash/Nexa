-- ============================================================================
-- Nexa Coin — a moeda de uso da IA
--
-- Cada ação de IA custa moedas (conversa 1, resumo 4, quiz 6, redação básica 8, redação PRO 30…).
-- Cada plano traz um saldo por mês. O custo e o saldo moram no app (`src/lib/ai/coins.ts`), como os limites antigos:
-- esta tabela só CONTA, de forma atômica, e o banco nunca deixa o gasto passar do saldo.
-- O "mês" é o de São Paulo. A função de gasto devolve só o que a pessoa pode ver (o próprio saldo).
--
-- Também guarda as REDAÇÕES DE REFERÊNCIA que calibram o corretor PRO (redações reais corrigidas, cadastradas pelo admin).
-- ============================================================================

create table if not exists public.ai_coin_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  period date not null,
  feature text not null check (length(feature) between 1 and 40),
  coins integer not null default 0 check (coins >= 0),
  uses integer not null default 0 check (uses >= 0),
  primary key (user_id, period, feature)
);

alter table public.ai_coin_usage enable row level security;

drop policy if exists ai_coin_usage_select_own on public.ai_coin_usage;
create policy ai_coin_usage_select_own on public.ai_coin_usage
  for select to authenticated using (user_id = auth.uid());
-- (Sem policy de escrita: só as funções abaixo gravam.)

create or replace function public.spend_ai_coins(p_feature text, p_cost integer, p_allowance integer)
returns table (allowed boolean, spent integer, remaining integer)
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_period date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  v_spent integer;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_cost is null or p_cost < 1 or p_cost > 1000 or p_allowance is null or p_allowance < 1 or p_allowance > 1000000 then
    raise exception 'valores inválidos' using errcode = '22023';
  end if;

  -- Dois cliques ao mesmo tempo não passam do saldo: a conta da pessoa é feita em fila.
  perform pg_advisory_xact_lock(hashtext('ai_coins:' || v_me::text));

  select coalesce(sum(coins), 0)::integer into v_spent from public.ai_coin_usage where user_id = v_me and period = v_period;
  if v_spent + p_cost > p_allowance then
    return query select false, v_spent, greatest(p_allowance - v_spent, 0);
    return;
  end if;

  insert into public.ai_coin_usage (user_id, period, feature, coins, uses)
  values (v_me, v_period, p_feature, p_cost, 1)
  on conflict (user_id, period, feature)
  do update set coins = public.ai_coin_usage.coins + p_cost, uses = public.ai_coin_usage.uses + 1;

  return query select true, v_spent + p_cost, p_allowance - (v_spent + p_cost);
end;
$$;

-- Devolve as moedas quando a IA falha: a pessoa não paga por resposta que não veio.
create or replace function public.refund_ai_coins(p_feature text, p_cost integer)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_period date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_cost is null or p_cost < 1 or p_cost > 1000 then
    raise exception 'valores inválidos' using errcode = '22023';
  end if;
  update public.ai_coin_usage
  set coins = greatest(coins - p_cost, 0), uses = greatest(uses - 1, 0)
  where user_id = v_me and period = v_period and feature = p_feature;
end;
$$;

-- Extrato do mês: quanto foi gasto no total e por recurso.
create or replace function public.my_ai_coin_usage()
returns table (feature text, coins integer, uses integer)
language sql stable security definer set search_path = public as $$
  select u.feature, u.coins, u.uses
  from public.ai_coin_usage u
  where u.user_id = auth.uid()
    and u.period = date_trunc('month', now() at time zone 'America/Sao_Paulo')::date
  order by u.coins desc;
$$;

grant execute on function public.spend_ai_coins(text, integer, integer) to authenticated;
grant execute on function public.refund_ai_coins(text, integer) to authenticated;
grant execute on function public.my_ai_coin_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- Redações de referência do corretor PRO (calibração com redações reais já corrigidas)
-- ---------------------------------------------------------------------------
create table if not exists public.essay_references (
  id uuid primary key default gen_random_uuid(),
  banca text not null default 'ENEM' check (length(btrim(banca)) between 1 and 60),
  theme text not null check (length(btrim(theme)) between 3 and 300),
  essay text not null check (length(essay) between 200 and 12000),
  c1 smallint not null check (c1 in (0, 40, 80, 120, 160, 200)),
  c2 smallint not null check (c2 in (0, 40, 80, 120, 160, 200)),
  c3 smallint not null check (c3 in (0, 40, 80, 120, 160, 200)),
  c4 smallint not null check (c4 in (0, 40, 80, 120, 160, 200)),
  c5 smallint not null check (c5 in (0, 40, 80, 120, 160, 200)),
  total smallint generated always as (c1 + c2 + c3 + c4 + c5) stored,
  source text check (source is null or length(source) <= 300),
  notes text check (notes is null or length(notes) <= 1500),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists essay_references_banca_idx on public.essay_references (banca, is_active, total desc);

alter table public.essay_references enable row level security;

-- Só o administrador lê e escreve: o aluno nunca vê as redações usadas para calibrar a correção.
drop policy if exists essay_references_admin on public.essay_references;
create policy essay_references_admin on public.essay_references
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- O corretor roda com a sessão do aluno, então a leitura passa por esta função: devolve
-- até 3 referências da banca (mais perto da nota alvo primeiro), sem identificar nada do cadastro.
create or replace function public.essay_calibration(p_banca text, p_limit integer default 2)
returns table (theme text, essay text, c1 smallint, c2 smallint, c3 smallint, c4 smallint, c5 smallint, total smallint, notes text)
language sql stable security definer set search_path = public as $$
  select r.theme, r.essay, r.c1, r.c2, r.c3, r.c4, r.c5, r.total, r.notes
  from public.essay_references r
  where r.is_active
    and (lower(r.banca) = lower(coalesce(nullif(btrim(p_banca), ''), 'ENEM')) or lower(r.banca) = 'enem')
  order by (lower(r.banca) = lower(coalesce(nullif(btrim(p_banca), ''), 'ENEM'))) desc, r.total desc, r.created_at
  limit least(greatest(coalesce(p_limit, 2), 1), 3);
$$;

grant execute on function public.essay_calibration(text, integer) to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
