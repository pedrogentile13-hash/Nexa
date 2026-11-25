-- ============================================================================
-- Nexa — a Biblioteca precisa ver quantas questões tem cada quiz/simulado COMO ALUNO.
--
-- O que esta suíte existe para impedir:
--   1. O aluno ver `question_count = 0` em tudo (o app escondia quiz/simulado: sobravam só resumos).
--   2. A correção vazar o gabarito: o aluno continua sem ler `questions` direto.
--   3. Contar questões de conteúdo NÃO publicado.
-- ============================================================================

\set ADMIN '33333333-3333-3333-3333-333333333388'
\set ALUNO '44444444-4444-4444-4444-444444444489'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ADMIN', 'admin-contagem@nexa.test', '{"full_name": "Admin Contagem"}'),
  (:'ALUNO', 'aluno-contagem@nexa.test', '{"full_name": "Aluno Contagem"}');

update public.profiles set role = 'admin' where id = :'ADMIN';

set "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333388'; -- ADMIN
set role authenticated;

insert into public.resources (id, subject_catalog_id, kind, title, is_published) values
  ('cccccccc-0000-0000-0000-000000000088', (select id from public.subject_catalog order by slug limit 1), 'quiz', 'Quiz de contagem', true),
  ('cccccccc-0000-0000-0000-000000000089', (select id from public.subject_catalog order by slug limit 1), 'quiz', 'Quiz em rascunho', false);

insert into public.questions (id, resource_id, position, statement, explanation) values
  ('dddddddd-0000-0000-0000-000000000881', 'cccccccc-0000-0000-0000-000000000088', 1, 'Primeira questão', 'Explicação.'),
  ('dddddddd-0000-0000-0000-000000000882', 'cccccccc-0000-0000-0000-000000000088', 2, 'Segunda questão', 'Explicação.'),
  ('dddddddd-0000-0000-0000-000000000883', 'cccccccc-0000-0000-0000-000000000089', 1, 'Questão de rascunho', 'Explicação.');

reset role;
set "request.jwt.claim.sub" = '44444444-4444-4444-4444-444444444489'; -- ALUNO
set role authenticated;

do $$
declare
  v_count bigint;
begin
  -- 1 · o aluno vê as 2 questões do quiz publicado na Biblioteca
  select question_count into v_count from public.v_resource_library where id = 'cccccccc-0000-0000-0000-000000000088';
  assert v_count = 2, 'o aluno deveria ver 2 questões na Biblioteca, viu ' || coalesce(v_count::text, 'nada');

  -- 2 · mas continua sem ler a tabela de questões (o gabarito não vaza)
  assert (select count(*) from public.questions where resource_id = 'cccccccc-0000-0000-0000-000000000088') = 0,
    'o aluno não pode ler public.questions';

  -- 3 · rascunho não é contado
  assert public.resource_question_count('cccccccc-0000-0000-0000-000000000089') = 0,
    'questões de conteúdo não publicado não entram na contagem';
end $$;

reset role;

-- limpeza dos dados do teste
delete from public.resources where id in ('cccccccc-0000-0000-0000-000000000088', 'cccccccc-0000-0000-0000-000000000089');
