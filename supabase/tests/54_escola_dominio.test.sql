-- ============================================================================
-- Escola por endereço.
--
-- O que esta suíte existe para impedir:
--   1. Endereço desconhecido ou desativado resolver para alguma escola.
--   2. Um school_admin registrar endereço (sequestro de domínio).
--   3. Escola A mexer na marca da escola B.
--   4. Cor inválida entrar na marca (viraria CSS quebrado/injetado).
--   5. O `anon` ler as tabelas direto e listar as escolas clientes.
-- ============================================================================

\set ADMIN   'e1e1e1e1-0000-0000-0000-000000000001'
\set DIR_A   'e1e1e1e1-0000-0000-0000-000000000002'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ADMIN', 'admin-dom@nexa.test', '{"full_name": "Admin"}'),
  (:'DIR_A', 'dir-dom@nexa.test', '{"full_name": "Direção A"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('e2e2e2e2-0000-0000-0000-000000000001', 'Colégio A', 'São Paulo', 'SP', true),
  ('e2e2e2e2-0000-0000-0000-000000000002', 'Colégio B', 'São Paulo', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set role = 'school_admin', school_id = 'e2e2e2e2-0000-0000-0000-000000000001' where id = :'DIR_A';

insert into public.school_domains (host, school_id, active) values
  ('colegioa.nexastudy.com.br', 'e2e2e2e2-0000-0000-0000-000000000001', true),
  ('antigo.nexastudy.com.br',   'e2e2e2e2-0000-0000-0000-000000000002', false);
insert into public.school_branding (school_id, display_name, brand) values
  ('e2e2e2e2-0000-0000-0000-000000000001', 'Colégio A Oficial', '#123456');

-- 1 · resolução
do $$
begin
  assert (select count(*) from public.resolve_school_host('colegioa.nexastudy.com.br')) = 1, 'endereço ativo não resolveu';
  assert (select display_name from public.resolve_school_host('COLEGIOA.nexastudy.com.br ')) = 'Colégio A Oficial', 'não normalizou maiúsculas/espaços';
  assert (select brand from public.resolve_school_host('colegioa.nexastudy.com.br')) = '#123456', 'cor da marca não veio';
  assert (select count(*) from public.resolve_school_host('antigo.nexastudy.com.br')) = 0, 'endereço desativado resolveu';
  assert (select count(*) from public.resolve_school_host('naoexiste.nexastudy.com.br')) = 0, 'endereço desconhecido resolveu';
end;
$$;

-- 5 · anon chama a função, mas não lê as tabelas
set role anon;
do $$
begin
  assert (select count(*) from public.resolve_school_host('colegioa.nexastudy.com.br')) = 1, 'anon não conseguiu resolver o endereço';
  -- RLS sem política para anon: a leitura direta devolve ZERO linhas (não lista as escolas clientes).
  assert (select count(*) from public.school_domains) = 0, 'anon leu school_domains direto';
  assert (select count(*) from public.school_branding) = 0, 'anon leu school_branding direto';
end;
$$;
reset role;

-- 2 · school_admin não registra endereço
set "request.jwt.claim.sub" = 'e1e1e1e1-0000-0000-0000-000000000002'; -- DIR_A
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  begin
    insert into public.school_domains (host, school_id) values ('sequestro.nexastudy.com.br', 'e2e2e2e2-0000-0000-0000-000000000001');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'school_admin registrou um endereço';

  -- 3 · mexe na PRÓPRIA marca, não na da outra escola
  update public.school_branding set display_name = 'Nome novo' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';
  assert (select display_name from public.school_branding where school_id = 'e2e2e2e2-0000-0000-0000-000000000001') = 'Nome novo', 'não editou a própria marca';

  v_falhou := false;
  begin
    insert into public.school_branding (school_id, display_name) values ('e2e2e2e2-0000-0000-0000-000000000002', 'Invasão');
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'school_admin criou marca de OUTRA escola';

  -- 4 · cor inválida
  v_falhou := false;
  begin
    update public.school_branding set brand = 'red; background:url(x)' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';
    v_falhou := true;
  exception when others then null;
  end;
  assert not v_falhou, 'cor inválida entrou na marca';
end;
$$;
reset role;

-- Admin da plataforma registra endereço.
set "request.jwt.claim.sub" = 'e1e1e1e1-0000-0000-0000-000000000001'; -- ADMIN
set role authenticated;
do $$
begin
  insert into public.school_domains (host, school_id) values ('novo.nexastudy.com.br', 'e2e2e2e2-0000-0000-0000-000000000001');
  assert exists (select 1 from public.school_domains where host = 'novo.nexastudy.com.br'), 'admin não registrou endereço';
end;
$$;
reset role;

-- Logo: aceita https e o caminho local do app; recusa o resto.
do $$
begin
  update public.school_branding set logo_url = '/brand/schools/anglo.webp' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';
  update public.school_branding set logo_url = 'https://cdn.exemplo.com/l.png' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';

  begin
    update public.school_branding set logo_url = 'javascript:alert(1)' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';
    raise exception 'logo javascript: aceito';
  exception when check_violation then null;
  end;
  begin
    update public.school_branding set logo_url = 'data:image/png;base64,AAAA' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';
    raise exception 'logo data: aceito';
  exception when check_violation then null;
  end;
  begin
    update public.school_branding set logo_url = '/brand/schools/../../etc/passwd' where school_id = 'e2e2e2e2-0000-0000-0000-000000000001';
    raise exception 'logo com .. aceito';
  exception when check_violation then null;
  end;
end;
$$;
