-- Planejamento do professor: privado dele; a coordenação lê; ninguém mais.

\set PROF   'd1d1d1d1-1111-0000-0000-000000000001'
\set PROF2  'd1d1d1d1-1111-0000-0000-000000000002'
\set COORD  'd1d1d1d1-1111-0000-0000-000000000003'
\set ALUNO  'd1d1d1d1-1111-0000-0000-000000000004'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'PROF',  'prof-pl@nexa.test', '{"full_name": "Prof Plano"}'),
  (:'PROF2', 'prof2-pl@nexa.test', '{"full_name": "Prof Dois"}'),
  (:'COORD', 'coord-pl@nexa.test', '{"full_name": "Coord Plano"}'),
  (:'ALUNO', 'aluno-pl@nexa.test', '{"full_name": "Aluno Plano"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('d2d2d2d2-1111-0000-0000-000000000001', 'Escola Plano', 'São Paulo', 'SP', true);

update public.profiles set role = 'teacher_admin', school_id = 'd2d2d2d2-1111-0000-0000-000000000001' where id in (:'PROF', :'PROF2');
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'd2d2d2d2-1111-0000-0000-000000000001' where id = :'COORD';
update public.profiles set school_id = 'd2d2d2d2-1111-0000-0000-000000000001' where id = :'ALUNO';

set "request.jwt.claim.sub" = 'd1d1d1d1-1111-0000-0000-000000000001'; -- PROF
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  insert into public.teacher_plans (teacher_id, school_id, title, content)
  values ('d1d1d1d1-1111-0000-0000-000000000001', 'd2d2d2d2-1111-0000-0000-000000000001',
          '2º bimestre — Revolução Francesa', 'Causas: crise financeira, desigualdade entre os três estados, iluminismo. Fases: assembleia, convenção, diretório.');
  assert (select count(*) from public.teacher_plans) = 1, 'professor não salvou o planejamento';

  -- Texto curto demais é recusado (não há de onde a IA tirar conteúdo).
  begin
    insert into public.teacher_plans (teacher_id, school_id, title, content)
    values ('d1d1d1d1-1111-0000-0000-000000000001', 'd2d2d2d2-1111-0000-0000-000000000001', 'Vazio', 'curto');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'planejamento curto demais foi aceito';

  -- Em nome de outro professor, não.
  v_falhou := false;
  begin
    insert into public.teacher_plans (teacher_id, school_id, title, content)
    values ('d1d1d1d1-1111-0000-0000-000000000002', 'd2d2d2d2-1111-0000-0000-000000000001', 'Forjado', 'um texto de planejamento com mais de vinte caracteres');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'professor gravou planejamento em nome de outro';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'd1d1d1d1-1111-0000-0000-000000000002'; -- PROF2
set role authenticated;
do $$ begin assert (select count(*) from public.teacher_plans) = 0, 'outro professor leu o planejamento'; end; $$;
reset role;

set "request.jwt.claim.sub" = 'd1d1d1d1-1111-0000-0000-000000000004'; -- ALUNO
set role authenticated;
do $$ begin assert (select count(*) from public.teacher_plans) = 0, 'aluno leu o planejamento do professor'; end; $$;
reset role;

set "request.jwt.claim.sub" = 'd1d1d1d1-1111-0000-0000-000000000003'; -- COORD
set role authenticated;
do $$
begin
  assert (select count(*) from public.teacher_plans) = 1, 'coordenação não consegue ler o planejamento';
  update public.teacher_plans set title = 'Editado pela coordenação';
  assert (select title from public.teacher_plans) <> 'Editado pela coordenação', 'coordenação editou o planejamento do professor';
end;
$$;
reset role;
