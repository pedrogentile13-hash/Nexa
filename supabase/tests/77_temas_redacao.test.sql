-- Temas de redação: aluno só vê o que está publicado; só admin escreve.
\set ALUNO 'cc5e5e5e-0000-0000-0000-000000000001'
insert into auth.users (id, email, raw_user_meta_data) values (:'ALUNO','a-tr@nexa.test','{"full_name":"Aluno Temas"}');

do $$
declare n_real_pub int; n_insp_pub int; n_visible int;
begin
  -- os temas reais nascem ocultos; os inspirados, publicados
  select count(*) into n_real_pub from public.essay_themes where kind = 'real' and is_published;
  assert n_real_pub = 0, 'tema real deveria nascer oculto até ser conferido';
  select count(*) into n_insp_pub from public.essay_themes where kind = 'inspirado' and is_published;
  assert n_insp_pub >= 10, format('esperava pelo menos 10 temas inspirados publicados, achei %s', n_insp_pub);
  assert (select count(*) from public.essay_themes where kind = 'real') >= 15, 'faltam temas reais do ENEM';

  -- aluno
  perform set_config('request.jwt.claim.sub', 'cc5e5e5e-0000-0000-0000-000000000001', true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n_visible from public.essay_themes;
  assert n_visible = n_insp_pub, format('aluno deveria ver só os publicados (%s), viu %s', n_insp_pub, n_visible);
  assert (select count(*) from public.essay_themes where kind = 'real') = 0, 'aluno viu tema real oculto';

  begin
    insert into public.essay_themes (title, kind) values ('Tema que o aluno não pode criar', 'inspirado');
    assert false, 'aluno conseguiu inserir tema';
  exception when insufficient_privilege or others then
    if sqlerrm like 'aluno conseguiu%' then raise; end if;
  end;
  perform set_config('role', 'postgres', true);
end $$;
