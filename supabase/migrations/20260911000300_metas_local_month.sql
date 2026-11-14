-- ============================================================================
-- Nexa — 0911 (3) · Metas: início do mês pelo fuso do aluno, não do servidor
--
-- `getMetasOverview` calculava o início do mês com `Date.UTC(...)` sobre o
-- relógio do SERVIDOR — todo outro corte de data do app (Hoje, Agenda,
-- sequência) usa `user_local_date()`, que resolve pelo fuso salvo em
-- `profiles.timezone`. Num fuso UTC-3, das 21h às 23h59 locais já é o dia
-- seguinte em UTC — perto da virada do mês, isso classifica errado (às vezes
-- o mês inteiro errado) as horas/atividades/matérias do card de Metas.
--
-- `user_month_start()` é o mesmo princípio de `user_local_date()`: primeiro
-- dia do MÊS local do aluno, convertido pra timestamptz correto em UTC —
-- pra comparar contra colunas timestamptz (`finished_at`, `completed_at`)
-- sem o desvio de fuso. Pra `study_sessions.local_date` (já é `date`, sem
-- fuso embutido), o próprio `user_local_date()` trunca pro mês sem precisar
-- desta função.
-- ============================================================================

create or replace function public.user_month_start(p_user_id uuid default auth.uid())
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select date_trunc('month', public.user_local_date(p_user_id)::timestamp) at time zone coalesce(
    (select p.timezone from public.profiles p where p.id = p_user_id),
    'America/Sao_Paulo'
  );
$$;

grant execute on function public.user_month_start(uuid) to authenticated;
