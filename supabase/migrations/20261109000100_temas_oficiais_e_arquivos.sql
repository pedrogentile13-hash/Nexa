-- ============================================================================
-- Nexa Vestibular — temas oficiais de redação (2017–2026) e arquivos das provas.
--
-- 1) Temas: os 50 temas de ENEM, FUVEST, UNICAMP, UNESP e ITA vêm do PDF
--    "Temas de Redação dos últimos 10 anos" (pesquisa de campo de 8/11/2026).
--    Entram PUBLICADOS. O texto da coletânea de cada prova NÃO é copiado
--    (é das bancas): guardamos só a frase do tema, o gênero e as observações.
-- 2) Arquivos: cadernos e gabaritos ficam nos sites oficiais. A tabela guarda o
--    ENDEREÇO (https) de cada arquivo; nada é copiado para o Nexa.
-- 3) Edições 2017–2024 das cinco provas (as de 2025/2026 já existem).
-- ============================================================================

-- ------------------------------------------------------------------ temas --
alter table public.essay_themes
  add column if not exists genre text check (genre is null or length(genre) <= 120),
  add column if not exists edition_note text check (edition_note is null or length(edition_note) <= 600),
  add column if not exists proposal_no smallint check (proposal_no is null or proposal_no between 1 and 4),
  -- 'enem' = régua do ENEM (proposta de intervenção obrigatória);
  -- 'outras' = modelo adaptado (UNESP, ITA e FUVEST não pedem proposta; UNICAMP cobra o gênero).
  add column if not exists correction_model text not null default 'enem' check (correction_model in ('enem', 'outras'));

with src as (
  select * from (values
    -- ENEM
    ('enem', 2026, null, 'A valorização do Sistema Único de Saúde (SUS) como direito universal', null, null),
    ('enem', 2025, null, 'Perspectivas acerca do envelhecimento na sociedade brasileira', null, null),
    ('enem', 2024, null, 'Desafios para a valorização da herança africana no Brasil', null, null),
    ('enem', 2023, null, 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil', null, null),
    ('enem', 2022, null, 'Desafios para a valorização de comunidades e povos tradicionais no Brasil', null, null),
    ('enem', 2021, null, 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil', null, null),
    ('enem', 2020, null, 'O estigma associado às doenças mentais na sociedade brasileira', null, 'Enem digital: “O desafio de reduzir as desigualdades entre as regiões do Brasil”'),
    ('enem', 2019, null, 'Democratização do acesso ao cinema no Brasil', null, null),
    ('enem', 2018, null, 'Manipulação do comportamento do usuário pelo controle de dados na internet', null, null),
    ('enem', 2017, null, 'Desafios para a formação educacional de surdos no Brasil', null, null),
    -- FUVEST (2ª fase, dissertação em prosa)
    ('fuvest', 2026, null, 'O perdão é um ato que pode ser condicionado e limitado', null, 'Havia opção de gênero: carta a uma personagem hipotética que o tivesse acusado falsamente de um ato moralmente reprovável'),
    ('fuvest', 2025, null, 'As relações sociais por meio da solidariedade', null, null),
    ('fuvest', 2024, null, 'Educação básica e formação profissional: entre a multitarefa e a reflexão', null, null),
    ('fuvest', 2023, null, 'Refugiados ambientais e vulnerabilidade social', null, null),
    ('fuvest', 2022, null, 'As diferentes faces do riso', null, null),
    ('fuvest', 2021, null, 'O mundo contemporâneo está fora de ordem?', null, null),
    ('fuvest', 2020, null, 'O papel da ciência no mundo contemporâneo', null, null),
    ('fuvest', 2019, null, 'De que maneira o passado contribui para a compreensão do presente?', null, null),
    ('fuvest', 2018, null, 'Devem existir limites para a arte?', null, null),
    ('fuvest', 2017, null, 'O homem saiu de sua menoridade?', null, 'Coletânea de um único texto: “Resposta à pergunta: O que é Esclarecimento?”, de Immanuel Kant (1784)'),
    -- UNESP
    ('unesp', 2026, null, 'Vivemos hoje uma epidemia da solidão?', null, null),
    ('unesp', 2025, null, 'Medicalização da vida: a quem interessa?', null, null),
    ('unesp', 2024, null, 'É possível um futuro off-line?', null, null),
    ('unesp', 2023, null, 'A “lógica do condomínio”: o espaço público está em declínio?', null, null),
    ('unesp', 2022, null, '“Tudo bem não estar bem?”: a tristeza em tempos de felicidade compulsória', null, null),
    ('unesp', 2021, null, 'Tempo é dinheiro?', null, null),
    ('unesp', 2020, null, 'O carro será o novo cigarro?', null, null),
    ('unesp', 2019, null, 'Compro, logo existo?', null, null),
    ('unesp', 2018, null, 'O voto deveria ser facultativo no Brasil?', null, null),
    ('unesp', 2017, null, 'A riqueza de poucos beneficia a sociedade inteira?', null, null),
    -- ITA
    ('ita', 2026, null, 'A importância do comprometimento do jovem engenheiro com a prevenção do próprio apodrecimento cerebral', null, 'Enunciado oficial. Nasceu de brain rot, palavra do ano de 2024 do Dicionário de Oxford'),
    ('ita', 2025, null, 'O papel da Engenharia na construção de um mundo justo e de um planeta sustentável', null, 'Enunciado oficial. Ancorado no G20 no Brasil e na Agenda 2030 da ONU'),
    ('ita', 2024, null, 'A responsabilidade da engenharia frente aos problemas do mundo contemporâneo', null, 'Enunciado oficial: “escreva uma dissertação a respeito da responsabilidade da engenharia frente aos problemas do mundo contemporâneo. Dê um título ao texto.”'),
    ('ita', 2023, null, 'Tecnofilia; riscos', null, 'Enunciado oficial: “relacionando os acontecimentos relatados com pelo menos um item da coletânea e abordando os seguintes tópicos: tecnofilia; riscos”'),
    ('ita', 2022, null, 'A influência do medo nas ações humanas', null, 'Enunciado oficial'),
    ('ita', 2021, null, 'Que liberdade nos resta no século XXI?', null, 'Enunciado oficial'),
    ('ita', 2020, null, 'Em que medida o conhecimento tecno-científico segue princípios ético-morais?', null, 'Enunciado oficial'),
    ('ita', 2019, null, 'Assunto da coletânea: o incêndio no Museu Nacional', null, 'A banca não deu tema; pedia texto a partir dos excertos e da charge'),
    ('ita', 2018, null, 'Assunto da coletânea: o envelhecimento', null, 'A banca não deu tema; o candidato extraía o assunto comum dos textos'),
    ('ita', 2017, null, 'Assunto da coletânea: o poder das mídias e da comunicação', null, 'Enunciado oficial: “Os textos e tirinhas lidos na prova tratam de um assunto em comum (...) elabore um texto dissertativo em prosa, sustentando um ponto de vista sobre um desses aspectos.”')
  ) as t(exam_slug, year, ord, title, genre, note)
)
insert into public.essay_themes (exam_id, year, title, kind, genre, edition_note, correction_model, source_note, is_published, sort_order)
select e.id, s.year::smallint, s.title, 'real', s.genre, s.note,
       case when s.exam_slug = 'enem' then 'enem' else 'outras' end,
       'Pesquisa de campo de 8/11/2026: ITA conferido nos PDFs oficiais; demais bancas cruzadas entre fontes oficiais e correções do Poliedro, Estratégia, CNN e Quero Bolsa',
       true, 2000 - s.year
from src s join public.exams e on e.slug = s.exam_slug
on conflict (title) do update
  set exam_id = excluded.exam_id, year = excluded.year, kind = 'real', genre = excluded.genre,
      edition_note = excluded.edition_note, correction_model = excluded.correction_model,
      source_note = excluded.source_note, is_published = true, sort_order = excluded.sort_order;

-- UNICAMP: duas propostas por ano, cada uma com um gênero textual diferente.
with src as (
  select * from (values
    (2026, 1, 'A “machosfera” e o discurso de ódio contra as mulheres', 'depoimento pessoal'),
    (2026, 2, 'A importância histórica da CLT', 'nota de esclarecimento'),
    (2025, 1, 'Igualdade de gênero nas cadeiras do Congresso Nacional', 'texto de apresentação de Projeto de Lei'),
    (2025, 2, 'Jogos eletrônicos de azar entre adolescentes', 'comunicado à comunidade escolar'),
    (2024, 1, 'Trabalho análogo à escravidão e direitos das empregadas domésticas', 'carta-denúncia ao Ministério Público'),
    (2024, 2, 'Acolhimento de refugiados', 'discurso'),
    (2023, 1, 'Violência por arma de fogo e clube de tiro no bairro', 'texto de convocação'),
    (2023, 2, 'Racismo escolar', 'depoimento sigiloso'),
    (2022, 1, 'Superexposição de crianças e adolescentes na internet', '“textão” de rede social'),
    (2022, 2, 'Corte de verbas para ciência e tecnologia', 'manifesto'),
    (2021, 1, 'Retirada de estátuas', 'discurso político'),
    (2021, 2, 'Fragilização pela pandemia de Covid-19', 'entrada de diário'),
    (2020, 1, 'Biodiversidade e diversidade sociocultural', 'roteiro de podcast'),
    (2020, 2, 'Micromachismo', 'crônica'),
    (2019, 1, 'Doutrinação ideológica em sala de aula', 'abaixo-assinado'),
    (2019, 2, 'IDH e PIB como indicadores de desenvolvimento', 'postagem em fórum'),
    (2018, 1, 'Pós-verdade', 'palestra'),
    (2018, 2, 'Liberdade de expressão', 'artigo de opinião'),
    (2017, 1, 'Brasil cordial e a presença de estrangeiros no país', 'carta argumentativa'),
    (2017, 2, 'Arrecadação de fundos para bibliotecas', 'texto de apresentação')
  ) as t(year, proposal_no, title, genre)
)
insert into public.essay_themes (exam_id, year, title, kind, genre, proposal_no, edition_note, correction_model, source_note, is_published, sort_order)
select e.id, s.year::smallint, s.title, 'real', s.genre, s.proposal_no::smallint,
       'A UNICAMP não dá frase de tema: dá uma situação e um gênero. Duas propostas, o candidato escolhe uma. Errar o gênero custa metade da nota.',
       'outras',
       'Pesquisa de campo de 8/11/2026, cruzada entre fontes oficiais e correções do Poliedro, Estratégia, CNN e Quero Bolsa',
       true, 2000 - s.year + s.proposal_no
from src s join public.exams e on e.slug = 'unicamp'
on conflict (title) do update
  set exam_id = excluded.exam_id, year = excluded.year, kind = 'real', genre = excluded.genre, proposal_no = excluded.proposal_no,
      edition_note = excluded.edition_note, correction_model = excluded.correction_model,
      source_note = excluded.source_note, is_published = true, sort_order = excluded.sort_order;

-- Os temas de 2009–2016 do ENEM ainda não foram conferidos: seguem ocultos.
update public.essay_themes set is_published = false
where kind = 'real' and year < 2017 and source_note like 'ENEM % — conferir%';

-- ----------------------------------------------------------- edições -------
insert into public.exam_editions (exam_id, year, label)
select e.id, y.year, e.name || ' ' || y.year
from public.exams e
cross join generate_series(2017, 2024) as y(year)
where e.slug in ('enem', 'fuvest', 'unicamp', 'unesp', 'ita')
on conflict (exam_id, year) do nothing;

-- ---------------------------------------------------------- arquivos -------
create table if not exists public.exam_files (
  id uuid primary key default gen_random_uuid(),
  exam_edition_id uuid not null references public.exam_editions (id) on delete cascade,
  kind text not null check (kind in ('caderno', 'gabarito', 'pagina')),
  label text not null check (length(btrim(label)) between 2 and 160),
  url text not null check (url ~ '^https://'),
  source text,
  is_published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create unique index if not exists exam_files_edition_url_uq on public.exam_files (exam_edition_id, url);
create index if not exists exam_files_edition_idx on public.exam_files (exam_edition_id, kind, sort_order);

alter table public.exam_files enable row level security;

drop policy if exists exam_files_select on public.exam_files;
create policy exam_files_select on public.exam_files
  for select to authenticated using (is_published or public.is_admin());

drop policy if exists exam_files_manage_admin on public.exam_files;
create policy exam_files_manage_admin on public.exam_files
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ITA: PDF direto da prova de Português/Redação (2ª fase) de cada ano.
insert into public.exam_files (exam_edition_id, kind, label, url, source, sort_order)
select ee.id, 'caderno', 'Caderno de Português e Redação · 2ª fase', v.url, 'ITA (vestibular.ita.br)', 10
from (values
  (2026, 'https://www.vestibular.ita.br/provas/portugues_2026_2f.pdf'),
  (2025, 'https://www.vestibular.ita.br/provas/portugues_2025_2f.pdf'),
  (2024, 'https://www.vestibular.ita.br/provas/redacao_2024_2f.pdf'),
  (2023, 'https://www.vestibular.ita.br/provas/redacao_2023_2f.pdf'),
  (2022, 'https://www.vestibular.ita.br/provas/redacao_2022_2f.pdf'),
  (2021, 'https://www.vestibular.ita.br/provas/redacao_2021_2f.pdf'),
  (2020, 'https://www.vestibular.ita.br/provas/redacao_2020_2f.pdf'),
  (2019, 'https://www.vestibular.ita.br/provas/redacao_2019_2f.pdf'),
  (2018, 'https://www.vestibular.ita.br/provas/portugues_2018.pdf'),
  (2017, 'https://www.vestibular.ita.br/provas/portugues_2017.pdf')
) as v(year, url)
join public.exams e on e.slug = 'ita'
join public.exam_editions ee on ee.exam_id = e.id and ee.year = v.year
on conflict (exam_edition_id, url) do nothing;

-- FUVEST: página do acervo oficial de cada ano (a redação está no caderno da 2ª fase, 1º dia).
insert into public.exam_files (exam_edition_id, kind, label, url, source, sort_order)
select ee.id, 'pagina', 'Acervo oficial da FUVEST ' || ee.year || ' (redação: 2ª fase, 1º dia)',
       'https://www.fuvest.br/acervo-vestibular-' || ee.year, 'FUVEST (fuvest.br)', 50
from public.exams e
join public.exam_editions ee on ee.exam_id = e.id
where e.slug = 'fuvest' and ee.year between 2017 and 2026
on conflict (exam_edition_id, url) do nothing;

-- ENEM, UNICAMP e UNESP: páginas oficiais onde estão os cadernos e gabaritos.
insert into public.exam_files (exam_edition_id, kind, label, url, source, sort_order)
select ee.id, 'pagina', v.label, v.url, v.source, 50
from (values
  ('enem', 'Provas e gabaritos do INEP (a redação é a última página do caderno do 1º dia)',
   'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos', 'INEP'),
  ('unicamp', 'Provas e gabaritos da Comvest (a redação está no caderno da 2ª fase, 1º dia)',
   'https://www.comvest.unicamp.br/', 'Comvest (Unicamp)'),
  ('unesp', 'Cadernos de prova do Vestibular Unesp (a redação é o último bloco do 2º dia da 2ª fase)',
   'https://vestibular.unesp.br/', 'Vunesp (Unesp)')
) as v(exam_slug, label, url, source)
join public.exams e on e.slug = v.exam_slug
join public.exam_editions ee on ee.exam_id = e.id and ee.year between 2017 and 2026
on conflict (exam_edition_id, url) do nothing;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
