-- ============================================================================
-- ENEM 2025: cadernos de questões e gabaritos oficiais (INEP), 8 cadernos.
-- 1º dia = cadernos 1 a 4; 2º dia = cadernos 5 a 8. Só o endereço fica no
-- Nexa; o arquivo continua no site do INEP.
-- A cor do caderno só aparece onde foi confirmada (caderno 2 = Amarelo).
-- ============================================================================

insert into public.exam_files (exam_edition_id, kind, label, url, source, sort_order)
select ee.id, v.kind, v.label,
       'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_' || case when v.kind = 'caderno' then 'PV' else 'GB' end
         || '_impresso_D' || v.dia || '_CD' || v.cd || '.pdf',
       'INEP', v.cd * 10 + case when v.kind = 'caderno' then 0 else 1 end
from public.exams e
join public.exam_editions ee on ee.exam_id = e.id and ee.year = 2025
cross join (values
  (1, 1, '1º dia · Caderno 1'),
  (1, 2, '1º dia · Caderno 2 · Amarelo'),
  (1, 3, '1º dia · Caderno 3'),
  (1, 4, '1º dia · Caderno 4'),
  (2, 5, '2º dia · Caderno 5'),
  (2, 6, '2º dia · Caderno 6'),
  (2, 7, '2º dia · Caderno 7'),
  (2, 8, '2º dia · Caderno 8')
) as c(dia, cd, label)
cross join (values ('caderno'), ('gabarito')) as k(kind)
cross join lateral (select c.dia, c.cd, c.label, k.kind) as v
where e.slug = 'enem'
on conflict (exam_edition_id, url) do nothing;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
