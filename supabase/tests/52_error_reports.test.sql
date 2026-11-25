-- ============================================================================
-- Registro de erros.
--
-- O que trava:
--   1. Erro SEM sessão é registrado (é o do /login, o que mais importa).
--   2. Querystring não entra — é onde token e e-mail viajam.
--   3. Aluno não lê os erros (carregam estado da aplicação).
--   4. Mensagem vazia não vira linha.
-- ============================================================================

\set ALUNO '11111111-5555-5555-5555-55555555aaa1'
\set ADM   '11111111-5555-5555-5555-55555555aaa2'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO', 'aluno-erro@nexa.test', '{"full_name": "Aluno"}'),
  (:'ADM', 'admin-erro@nexa.test', '{"full_name": "Admin"}');

update public.profiles set role = 'admin' where id = :'ADM';

-- 1 · Anônimo consegue registrar (o erro da tela de login).
set role anon;
select public.report_error('Falha no login', 'client', 'at x (y.js:1)', '/login?next=%2Fhoje&token=SEGREDO', 'abc123', 'Mozilla/5.0');
reset role;

do $$
declare
  v_total integer;
  v_path text;
  v_user uuid;
begin
  select count(*) into v_total from public.error_reports;
  assert v_total = 1, format('o erro anônimo não foi registrado (%s linhas)', v_total);

  select pathname, user_id into v_path, v_user from public.error_reports limit 1;
  assert v_path = '/login',
    format('a querystring entrou no registro (%s) — é onde token e e-mail viajam', v_path);
  assert v_user is null, 'erro sem sessão deveria ficar sem user_id';
end;
$$;

-- 2 · Com sessão, o autor fica registrado.
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-55555555aaa1';
set role authenticated;
select public.report_error('Quebrou na agenda', 'server', null, '/agenda', null, null);

-- 3 · Mensagem vazia não vira linha.
select public.report_error('   ', 'client', null, '/hoje', null, null);

-- 4 · O aluno não lê nada.
do $$
declare v_rows integer;
begin
  select count(*) into v_rows from public.error_reports;
  assert v_rows = 0, format('o aluno leu %s registro(s) de erro', v_rows);

  select count(*) into v_rows from public.recent_error_reports();
  assert v_rows = 0, 'o aluno leu a lista de erros pela RPC';
end;
$$;

reset role;

do $$
declare v_total integer;
begin
  select count(*) into v_total from public.error_reports;
  assert v_total = 2, format('esperava 2 registros (a mensagem vazia não conta), tem %s', v_total);
end;
$$;

-- 5 · O admin lê, com o nome de quem passou pelo erro.
set "request.jwt.claim.sub" = '11111111-5555-5555-5555-55555555aaa2';
set role authenticated;

do $$
declare
  v_rows integer;
  v_name text;
begin
  select count(*) into v_rows from public.recent_error_reports();
  assert v_rows = 2, format('o admin deveria ver 2 erros, viu %s', v_rows);

  select user_name into v_name from public.recent_error_reports() where pathname = '/agenda';
  assert v_name = 'Aluno', format('o nome de quem passou pelo erro veio %s', coalesce(v_name, 'null'));
end;
$$;

reset role;

select 'ok' as result;
