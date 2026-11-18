-- ============================================================================
-- Nexa — "Nexa Escolas" só para quem a ESCOLA gerencia
--
-- Antes, qualquer perfil com `school_id` virava plano `school` (sem anúncio, sem plano pago).
-- Mas a pessoa pode se vincular sozinha a uma escola do catálogo no Perfil, e isso não deve
-- valer como "ser da escola". Agora é do Nexa Escolas quem:
--   · tem conta criada pelo painel da escola (login da escola), ou
--   · é da equipe da escola (professor, coordenação, direção), ou
--   · está numa escola com endereço próprio (ex.: Anglo Morumbi).
-- Quem só escolheu uma escola no Perfil continua no Nexa padrão (com anúncios ou plano).
-- ============================================================================

create or replace function public.is_managed_school_member(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and p.school_id is not null
      and (
        p.school_login is not null
        or p.role in ('school_admin', 'teacher_admin')
        or exists (select 1 from public.school_domains d where d.school_id = p.school_id)
      )
  );
$$;

grant execute on function public.is_managed_school_member(uuid) to authenticated;

create or replace function public.my_plan()
returns table (plan text, status text, current_period_end timestamptz, cancel_at_period_end boolean, interval_name text)
language plpgsql stable security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    return query select 'free'::text, null::text, null::timestamptz, false, null::text;
    return;
  end if;

  if public.is_managed_school_member(v_me) then
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
