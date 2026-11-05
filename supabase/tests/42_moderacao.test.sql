-- ============================================================================
-- Nexa Community — Fase 11: denúncias/moderação.
--
-- O que esta suíte existe para impedir:
--   1. Aluno comum ver ou resolver denúncia (só quem modera aquela escola).
--   2. Denúncia de aluno de OUTRA escola vazar pro school_admin desta.
--   3. `resolve_report` aceitar status fora de reviewed/dismissed.
-- ============================================================================

\set SCHOOL_ADMIN '33333333-9999-9999-9999-999999999980'
\set AUTOR        '33333333-9999-9999-9999-999999999981'
\set DENUNCIANTE  '33333333-9999-9999-9999-999999999982'
\set OUTRA_ESCOLA '33333333-9999-9999-9999-999999999983'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'SCHOOL_ADMIN', 'schooladmin-mod@nexa.test', '{"full_name": "School Admin Mod"}'),
  (:'AUTOR',        'autor-mod@nexa.test', '{"full_name": "Autor Mod"}'),
  (:'DENUNCIANTE',  'denunciante-mod@nexa.test', '{"full_name": "Denunciante Mod"}'),
  (:'OUTRA_ESCOLA', 'outraescola-mod@nexa.test', '{"full_name": "Admin Outra Escola"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('44444444-0000-0000-0000-000000000080', 'Escola Moderação', 'São Paulo', 'SP', true),
  ('44444444-0000-0000-0000-000000000081', 'Escola Moderação Outra', 'São Paulo', 'SP', true);

update public.profiles set role = 'school_admin', school_id = '44444444-0000-0000-0000-000000000080' where id = :'SCHOOL_ADMIN';
update public.profiles set school_id = '44444444-0000-0000-0000-000000000080' where id in (:'AUTOR', :'DENUNCIANTE');
update public.profiles set role = 'school_admin', school_id = '44444444-0000-0000-0000-000000000081' where id = :'OUTRA_ESCOLA';

set "request.jwt.claim.sub" = '33333333-9999-9999-9999-999999999981'; -- AUTOR
set role authenticated;
select set_config('nexa.post_id', public.create_post('Post que vai ser denunciado', 'public')::text, false);
reset role;

set "request.jwt.claim.sub" = '33333333-9999-9999-9999-999999999982'; -- DENUNCIANTE
set role authenticated;
select set_config('nexa.report_id',
  public.create_report('post', current_setting('nexa.post_id')::uuid, 'spam', 'Parece spam')::text, false);
reset role;

-- 1 · aluno comum (o próprio denunciante) não vê a fila de denúncias
set "request.jwt.claim.sub" = '33333333-9999-9999-9999-999999999982'; -- DENUNCIANTE
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_reports('pending');
  assert v_total = 0, format('aluno comum não deveria ver nenhuma denúncia, viu %s', v_total);
end;
$$;

reset role;

-- 2 · school_admin da MESMA escola vê e resolve
set "request.jwt.claim.sub" = '33333333-9999-9999-9999-999999999980'; -- SCHOOL_ADMIN
set role authenticated;

do $$
declare
  v_total integer;
  v_preview text;
begin
  select count(*) into v_total from public.list_reports('pending');
  assert v_total = 1, format('school_admin da mesma escola deveria ver 1 denúncia pendente, viu %s', v_total);

  select target_preview into v_preview from public.list_reports('pending') limit 1;
  assert v_preview = 'Post que vai ser denunciado', 'preview da denúncia deveria trazer o conteúdo do post';
end;
$$;

select public.resolve_report(current_setting('nexa.report_id')::uuid, 'dismissed');

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_reports('pending');
  assert v_total = 0, 'denúncia resolvida não deveria mais aparecer como pendente';
end;
$$;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.resolve_report(current_setting('nexa.report_id')::uuid, 'qualquer-coisa');
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'resolve_report aceitou um status inválido';
end;
$$;

reset role;

-- 3 · admin de OUTRA escola não vê nem resolve denúncia desta escola
set "request.jwt.claim.sub" = '33333333-9999-9999-9999-999999999983'; -- OUTRA_ESCOLA
set role authenticated;

do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.list_reports(null);
  assert v_total = 0, format('admin de outra escola não deveria ver denúncia desta escola, viu %s', v_total);
end;
$$;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.resolve_report(current_setting('nexa.report_id')::uuid, 'reviewed');
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'admin de outra escola conseguiu resolver denúncia que não é dela';
end;
$$;

reset role;

select 'ok' as result;
