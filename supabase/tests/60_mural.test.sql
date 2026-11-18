-- ============================================================================
-- Mural de avisos oficiais.
--
-- O que esta suíte existe para impedir:
--   1. Aluno publicar aviso; professor publicar para escola toda ou turma alheia.
--   2. Aluno de uma turma ler aviso de outra turma; ler aviso de outra escola.
--   3. Aluno ver quem leu / não leu, ou apagar aviso.
--   4. Números errados de leitura (a escola decide com base neles).
-- ============================================================================

\set COORD  'e3e3e3e3-0000-0000-0000-000000000001'
\set PROF   'e3e3e3e3-0000-0000-0000-000000000002'
\set ALUNA  'e3e3e3e3-0000-0000-0000-000000000003'
\set ALUNOB 'e3e3e3e3-0000-0000-0000-000000000004'
\set FORA   'e3e3e3e3-0000-0000-0000-000000000005'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'COORD',  'coord-mu@nexa.test', '{"full_name": "Coord Mural"}'),
  (:'PROF',   'prof-mu@nexa.test', '{"full_name": "Prof Mural"}'),
  (:'ALUNA',  'aluna-mu@nexa.test', '{"full_name": "Aluna 9A"}'),
  (:'ALUNOB', 'alunob-mu@nexa.test', '{"full_name": "Aluno 9B"}'),
  (:'FORA',   'fora-mu@nexa.test', '{"full_name": "Aluno de fora"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('e4e4e4e4-0000-0000-0000-000000000001', 'Escola Mural', 'São Paulo', 'SP', true),
  ('e4e4e4e4-0000-0000-0000-000000000002', 'Escola de Fora', 'São Paulo', 'SP', true);
insert into public.classes (id, school_id, name) values
  ('e5e5e5e5-0000-0000-0000-000000000001', 'e4e4e4e4-0000-0000-0000-000000000001', '9A'),
  ('e5e5e5e5-0000-0000-0000-000000000002', 'e4e4e4e4-0000-0000-0000-000000000001', '9B');
insert into public.subject_catalog (id, slug, name, default_color)
  values ('e6e6e6e6-0000-0000-0000-000000000001', 'mat-mu', 'Matemática Mural', '#336699') on conflict do nothing;

update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'e4e4e4e4-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set role = 'teacher_admin', school_id = 'e4e4e4e4-0000-0000-0000-000000000001' where id = :'PROF';
update public.profiles set school_id = 'e4e4e4e4-0000-0000-0000-000000000001', class_id = 'e5e5e5e5-0000-0000-0000-000000000001' where id = :'ALUNA';
update public.profiles set school_id = 'e4e4e4e4-0000-0000-0000-000000000001', class_id = 'e5e5e5e5-0000-0000-0000-000000000002' where id = :'ALUNOB';
update public.profiles set school_id = 'e4e4e4e4-0000-0000-0000-000000000002' where id = :'FORA';
insert into public.teacher_assignments (teacher_id, school_id, subject_catalog_id, class_id)
values (:'PROF', 'e4e4e4e4-0000-0000-0000-000000000001', 'e6e6e6e6-0000-0000-0000-000000000001', 'e5e5e5e5-0000-0000-0000-000000000001');

-- Coordenação publica para a escola toda; professor para a 9A.
set "request.jwt.claim.sub" = 'e3e3e3e3-0000-0000-0000-000000000001'; -- COORD
set role authenticated;
do $$
declare r record;
begin
  select * into r from public.create_announcement('Reunião de pais', 'Sexta, 19h, no auditório.', null, true);
  assert r.announcement_id is not null, 'coordenação não publicou';
  -- Sino: 2 alunos da escola + 1 professor (o autor e o aluno de fora ficam de fora).
  assert cardinality(r.notified_user_ids) = 3, format('notificados: esperado 3, veio %s', cardinality(r.notified_user_ids));
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'e3e3e3e3-0000-0000-0000-000000000002'; -- PROF
set role authenticated;
do $$
declare
  v_falhou boolean;
  r record;
begin
  select * into r from public.create_announcement('Prova de matemática', 'Dia 12, capítulos 3 e 4.', 'e5e5e5e5-0000-0000-0000-000000000001');
  assert r.announcement_id is not null, 'professor não publicou para a própria turma';

  v_falhou := false;
  begin perform * from public.create_announcement('Para a 9B', 'x', 'e5e5e5e5-0000-0000-0000-000000000002'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'professor publicou para turma em que não leciona';

  v_falhou := false;
  begin perform * from public.create_announcement('Para a escola toda', 'x', null); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'professor publicou para a escola toda';
end;
$$;
reset role;

-- 1 + 2 · aluna da 9A vê os dois; aluno da 9B só o geral; aluno de fora nenhum
set "request.jwt.claim.sub" = 'e3e3e3e3-0000-0000-0000-000000000003'; -- ALUNA
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  assert (select count(*) from public.list_announcements()) = 2, 'aluna da 9A deveria ver 2 avisos';
  assert (select count(*) from public.list_announcements() where can_manage) = 0, 'aluna não deveria gerenciar nada';
  assert (select count(*) from public.list_announcements() where read_count is not null) = 0, 'aluna viu contagem de leitura';
  assert public.unread_announcements_count() = 2, 'não lidos da aluna';

  perform public.mark_announcement_read((select id from public.list_announcements() where title = 'Reunião de pais'));
  assert public.unread_announcements_count() = 1, 'depois de ler, deveria sobrar 1';

  -- 1 · aluno não publica
  begin perform * from public.create_announcement('Pirata', 'x', null); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluna publicou aviso';

  -- 3 · não vê os leitores nem apaga
  v_falhou := false;
  begin perform * from public.announcement_readers((select id from public.list_announcements() limit 1)); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluna viu quem leu o aviso';
  v_falhou := false;
  begin perform public.delete_announcement((select id from public.list_announcements() limit 1)); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluna apagou aviso';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'e3e3e3e3-0000-0000-0000-000000000004'; -- ALUNOB
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  assert (select count(*) from public.list_announcements()) = 1, 'aluno da 9B deveria ver só o aviso geral';
  assert (select title from public.list_announcements()) = 'Reunião de pais', 'aluno da 9B viu aviso da outra turma';
  -- Não consegue marcar como lido o aviso da 9A.
  begin
    perform public.mark_announcement_read((select id from public.school_announcements where title = 'Prova de matemática'));
    v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno da 9B marcou como lido aviso de outra turma';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'e3e3e3e3-0000-0000-0000-000000000005'; -- FORA
set role authenticated;
do $$ begin assert (select count(*) from public.list_announcements()) = 0, 'aluno de outra escola viu avisos'; end; $$;
reset role;

-- 4 · contagens para quem gerencia
set "request.jwt.claim.sub" = 'e3e3e3e3-0000-0000-0000-000000000001'; -- COORD
set role authenticated;
do $$
declare r record;
begin
  select * into r from public.list_announcements() where title = 'Reunião de pais';
  assert r.can_manage, 'coordenação não gerencia';
  assert r.audience_size = 2, format('audiência: esperado 2 alunos, veio %s', r.audience_size);
  assert r.read_count = 1, format('leram: esperado 1, veio %s', r.read_count);

  assert (select count(*) from public.announcement_readers(r.id)) = 2, 'leitores: deveria listar os 2 alunos';
  assert (select count(*) from public.announcement_readers(r.id) where read_at is null) = 1, 'deveria haver 1 que não leu';
  -- Quem não leu aparece primeiro.
  assert (select full_name from public.announcement_readers(r.id) limit 1) = 'Aluno 9B', 'quem não leu deveria vir primeiro';

  select * into r from public.list_announcements() where title = 'Prova de matemática';
  assert r.audience_size = 1, 'audiência do aviso da turma deveria ser 1';

  perform public.delete_announcement(r.id);
  assert (select count(*) from public.list_announcements()) = 1, 'coordenação não apagou o aviso';
end;
$$;
reset role;
