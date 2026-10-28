-- Admin restrito: não se promove, não promove ninguém; o geral continua podendo tudo.

\set GERAL  'a7a7a7a7-0000-0000-0000-000000000001'
\set LIMIT  'a7a7a7a7-0000-0000-0000-000000000002'
\set ALUNO  'a7a7a7a7-0000-0000-0000-000000000003'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'GERAL', 'geral-ar@nexa.test', '{"full_name": "Admin Geral"}'),
  (:'LIMIT', 'limit-ar@nexa.test', '{"full_name": "Admin Restrito"}'),
  (:'ALUNO', 'aluno-ar@nexa.test', '{"full_name": "Aluno"}');

update public.profiles set role = 'admin' where id = :'GERAL';
update public.profiles set role = 'admin', admin_scope = 'limited' where id = :'LIMIT';

do $$
begin
  assert public.is_full_admin('a7a7a7a7-0000-0000-0000-000000000001'), 'admin geral não é geral';
  assert not public.is_full_admin('a7a7a7a7-0000-0000-0000-000000000002'), 'admin restrito virou geral';
  assert not public.is_full_admin('a7a7a7a7-0000-0000-0000-000000000003'), 'aluno virou admin geral';
  -- O restrito continua sendo "admin" para o resto do sistema (conteúdo, relatórios).
  assert public.is_admin('a7a7a7a7-0000-0000-0000-000000000002'), 'admin restrito perdeu o acesso de admin';
end;
$$;

-- O restrito NÃO se promove nem promove outros.
set "request.jwt.claim.sub" = 'a7a7a7a7-0000-0000-0000-000000000002'; -- LIMIT
set role authenticated;
do $$
declare v_falhou boolean;
begin
  v_falhou := false;
  begin update public.profiles set admin_scope = null where id = auth.uid(); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'admin restrito virou admin geral';

  v_falhou := false;
  begin update public.profiles set role = 'admin' where id = 'a7a7a7a7-0000-0000-0000-000000000003'; v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'admin restrito promoveu um aluno a admin';

  v_falhou := false;
  begin update public.profiles set role = 'school_admin' where id = 'a7a7a7a7-0000-0000-0000-000000000003'; v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'admin restrito deu papel de escola a alguém';

  -- Mas edita o resto do perfil de um aluno (nome), como antes.
  update public.profiles set full_name = 'Aluno Editado' where id = 'a7a7a7a7-0000-0000-0000-000000000003';
  assert (select full_name from public.profiles where id = 'a7a7a7a7-0000-0000-0000-000000000003') = 'Aluno Editado', 'admin restrito não editou o perfil';
end;
$$;
reset role;

-- O geral promove e cria restrito.
set "request.jwt.claim.sub" = 'a7a7a7a7-0000-0000-0000-000000000001'; -- GERAL
set role authenticated;
do $$
begin
  update public.profiles set role = 'admin', admin_scope = 'limited' where id = 'a7a7a7a7-0000-0000-0000-000000000003';
  assert (select admin_scope from public.profiles where id = 'a7a7a7a7-0000-0000-0000-000000000003') = 'limited', 'admin geral não criou o restrito';
end;
$$;
reset role;
