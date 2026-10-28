-- ============================================================================
-- Material de estudo e pedido de publicação.
--
-- O que esta suíte existe para impedir:
--   1. Ler o material de estudo de outro aluno.
--   2. Aluno de escola publicar conteúdo de IA SEM autorização.
--   3. Pedir publicação do conteúdo de OUTRA pessoa, ou em duplicidade.
--   4. Aluno decidir o próprio pedido (ou a coordenação de OUTRA escola decidir).
--   5. Aprovar não publicar de verdade, ou recusar publicar.
-- ============================================================================

\set ANA   'b5b5b5b5-0000-0000-0000-000000000001'
\set BETO  'b5b5b5b5-0000-0000-0000-000000000002'
\set COORD 'b5b5b5b5-0000-0000-0000-000000000003'
\set COORDX 'b5b5b5b5-0000-0000-0000-000000000004'
\set SOLTO 'b5b5b5b5-0000-0000-0000-000000000005'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'ANA',   'ana-mat@nexa.test', '{"full_name": "Ana"}'),
  (:'BETO',  'beto-mat@nexa.test', '{"full_name": "Beto"}'),
  (:'COORD', 'coord-mat@nexa.test', '{"full_name": "Coord"}'),
  (:'COORDX','coordx-mat@nexa.test', '{"full_name": "Coord de fora"}'),
  (:'SOLTO', 'solto-mat@nexa.test', '{"full_name": "Aluno sem escola"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('b6b6b6b6-0000-0000-0000-000000000001', 'Escola Material', 'São Paulo', 'SP', true),
  ('b6b6b6b6-0000-0000-0000-000000000002', 'Escola de Fora', 'São Paulo', 'SP', true);
insert into public.subject_catalog (id, slug, name, default_color)
  values ('b7b7b7b7-0000-0000-0000-000000000001', 'mat-mat', 'Matéria Material', '#336699') on conflict do nothing;

update public.profiles set school_id = 'b6b6b6b6-0000-0000-0000-000000000001' where id in (:'ANA', :'BETO');
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'b6b6b6b6-0000-0000-0000-000000000001' where id = :'COORD';
update public.profiles set role = 'school_admin', school_title = 'coordenacao', school_id = 'b6b6b6b6-0000-0000-0000-000000000002' where id = :'COORDX';

-- Conteúdo de IA da Ana (privado), da escola dela; e um do aluno sem escola.
insert into public.resources (id, school_id, subject_catalog_id, kind, title, body, difficulty, is_published, created_by, visibility, ai_generated, schema_version) values
  ('b8b8b8b8-0000-0000-0000-000000000001', 'b6b6b6b6-0000-0000-0000-000000000001', 'b7b7b7b7-0000-0000-0000-000000000001', 'resumo', 'Resumo da Ana', 'Texto do resumo da Ana sobre fotossíntese.', 'medio', true, :'ANA', 'private', true, '1.0'),
  ('b8b8b8b8-0000-0000-0000-000000000002', null, 'b7b7b7b7-0000-0000-0000-000000000001', 'resumo', 'Resumo solto', 'Texto de quem não tem escola.', 'medio', true, :'SOLTO', 'private', true, '1.0');

-- 1 · material de estudo é privado
set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000001'; -- ANA
set role authenticated;
do $$
declare v_falhou boolean;
begin
  insert into public.study_documents (user_id, title, source_kind, content)
  values (auth.uid(), 'Apostila de biologia', 'pdf', repeat('A fotossíntese converte luz em energia química. ', 5));
  assert (select count(*) from public.study_documents) = 1, 'a Ana não guardou o material';

  v_falhou := false;
  begin
    insert into public.study_documents (user_id, title, source_kind, content)
    values ('b5b5b5b5-0000-0000-0000-000000000002', 'Em nome do Beto', 'text', repeat('conteúdo suficiente ', 5));
    v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'a Ana gravou material em nome do Beto';

  -- 2 · não publica sozinha
  v_falhou := false;
  begin perform public.update_ai_resource_visibility('b8b8b8b8-0000-0000-0000-000000000001', 'school'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluna de escola publicou sem autorização';
  v_falhou := false;
  begin perform public.update_ai_resource_visibility('b8b8b8b8-0000-0000-0000-000000000001', 'public'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluna de escola tornou público sem autorização';
  -- voltar/ficar privado é livre
  perform public.update_ai_resource_visibility('b8b8b8b8-0000-0000-0000-000000000001', 'private');

  -- 3 · pede publicação (e não em duplicidade)
  perform public.request_publication('b8b8b8b8-0000-0000-0000-000000000001', 'Ficou bom para a turma');
  v_falhou := false;
  begin perform public.request_publication('b8b8b8b8-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'pedido duplicado foi aceito';
  assert (select count(*) from public.publication_requests) = 1, 'a Ana não vê o próprio pedido';
end;
$$;
reset role;

-- O Beto não lê o material da Ana, nem pede publicação do conteúdo dela.
set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000002'; -- BETO
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  assert (select count(*) from public.study_documents) = 0, 'o Beto leu o material da Ana';
  assert (select count(*) from public.publication_requests) = 0, 'o Beto leu o pedido da Ana';
  begin perform public.request_publication('b8b8b8b8-0000-0000-0000-000000000001'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'o Beto pediu a publicação do conteúdo da Ana';
end;
$$;
reset role;

-- Quem não tem escola não pede publicação (não há quem autorize).
set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000005'; -- SOLTO
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  begin perform public.request_publication('b8b8b8b8-0000-0000-0000-000000000002'); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'aluno sem escola pediu publicação';
  -- E mantém a liberdade de antes (sem escola, ninguém para autorizar).
  perform public.update_ai_resource_visibility('b8b8b8b8-0000-0000-0000-000000000002', 'friends');
end;
$$;
reset role;

-- 4 · coordenação de fora e a própria aluna não decidem
set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000004'; -- COORDX
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  assert (select count(*) from public.list_publication_requests()) = 0, 'coordenação de outra escola viu o pedido';
  begin perform public.decide_publication((select id from public.publication_requests limit 1), true); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'coordenação de outra escola decidiu o pedido';
end;
$$;
reset role;

set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000001'; -- ANA decide o próprio pedido? não.
set role authenticated;
do $$
declare v_falhou boolean := false;
begin
  begin perform public.decide_publication((select id from public.publication_requests limit 1), true); v_falhou := true;
  exception when others then null; end;
  assert not v_falhou, 'a aluna aprovou o próprio pedido';
end;
$$;
reset role;

-- 5 · a coordenação da escola decide
set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000003'; -- COORD
set role authenticated;
do $$
declare
  r record;
  v_req uuid;
begin
  select * into r from public.list_publication_requests();
  assert r.title = 'Resumo da Ana', 'coordenação não vê o pedido';
  assert r.preview like 'Texto do resumo da Ana%', 'coordenação não vê o trecho para decidir';
  assert r.requester_name = 'Ana', 'nome de quem pediu';
  v_req := r.id;

  perform public.decide_publication(v_req, true, 'Aprovado, ótimo trabalho');
  assert (select visibility from public.resources where id = 'b8b8b8b8-0000-0000-0000-000000000001') = 'school', 'aprovar não publicou';
  assert (select count(*) from public.list_publication_requests('pending')) = 0, 'o pedido continua pendente';
  assert (select status from public.list_publication_requests('approved') limit 1) = 'approved', 'o pedido não ficou aprovado';
end;
$$;
reset role;

-- Com a aprovação, a aluna passa a poder mudar a visibilidade do que foi autorizado.
set "request.jwt.claim.sub" = 'b5b5b5b5-0000-0000-0000-000000000001'; -- ANA
set role authenticated;
do $$
begin
  perform public.update_ai_resource_visibility('b8b8b8b8-0000-0000-0000-000000000001', 'friends');
  assert (select visibility from public.resources where id = 'b8b8b8b8-0000-0000-0000-000000000001') = 'friends', 'a aluna não mudou depois da autorização';
  assert (select count(*) from public.notifications where user_id = auth.uid() and title like 'Seu conteúdo foi publicado%') = 1, 'a aluna não foi avisada da aprovação';
end;
$$;
reset role;
