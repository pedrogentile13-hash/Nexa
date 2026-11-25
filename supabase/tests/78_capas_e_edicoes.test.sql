-- Edições 2025/2026 cadastradas para as provas, sem data; capa oficial só com https.
do $$
begin
  assert (select count(*) from public.exam_editions ee join public.exams e on e.id = ee.exam_id
          where e.slug in ('enem','fuvest','unicamp','unesp','ita','ime') and ee.year in (2025, 2026)) = 12,
    'esperava 12 edições (6 provas x 2025 e 2026)';
  assert (select count(*) from public.exam_editions where year in (2025, 2026) and application_date is not null) = 0,
    'edição não pode nascer com data inventada';

  begin
    update public.exams set cover_url = 'http://exemplo.com/capa.png' where slug = 'enem';
    assert false, 'cover_url aceitou endereço sem https';
  exception when check_violation then null;
  end;
  update public.exams set cover_url = 'https://exemplo.com/capa.png' where slug = 'enem';
  update public.exams set cover_url = null where slug = 'enem';
end $$;
