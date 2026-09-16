-- ============================================================================
-- Nexa Community — Fase 6: avaliação de conteúdo + compartilhar na Biblioteca.
--
-- O que esta suíte existe para impedir:
--   1. Avaliar/compartilhar um recurso não publicado ou de outra escola.
--   2. Reenviar `rate_resource` criar uma segunda linha em vez de atualizar.
--   3. Um post com `shared_resource_id` de conteúdo invisível ser criado.
-- ============================================================================

\set ADMIN  '99999999-9999-9999-9999-999999999960'
\set ALUNO  '99999999-9999-9999-9999-999999999961'
\set FORA   '99999999-9999-9999-9999-999999999962'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'ADMIN', 'admin-biblio@nexa.test', '{"full_name": "Admin Biblio"}'),
  (:'ALUNO', 'aluno-biblio@nexa.test', '{"full_name": "Aluno Biblio"}'),
  (:'FORA',  'fora-biblio@nexa.test', '{"full_name": "Fora Biblio"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('aaaaaaaa-0000-0000-0000-000000000060', 'Escola Biblio', 'São Paulo', 'SP', true),
  ('aaaaaaaa-0000-0000-0000-000000000061', 'Escola Biblio Fora', 'São Paulo', 'SP', true);

update public.profiles set role = 'admin' where id = :'ADMIN';
update public.profiles set school_id = 'aaaaaaaa-0000-0000-0000-000000000060' where id = :'ALUNO';
update public.profiles set school_id = 'aaaaaaaa-0000-0000-0000-000000000061' where id = :'FORA';

set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999960'; -- ADMIN
set role authenticated;

select id from public.subject_catalog where slug = 'fisica' \gset fisica_

insert into public.resources (id, subject_catalog_id, school_id, kind, title, body, is_published) values
  ('bbbbbbbb-0000-0000-0000-000000000060', :'fisica_id', 'aaaaaaaa-0000-0000-0000-000000000060', 'resumo', 'Resumo publicado', 'Conteúdo do resumo.', true),
  ('bbbbbbbb-0000-0000-0000-000000000061', :'fisica_id', 'aaaaaaaa-0000-0000-0000-000000000060', 'resumo', 'Resumo rascunho', 'Conteúdo do rascunho.', false);

reset role;

set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999961'; -- ALUNO
set role authenticated;

-- 1 · aluno vê e avalia o recurso publicado da própria escola
select public.rate_resource('bbbbbbbb-0000-0000-0000-000000000060', 4);

do $$
declare
  v_avg numeric;
  v_count bigint;
  v_mine smallint;
begin
  select average, rating_count, my_rating into v_avg, v_count, v_mine
  from public.get_resource_rating('bbbbbbbb-0000-0000-0000-000000000060');
  assert v_count = 1, format('esperava 1 avaliação, veio %s', v_count);
  assert v_mine = 4, format('esperava minha nota 4, veio %s', v_mine);
end;
$$;

-- Reenviar atualiza, não duplica.
select public.rate_resource('bbbbbbbb-0000-0000-0000-000000000060', 5);

do $$
declare
  v_count bigint;
  v_mine smallint;
begin
  select rating_count, my_rating into v_count, v_mine
  from public.get_resource_rating('bbbbbbbb-0000-0000-0000-000000000060');
  assert v_count = 1, format('reenviar rate_resource deveria atualizar, não duplicar — veio %s linhas', v_count);
  assert v_mine = 5, format('esperava nota atualizada pra 5, veio %s', v_mine);
end;
$$;

-- 2 · rascunho não publicado: nem avaliar nem compartilhar
do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.rate_resource('bbbbbbbb-0000-0000-0000-000000000061', 3);
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'consegui avaliar um recurso não publicado';
end;
$$;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.create_post('Confere esse resumo', 'school', null, 'bbbbbbbb-0000-0000-0000-000000000061');
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'consegui compartilhar um recurso não publicado num post';
end;
$$;

-- 3 · compartilhar o recurso publicado funciona e aparece resolvido no feed
select set_config('nexa.post_id',
  public.create_post('Confere esse resumo', 'school', null, 'bbbbbbbb-0000-0000-0000-000000000060')::text, false);

do $$
declare
  v_title text;
begin
  select shared_resource_title into v_title from public.list_feed(20, null)
  where id = current_setting('nexa.post_id')::uuid;
  assert v_title = 'Resumo publicado', format('esperava o título do recurso resolvido no feed, veio %s', v_title);
end;
$$;

reset role;

-- 4 · aluno de outra escola não vê nem avalia
set "request.jwt.claim.sub" = '99999999-9999-9999-9999-999999999962'; -- FORA
set role authenticated;

do $$
declare
  v_falhou boolean := false;
begin
  begin
    perform public.rate_resource('bbbbbbbb-0000-0000-0000-000000000060', 3);
    v_falhou := true;
  exception when others then
    null;
  end;
  assert not v_falhou, 'aluno de outra escola conseguiu avaliar recurso que não é seu';
end;
$$;

reset role;

select 'ok' as result;
