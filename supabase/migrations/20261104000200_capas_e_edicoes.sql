-- ============================================================================
-- Nexa Vestibular — capa oficial opcional e edições 2025/2026 cadastradas.
--
-- `exams.cover_url`: endereço da imagem da capa do caderno. Fica NULO: a capa
-- oficial é da instituição, e só entra com autorização. Sem ela, o app desenha
-- uma capa própria (cor, sigla e ano).
--
-- As edições nascem sem datas (ver `exam_editions`): data de prova é dado do
-- mundo real e só entra quando o edital sai. Servem para o Banco de provas
-- listar "Em breve" até a prova ser carregada.
-- ============================================================================

alter table public.exams add column if not exists cover_url text
  check (cover_url is null or cover_url ~ '^https://');

insert into public.exam_editions (exam_id, year, label)
select e.id, y.year, e.name || ' ' || y.year
from public.exams e
cross join (values (2025::smallint), (2026::smallint)) as y(year)
where e.slug in ('enem', 'fuvest', 'unicamp', 'unesp', 'ita', 'ime')
on conflict (exam_id, year) do nothing;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
