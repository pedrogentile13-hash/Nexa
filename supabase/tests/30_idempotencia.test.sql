-- ============================================================================
-- Nexa — reaplicar o setup não pode quebrar nem apagar nada.
--
-- Este arquivo roda DEPOIS das outras suítes, num banco que já tem dados de
-- teste. Ele existe porque o caminho real de instalação não é "banco novo": é
-- alguém que rodou uma versão antiga meses atrás e precisa da versão nova.
--
-- Antes desta garantia, reaplicar produzia 174 erros de "already exists" — e o
-- cabeçalho do arquivo prometia o contrário, o que é pior que não prometer.
--
-- A reaplicação em si acontece em scripts/test-db.sh; aqui ficam as asserções
-- sobre o estado depois dela.
-- ============================================================================

do $$
declare
  v_tables integer;
  v_policies integer;
  v_role integer;
begin
  select count(*) into v_tables
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r';

  assert v_tables = 43, format('esperado 43 tabelas depois de reaplicar, achei %s', v_tables);

  select count(*) into v_policies from pg_policies where schemaname = 'public';
  assert v_policies > 40, format('políticas sumiram na reaplicação: %s', v_policies);

  select count(*) into v_role from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and column_name = 'role';
  assert v_role = 1, 'a coluna profiles.role não sobreviveu à reaplicação';
end;
$$;

-- Os dados das suítes anteriores continuam lá: reaplicar o setup não é um
-- reset. Se um dia alguém trocar um `create table if not exists` por um
-- `drop table`, é aqui que isso aparece antes de chegar num aluno.
do $$
declare
  v_subjects integer;
  v_attempts integer;
  v_resources integer;
begin
  select count(*) into v_subjects from public.subject_catalog;
  assert v_subjects >= 24, format('catálogo encolheu para %s matérias', v_subjects);

  select count(*) into v_attempts from public.quiz_attempts;
  assert v_attempts > 0, 'as tentativas de quiz/simulado dos testes sumiram ao reaplicar';

  select count(*) into v_resources from public.resources;
  assert v_resources > 0, 'a biblioteca sumiu ao reaplicar';
end;
$$;

select '✓ 30_idempotencia.test.sql — all assertions passed' as result;
