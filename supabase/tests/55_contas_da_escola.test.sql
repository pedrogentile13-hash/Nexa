-- ============================================================================
-- Contas criadas pela escola.
--
-- O que esta suíte existe para impedir:
--   1. Aluno de conta gerenciada trocar a própria escola, turma ou login.
--   2. Qualquer aluno se vincular sozinho a uma escola que tem endereço próprio.
--   3. A coordenação NÃO conseguir mover/gerenciar os alunos da própria escola.
--   4. Login repetido na mesma escola, ou em formato inválido.
--   5. A trava quebrar o fluxo antigo (aluno livre escolhendo escola sem endereço).
-- ============================================================================

\set DIR    'f1f1f1f1-0000-0000-0000-000000000001'
\set GERENC 'f1f1f1f1-0000-0000-0000-000000000002'
\set LIVRE  'f1f1f1f1-0000-0000-0000-000000000003'
\set OUTRO  'f1f1f1f1-0000-0000-0000-000000000004'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'DIR',    'dir-cta@nexa.test', '{"full_name": "Direção"}'),
  (:'GERENC', 'ana@escola-cta.nexastudy.com.br', '{"full_name": "Ana"}'),
  (:'LIVRE',  'livre-cta@nexa.test', '{"full_name": "Livre"}'),
  (:'OUTRO',  'bia@escola-cta.nexastudy.com.br', '{"full_name": "Bia"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('f2f2f2f2-0000-0000-0000-000000000001', 'Escola Gerenciada', 'São Paulo', 'SP', true),
  ('f2f2f2f2-0000-0000-0000-000000000002', 'Escola Sem Endereço', 'São Paulo', 'SP', true);

insert into public.classes (id, school_id, name) values
  ('f3f3f3f3-0000-0000-0000-000000000001', 'f2f2f2f2-0000-0000-0000-000000000001', '9A'),
  ('f3f3f3f3-0000-0000-0000-000000000002', 'f2f2f2f2-0000-0000-0000-000000000001', '9B');

insert into public.school_domains (host, school_id) values
  ('escola-cta.nexastudy.com.br', 'f2f2f2f2-0000-0000-0000-000000000001');

update public.profiles set role = 'school_admin', school_title = 'coordenacao',
  school_id = 'f2f2f2f2-0000-0000-0000-000000000001' where id = :'DIR';
update public.profiles set school_id = 'f2f2f2f2-0000-0000-0000-000000000001',
  class_id = 'f3f3f3f3-0000-0000-0000-000000000001', school_login = 'ana' where id = :'GERENC';
update public.profiles set school_id = 'f2f2f2f2-0000-0000-0000-000000000001',
  class_id = 'f3f3f3f3-0000-0000-0000-000000000001', school_login = 'bia' where id = :'OUTRO';

-- 4 · formato e unicidade do login
do $$
declare v_falhou boolean;
begin
  v_falhou := false;
  begin
    update public.profiles set school_login = 'ana' where id = 'f1f1f1f1-0000-0000-0000-000000000004';
    v_falhou := true;
  exception when unique_violation then null;
  end;
  assert not v_falhou, 'login repetido na mesma escola foi aceito';

  v_falhou := false;
  begin
    update public.profiles set school_login = 'Ana Silva!' where id = 'f1f1f1f1-0000-0000-0000-000000000004';
    v_falhou := true;
  exception when check_violation then null;
  end;
  assert not v_falhou, 'login inválido (maiúscula/espaço/!) foi aceito';
end;
$$;

-- 1 · aluno gerenciado não mexe em escola, turma nem login
set "request.jwt.claim.sub" = 'f1f1f1f1-0000-0000-0000-000000000002'; -- GERENC (ana)
set role authenticated;

do $$
declare v_falhou boolean;
begin
  v_falhou := false;
  begin update public.profiles set school_id = 'f2f2f2f2-0000-0000-0000-000000000002' where id = auth.uid(); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno gerenciado trocou de escola';

  v_falhou := false;
  begin update public.profiles set school_id = null where id = auth.uid(); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno gerenciado saiu da escola';

  v_falhou := false;
  begin update public.profiles set class_id = 'f3f3f3f3-0000-0000-0000-000000000002' where id = auth.uid(); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno gerenciado trocou de turma';

  v_falhou := false;
  begin update public.profiles set school_login = 'outro' where id = auth.uid(); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno gerenciado trocou o próprio login';

  -- Mas continua podendo editar o resto do perfil.
  update public.profiles set full_name = 'Ana Souza' where id = auth.uid();
  assert (select full_name from public.profiles where id = auth.uid()) = 'Ana Souza', 'aluno gerenciado não edita o próprio nome';
end;
$$;

reset role;

-- 2 + 5 · aluno livre: não entra na escola com endereço, mas o fluxo antigo segue
set "request.jwt.claim.sub" = 'f1f1f1f1-0000-0000-0000-000000000003'; -- LIVRE
set role authenticated;

do $$
declare v_falhou boolean := false;
begin
  begin update public.profiles set school_id = 'f2f2f2f2-0000-0000-0000-000000000001' where id = auth.uid(); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno livre se vinculou sozinho a uma escola com endereço próprio';

  update public.profiles set school_id = 'f2f2f2f2-0000-0000-0000-000000000002' where id = auth.uid();
  assert (select school_id from public.profiles where id = auth.uid()) = 'f2f2f2f2-0000-0000-0000-000000000002',
    'a trava quebrou o fluxo antigo: aluno livre não consegue escolher uma escola sem endereço';
end;
$$;

reset role;

-- 3 · coordenação da escola move o aluno de turma e o lê
set "request.jwt.claim.sub" = 'f1f1f1f1-0000-0000-0000-000000000001'; -- DIR (coordenação)
set role authenticated;

do $$
begin
  update public.profiles set class_id = 'f3f3f3f3-0000-0000-0000-000000000002' where id = 'f1f1f1f1-0000-0000-0000-000000000004';
  assert (select class_id from public.profiles where id = 'f1f1f1f1-0000-0000-0000-000000000004') = 'f3f3f3f3-0000-0000-0000-000000000002',
    'coordenação não conseguiu mover o aluno de turma';
end;
$$;

reset role;
