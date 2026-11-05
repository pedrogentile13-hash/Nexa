-- ============================================================================
-- Nexa — Limite diário de uso da IA, por aluno e por recurso
--
-- Sem teto, um aluno (ou um script) gasta a cota inteira do provedor de IA
-- sozinho — e com uma escola inteira usando, o custo deixa de ser previsível.
-- Esta tabela só CONTA; o limite de cada recurso mora no app e é passado à
-- função, então ajustar "40 perguntas por dia" não exige migração.
--
-- A contagem é atômica (um único upsert): dois cliques simultâneos não
-- passam o teto por corrida. O "dia" é o de São Paulo, não o do servidor.
-- ============================================================================

create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  feature text not null check (length(feature) between 1 and 40),
  uses integer not null default 0 check (uses >= 0),
  primary key (user_id, day, feature)
);

alter table public.ai_usage enable row level security;

-- O aluno pode LER o próprio uso (para mostrar "restam 12"); ninguém escreve direto.
drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated using (user_id = auth.uid());

-- Registra UM uso e diz se ainda estava dentro do limite. Se passou, desfaz o
-- incremento (para o contador não crescer com tentativas negadas) e devolve falso.
create or replace function public.consume_ai_quota(p_feature text, p_daily_limit integer)
returns table (allowed boolean, used integer, remaining integer)
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_day date := (now() at time zone 'America/Sao_Paulo')::date;
  v_used integer;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 10000 then
    raise exception 'limite inválido' using errcode = '22023';
  end if;

  insert into public.ai_usage (user_id, day, feature, uses)
  values (v_me, v_day, p_feature, 1)
  on conflict (user_id, day, feature) do update set uses = public.ai_usage.uses + 1
  returning uses into v_used;

  if v_used > p_daily_limit then
    update public.ai_usage set uses = p_daily_limit
    where user_id = v_me and day = v_day and feature = p_feature;
    return query select false, p_daily_limit, 0;
  end if;

  return query select true, v_used, p_daily_limit - v_used;
end;
$$;

grant execute on function public.consume_ai_quota(text, integer) to authenticated;
