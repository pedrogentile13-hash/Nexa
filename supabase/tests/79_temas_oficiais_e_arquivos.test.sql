-- Temas oficiais por banca e arquivos das provas.
\set ALUNO 'dd5e5e5e-0000-0000-0000-000000000001'
insert into auth.users (id, email, raw_user_meta_data) values (:'ALUNO','a-to@nexa.test','{"full_name":"Aluno Oficial"}');

do $$
begin
  -- 10 por banca, e a UNICAMP tem 2 propostas por ano
  assert (select count(*) from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'enem' and t.year >= 2017) = 10, 'ENEM: esperava 10 temas de 2017 a 2026';
  assert (select count(*) from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'fuvest' and t.kind = 'real') = 10, 'FUVEST: esperava 10';
  assert (select count(*) from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'unesp' and t.kind = 'real') = 10, 'UNESP: esperava 10';
  assert (select count(*) from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'ita' and t.kind = 'real') = 10, 'ITA: esperava 10';
  assert (select count(*) from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'unicamp' and t.kind = 'real') = 20, 'UNICAMP: esperava 20 propostas';
  assert (select count(*) from public.essay_themes where genre is not null and correction_model = 'outras' and proposal_no is not null) = 20, 'toda proposta da UNICAMP tem gênero';
  assert (select title from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'enem' and t.year = 2026) = 'A valorização do Sistema Único de Saúde (SUS) como direito universal', 'ENEM 2026 errado';
  assert (select correction_model from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug = 'enem' and t.year = 2024) = 'enem', 'ENEM usa a régua do ENEM';
  assert (select count(distinct correction_model) from public.essay_themes t join public.exams e on e.id = t.exam_id where e.slug in ('fuvest','unesp','ita')) = 1, 'bancas sem proposta usam o modelo adaptado';

  -- arquivos
  assert (select count(*) from public.exam_files where kind = 'caderno' and source like 'ITA%' and label like 'Caderno de Português%') = 10, 'esperava 10 cadernos diretos do ITA (Português e Redação)';
  assert (select count(*) from public.exam_files where kind = 'caderno' and url ~ '2025_PV_impresso_D[12]_CD[1-8]\.pdf$') = 8, 'esperava 8 cadernos do ENEM 2025';
  assert (select count(*) from public.exam_files where kind = 'gabarito' and url ~ '2025_GB_impresso_D[12]_CD[1-8]\.pdf$') = 8, 'esperava 8 gabaritos do ENEM 2025';
  assert (select count(*) from public.exam_files where url = 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D1_CD2.pdf') = 1, 'D1 CD2 deveria existir uma vez';
  assert (select count(*) from public.exam_files where url !~ '^https://') = 0, 'url sem https';
  assert (select count(*) from public.exam_editions ee join public.exams e on e.id = ee.exam_id where e.slug in ('enem','fuvest','unicamp','unesp','ita') and ee.year between 2017 and 2026) = 50, 'esperava 50 edições (5 bancas x 10 anos)';

  -- aluno lê, mas não escreve
  perform set_config('request.jwt.claim.sub', 'dd5e5e5e-0000-0000-0000-000000000001', true);
  perform set_config('role', 'authenticated', true);
  assert (select count(*) from public.exam_files) > 0, 'aluno deveria ler os arquivos publicados';
  begin
    insert into public.exam_files (exam_edition_id, kind, label, url) select id, 'caderno', 'x y', 'https://x.test/a.pdf' from public.exam_editions limit 1;
    assert false, 'aluno conseguiu inserir arquivo';
  exception when insufficient_privilege or others then
    if sqlerrm like 'aluno conseguiu%' then raise; end if;
  end;
  perform set_config('role', 'postgres', true);

  -- a coluna de URL só aceita https
  begin
    insert into public.exam_files (exam_edition_id, kind, label, url) select id, 'caderno', 'x y', 'http://x.test/a.pdf' from public.exam_editions limit 1;
    assert false, 'aceitou url sem https';
  exception when check_violation then null;
  end;
end $$;
