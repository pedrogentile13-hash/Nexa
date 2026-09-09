-- ============================================================================
-- Nexa — suíte SQL: leituras administrativas de desempenho (admin_*).
--
-- O que esta suíte existe para impedir:
--   1. admin de uma escola lendo o desempenho de aluno de OUTRA escola
--   2. aluno lendo o próprio desempenho (ou o de qualquer um) por esta porta
--   3. admin de escola lendo o agregado de "todas as escolas"
--   4. o mecanismo em si não funcionar (o admin certo tem que conseguir ler)
-- ============================================================================

\set ADMIN     '66666666-6666-6666-6666-666666666601'
\set SCH_ADMIN '66666666-6666-6666-6666-666666666602'
\set ALUNO_A   '66666666-6666-6666-6666-666666666603'
\set ALUNO_B   '66666666-6666-6666-6666-666666666604'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-reports@nexa.test', '{"full_name": "Admin Geral"}'),
  (:'SCH_ADMIN', 'schadmin-reports@nexa.test', '{"full_name": "Admin da Escola A"}'),
  (:'ALUNO_A', 'aluno-a-reports@nexa.test', '{"full_name": "Aluna da Escola A"}'),
  (:'ALUNO_B', 'aluno-b-reports@nexa.test', '{"full_name": "Aluno da Escola B"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('77777777-0000-0000-0000-000000000001', 'Escola A (reports fixture)', 'São Paulo', 'SP', true),
  ('77777777-0000-0000-0000-000000000002', 'Escola B (reports fixture)', 'São Paulo', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set role = 'school_admin', school_id = '77777777-0000-0000-0000-000000000001'
  where id = :'SCH_ADMIN';
update public.profiles set school_id = '77777777-0000-0000-0000-000000000001' where id = :'ALUNO_A';
update public.profiles set school_id = '77777777-0000-0000-0000-000000000002' where id = :'ALUNO_B';

-- ---------------------------------------------------------- admin geral ----
set "request.jwt.claim.sub" = '66666666-6666-6666-6666-666666666601';
set role authenticated;

do $$
begin
  -- Lê qualquer aluno, de qualquer escola — não deve levantar exceção.
  perform * from public.admin_subject_scores('66666666-6666-6666-6666-666666666603');
  perform * from public.admin_subject_scores('66666666-6666-6666-6666-666666666604');
  perform * from public.admin_user_stats('66666666-6666-6666-6666-666666666604');
  -- "todas as escolas" (p_school_id null) só é permitido pra admin geral.
  perform * from public.admin_school_summary(null);
  perform * from public.admin_school_summary('77777777-0000-0000-0000-000000000001');
end;
$$;

reset role;

-- --------------------------------------------------- admin da escola A -----
set "request.jwt.claim.sub" = '66666666-6666-6666-6666-666666666602';
set role authenticated;

do $$
begin
  -- Aluna da própria escola: ok.
  perform * from public.admin_subject_scores('66666666-6666-6666-6666-666666666603');
  perform * from public.admin_study_sessions('66666666-6666-6666-6666-666666666603');
  perform * from public.admin_school_summary('77777777-0000-0000-0000-000000000001');

  -- Aluno de OUTRA escola: tem que recusar.
  begin
    perform * from public.admin_subject_scores('66666666-6666-6666-6666-666666666604');
    assert false, 'admin da escola A conseguiu ler aluno da escola B';
  exception when insufficient_privilege then null;
  end;

  -- "Todas as escolas": só admin geral, nunca school_admin.
  begin
    perform * from public.admin_school_summary(null);
    assert false, 'admin de escola conseguiu ler o agregado de todas as escolas';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

-- ------------------------------------------------------------- aluno -------
set "request.jwt.claim.sub" = '66666666-6666-6666-6666-666666666603';
set role authenticated;

do $$
begin
  begin
    perform * from public.admin_subject_scores('66666666-6666-6666-6666-666666666603');
    assert false, 'aluno conseguiu chamar admin_subject_scores sobre si mesmo';
  exception when insufficient_privilege then null;
  end;

  begin
    perform * from public.admin_user_stats('66666666-6666-6666-6666-666666666604');
    assert false, 'aluno conseguiu chamar admin_user_stats sobre outro aluno';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select 'ok' as result;
