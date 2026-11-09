-- ============================================================================
-- Nexa Vestibular — banco de temas de redação.
--
-- Dois tipos de tema:
--   * 'real'      — tema oficial de uma prova (ENEM, FUVEST...). Entra OCULTO
--                   (`is_published = false`): a frase exata é dado do mundo
--                   real e só vai para o aluno depois de conferida na fonte
--                   (INEP, FUVEST...). O texto de apoio da prova NÃO é copiado
--                   (é de terceiros): guardamos só o tema.
--   * 'inspirado' — tema original no estilo da prova, com contextualização
--                   curta e autoral. Já nasce publicado.
-- ============================================================================

create table if not exists public.essay_themes (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams (id) on delete set null,
  year smallint check (year is null or year between 2000 and 2100),
  title text not null check (length(btrim(title)) between 5 and 300),
  -- Contextualização curta e AUTORAL (2–3 frases). Nunca texto de prova.
  context_text text check (context_text is null or length(context_text) <= 1200),
  axis text check (axis is null or axis in ('educacao','meio-ambiente','saude','tecnologia','trabalho','cidadania','cultura','sociedade')),
  kind text not null default 'inspirado' check (kind in ('real', 'inspirado')),
  source_note text,
  is_published boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create unique index if not exists essay_themes_title_uq on public.essay_themes (title);
create index if not exists essay_themes_list_idx on public.essay_themes (kind, year desc) where is_published;

alter table public.essay_themes enable row level security;

drop policy if exists essay_themes_select on public.essay_themes;
create policy essay_themes_select on public.essay_themes
  for select to authenticated using (is_published or public.is_admin());

drop policy if exists essay_themes_manage_admin on public.essay_themes;
create policy essay_themes_manage_admin on public.essay_themes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.essay_corrections
  add column if not exists theme_id uuid references public.essay_themes (id) on delete set null;

-- ------------------------------------------------ temas reais (OCULTOS) -----
-- ATENÇÃO: conferir cada frase com o INEP antes de publicar
-- (update public.essay_themes set is_published = true where kind = 'real' ...).
insert into public.essay_themes (exam_id, year, title, kind, source_note, is_published, sort_order)
select e.id, v.year, v.title, 'real', 'ENEM ' || v.year || ' — conferir a frase exata no INEP antes de publicar', false, 1000 - v.year
from public.exams e
cross join (values
  (2009::smallint, 'O indivíduo frente à ética nacional'),
  (2010::smallint, 'O trabalho na construção da dignidade humana'),
  (2011::smallint, 'Viver em rede no século XXI: os limites entre o público e o privado'),
  (2012::smallint, 'O movimento imigratório para o Brasil no século XXI'),
  (2013::smallint, 'Efeitos da implantação da Lei Seca no Brasil'),
  (2014::smallint, 'Publicidade infantil em questão no Brasil'),
  (2015::smallint, 'A persistência da violência contra a mulher na sociedade brasileira'),
  (2016::smallint, 'Caminhos para combater a intolerância religiosa no Brasil'),
  (2017::smallint, 'Desafios para a formação educacional de surdos no Brasil'),
  (2018::smallint, 'Manipulação do comportamento do usuário pelo controle de dados na internet'),
  (2019::smallint, 'Democratização do acesso ao cinema no Brasil'),
  (2020::smallint, 'O estigma associado às doenças mentais na sociedade brasileira'),
  (2021::smallint, 'Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil'),
  (2022::smallint, 'Desafios para a valorização de comunidades e povos tradicionais no Brasil'),
  (2023::smallint, 'Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil'),
  (2024::smallint, 'Desafios para a valorização da herança africana no Brasil'),
  (2025::smallint, 'Perspectivas acerca do envelhecimento na sociedade brasileira')
) as v(year, title)
where e.slug = 'enem'
on conflict (title) do nothing;

-- ------------------------------------------ temas inspirados (PUBLICADOS) ---
insert into public.essay_themes (exam_id, title, context_text, axis, kind, is_published, sort_order)
select e.id, v.title, v.context_text, v.axis, 'inspirado', true, v.sort_order
from public.exams e
cross join (values
  ('Desafios para o uso responsável da inteligência artificial na educação brasileira',
   'Ferramentas de inteligência artificial já ajudam a explicar conteúdos e a corrigir textos, mas também podem ser usadas para copiar trabalhos. O debate envolve acesso desigual à tecnologia, formação de professores e o risco de os estudantes deixarem de desenvolver o próprio raciocínio.',
   'tecnologia', 10),
  ('O combate à desinformação na sociedade brasileira',
   'Notícias falsas circulam rápido nas redes e podem influenciar a saúde, as eleições e a convivência entre as pessoas. Ao mesmo tempo, há dúvidas sobre como combater o problema sem limitar a liberdade de expressão.',
   'cidadania', 20),
  ('O impacto das redes sociais na saúde mental dos jovens brasileiros',
   'A comparação constante com a vida dos outros, a exposição precoce e o tempo de tela são apontados como fatores de ansiedade entre adolescentes. Escolas, famílias e plataformas têm papéis diferentes nesse cuidado.',
   'saude', 30),
  ('Caminhos para ampliar o acesso à saúde mental no Sistema Único de Saúde',
   'Muitas pessoas enfrentam filas, falta de profissionais e preconceito ao procurar atendimento psicológico. A discussão passa por financiamento, cuidado na atenção básica e combate ao estigma.',
   'saude', 40),
  ('Desafios para a inclusão de pessoas com deficiência no mercado de trabalho brasileiro',
   'A lei prevê reserva de vagas, mas ainda há barreiras de acessibilidade, de formação e de preconceito dentro das empresas. A inclusão depende de políticas públicas e de mudança de cultura nas organizações.',
   'trabalho', 50),
  ('Os efeitos do trabalho por aplicativos na vida dos trabalhadores brasileiros',
   'Plataformas digitais ofereceram renda rápida a muita gente, mas sem vínculo formal, com jornadas longas e pouca proteção social. O tema envolve direitos trabalhistas, tecnologia e desigualdade.',
   'trabalho', 60),
  ('Desafios para a preservação da Amazônia e de seus povos',
   'A floresta regula o clima e abriga grande biodiversidade e comunidades tradicionais, mas sofre com desmatamento, queimadas e atividades ilegais. Proteger a região exige fiscalização, desenvolvimento sustentável e respeito aos povos que vivem nela.',
   'meio-ambiente', 70),
  ('Caminhos para reduzir o desperdício de alimentos no Brasil',
   'Parte do que é produzido se perde no campo, no transporte e nas casas, enquanto muitas famílias convivem com a insegurança alimentar. O problema envolve logística, educação do consumidor e políticas de doação.',
   'meio-ambiente', 80),
  ('Desafios para a segurança alimentar e o combate à fome no Brasil',
   'O acesso regular a alimentos de qualidade ainda é desigual no país. A discussão passa por renda, preço dos alimentos, agricultura familiar e programas sociais.',
   'sociedade', 90),
  ('Desafios para a mobilidade urbana sustentável nas grandes cidades brasileiras',
   'Trânsito lento, transporte público lotado e poluição afetam o dia a dia de quem vive nas metrópoles. Alternativas como transporte coletivo de qualidade, ciclovias e planejamento urbano entram no debate.',
   'sociedade', 100),
  ('Desafios para o acesso à moradia digna nas cidades brasileiras',
   'Milhões de pessoas vivem em áreas precárias, sem saneamento ou segurança de posse. O tema envolve planejamento urbano, política habitacional e desigualdade social.',
   'cidadania', 110),
  ('A importância da leitura na formação cidadã dos brasileiros',
   'Ler amplia o vocabulário, o senso crítico e a capacidade de participar da vida pública, mas o acesso a livros e bibliotecas ainda é desigual. Escola, família e políticas culturais compartilham essa responsabilidade.',
   'educacao', 120),
  ('Desafios para a valorização da educação científica no Brasil',
   'Ciência e pesquisa dependem de investimento contínuo e de professores bem formados, e a desconfiança em relação ao conhecimento científico atrapalha decisões coletivas. A escola tem papel central nessa valorização.',
   'educacao', 130),
  ('A cultura do cancelamento e os limites da liberdade de expressão no ambiente digital',
   'Críticas públicas em redes sociais podem responsabilizar pessoas por atitudes ofensivas, mas também podem se transformar em linchamentos virtuais. O debate envolve direitos, responsabilidade e convivência.',
   'cultura', 140)
) as v(title, context_text, axis, sort_order)
where e.slug = 'enem'
on conflict (title) do nothing;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
