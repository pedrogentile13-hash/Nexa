-- Siglas da biblioteca: sequenciais por aluno, estáveis, sem reaproveitar número, e só o dono renomeia.
\set A 'ee5e5e5e-0000-0000-0000-0000000000a1'
\set B 'ee5e5e5e-0000-0000-0000-0000000000a2'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'A', 'a-bib@nexa.test', '{"full_name":"A"}'), (:'B', 'b-bib@nexa.test', '{"full_name":"B"}');

set "request.jwt.claim.sub" = 'ee5e5e5e-0000-0000-0000-0000000000a1'; set role authenticated;
do $$
declare v_third text;
begin
  insert into public.study_documents (user_id, title, source_kind, content) values
    (auth.uid(), 'Apostila 1', 'pdf', repeat('conteúdo de estudo ', 5)),
    (auth.uid(), 'Apostila 2', 'pdf', repeat('conteúdo de estudo ', 5));
  assert (select string_agg(code, ',' order by code) from public.study_documents) = 'B01,B02', 'siglas fora de ordem';

  delete from public.study_documents where code = 'B02';
  insert into public.study_documents (user_id, title, source_kind, content)
    values (auth.uid(), 'Apostila 3', 'text', repeat('outro conteúdo ', 6)) returning code into v_third;
  assert v_third = 'B03', format('a sigla do B02 foi reaproveitada: %s', v_third);

  update public.study_documents set title = 'Biologia — célula' where code = 'B01';
  assert (select title from public.study_documents where code = 'B01') = 'Biologia — célula', 'não renomeou';
  assert (select code from public.study_documents where title = 'Biologia — célula') = 'B01', 'renomear mudou a sigla';
end $$;
reset role;

-- outro aluno começa do B01 e não consegue renomear o material alheio
set "request.jwt.claim.sub" = 'ee5e5e5e-0000-0000-0000-0000000000a2'; set role authenticated;
do $$
declare v_code text;
begin
  insert into public.study_documents (user_id, title, source_kind, content)
    values (auth.uid(), 'Meu primeiro', 'text', repeat('conteúdo do outro ', 5)) returning code into v_code;
  assert v_code = 'B01', 'a numeração não é por aluno';
  update public.study_documents set title = 'invadido' where user_id = 'ee5e5e5e-0000-0000-0000-0000000000a1';
  assert (select count(*) from public.study_documents) = 1, 'viu o material alheio';
end $$;
reset role;
