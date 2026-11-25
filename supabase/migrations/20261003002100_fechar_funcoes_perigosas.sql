-- ============================================================================
-- Nexa — Fecha funções que aceitavam "o usuário" escolhido por quem chama
--
-- Várias funções recebem `p_user_id` e rodam com permissão do dono do banco. Como
-- qualquer aluno logado podia chamá-las direto, um aluno conseguia:
--   · dar XP para si (ou tirar de outro) com `award_xp`, mexer no ranking e nas conquistas;
--   · mandar notificação para qualquer pessoa com `notify_user`;
--   · LER a fila de revisão, os erros e o domínio por assunto de OUTRO aluno.
-- Agora:
--   · as de escrita viram internas (só outras funções do banco chamam); o app usa as
--     versões "_self", que só mexem em quem está logado e têm teto;
--   · as de leitura só respondem para a própria pessoa — ou para quem pode ver o
--     desempenho dela (professor da turma, coordenação, admin).
-- ============================================================================

-- ---------------------------------------------------------------- escrita --
revoke execute on function public.award_xp(integer, text, text, uuid, uuid) from authenticated;
-- (ensure_user_stats e check_achievements só criam/recalculam o que já é verdade; ficam abertas porque outras rotinas do app as chamam.)
revoke execute on function public.notify_user(uuid, text, text, text) from authenticated;
revoke execute on function public.touch_streak(uuid) from authenticated;

-- XP do app: só para quem chama, valor pequeno e teto diário.
create or replace function public.award_xp_self(
  p_amount integer,
  p_reason text,
  p_source_type text default 'system',
  p_source_id uuid default null
)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_gain integer;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_amount < -10 or p_amount > 50 then
    raise exception 'valor de XP inválido' using errcode = '22023';
  end if;
  if p_source_type not in ('task', 'routine', 'study_session', 'activity', 'achievement', 'system') then
    raise exception 'origem de XP inválida' using errcode = '22023';
  end if;

  if p_amount > 0 then
    select coalesce(sum(amount), 0) into v_gain
    from public.xp_events
    where user_id = v_me and local_date = public.user_local_date(v_me) and amount > 0;
    if v_gain >= 1500 then
      return 0;
    end if;
  end if;

  return public.award_xp(p_amount, left(coalesce(p_reason, 'XP'), 120), p_source_type, p_source_id, v_me);
end;
$$;
grant execute on function public.award_xp_self(integer, text, text, uuid) to authenticated;

create or replace function public.touch_streak_self()
returns integer
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  return public.touch_streak(auth.uid());
end;
$$;
grant execute on function public.touch_streak_self() to authenticated;

-- O onboarding (roda com a permissão de quem entra) dava o XP inicial chamando `award_xp`:
-- passa a chamar a versão "_self". Reescreve a função só se ela ainda usa a antiga.
do $$
declare
  f record;
begin
  for f in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('bootstrap_student', 'bootstrap_vestibular_student')
      and p.prosrc ~ 'public\.award_xp\('
  loop
    execute replace(pg_get_functiondef(f.oid), 'public.award_xp(', 'public.award_xp_self(');
  end loop;
end;
$$;

-- ---------------------------------------------------------------- leitura --
-- Cada função de leitura vira `<nome>_unsafe` (interna) e ganha um "porteiro" com a
-- mesma assinatura, que confere a permissão antes de chamar a interna.
do $$
declare
  f record;
  v_name text;
  v_call text;
  v_set boolean;
begin
  for f in
    select p.oid, p.proname, p.prosrc, p.provolatile,
           pg_get_function_arguments(p.oid) as args,
           pg_get_function_result(p.oid) as res,
           pg_get_function_identity_arguments(p.oid) as ident,
           p.proargnames
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('review_queue', 'common_error_types', 'ranking_evolution')
  loop
    -- Já é o porteiro (a migração rodou antes e nada recriou a original): nada a fazer.
    if f.prosrc like '%' || f.proname || '_unsafe(%' then
      continue;
    end if;

    v_name := f.proname || '_unsafe';
    -- A original foi recriada por uma migração mais antiga reaplicada: descarta a interna velha.
    execute format('drop function if exists public.%I(%s)', v_name, f.ident);
    execute format('alter function public.%I(%s) rename to %I', f.proname, f.ident, v_name);
    execute format('revoke execute on function public.%I(%s) from public, anon, authenticated', v_name, f.ident);

    -- Só os parâmetros de ENTRADA (os de saída da função "returns table" não entram na chamada).
    select string_agg(format('%1$s => %1$s', split_part(btrim(a), ' ', 1)), ', ')
      into v_call
    from unnest(string_to_array(f.ident, ',')) as a;

    v_set := f.res like 'TABLE%' or f.res like 'SETOF%';

    execute format(
      $f$create or replace function public.%I(%s)
         returns %s
         language plpgsql %s security definer set search_path = public as $b$
         begin
           if p_user_id is distinct from auth.uid() and not public.can_read_performance_of(p_user_id) then
             raise exception 'não autorizado' using errcode = '42501';
           end if;
           %s public.%I(%s);
         end;
         $b$
      $f$,
      f.proname, f.args, f.res,
      case f.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end,
      case when v_set then 'return query select * from' else 'return' end,
      v_name, v_call
    );
    execute format('revoke execute on function public.%I(%s) from public, anon', f.proname, f.ident);
    execute format('grant execute on function public.%I(%s) to authenticated', f.proname, f.ident);
  end loop;
end;
$$;
