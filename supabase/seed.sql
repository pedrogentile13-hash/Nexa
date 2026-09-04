-- ============================================================================
-- Nexa — seed: shared reference data
--
-- Only catalog data lives here: never a row that belongs to one person. The
-- subject list from README Parte 1 ships as reference data so onboarding is a
-- few taps, and a student can still add anything the catalog does not have.
--
-- `color` values are palette tokens resolved by src/lib/design/subject-colors.ts,
-- not hex codes: charts, badges and dark mode stay legible by construction.
-- ============================================================================

insert into public.subject_catalog (slug, name, area, default_color, default_icon, sort_order)
values
  -- Linguagens
  ('lingua-portuguesa',       'Língua Portuguesa',        'linguagens',  'rose',    'book-open-text',   10),
  ('producao-de-texto',       'Produção de Texto',        'linguagens',  'pink',    'pen-line',         20),
  ('literatura',              'Literatura',               'linguagens',  'fuchsia', 'library-big',      30),
  ('ingles',                  'Inglês',                   'linguagens',  'violet',  'languages',        40),
  ('espanhol',                'Espanhol',                 'linguagens',  'purple',  'languages',        50),
  ('artes',                   'Artes',                    'linguagens',  'orange',  'palette',          60),
  ('educacao-fisica',         'Educação Física',          'linguagens',  'lime',    'volleyball',       70),
  -- Matemática
  ('matematica',              'Matemática',               'matematica',  'blue',    'sigma',           110),
  ('educacao-financeira',     'Educação Financeira',      'matematica',  'emerald', 'piggy-bank',      120),
  -- Ciências da natureza
  ('biologia',                'Biologia',                 'ciencias',    'green',   'leaf',            210),
  ('fisica',                  'Física',                   'ciencias',    'cyan',    'atom',            220),
  ('quimica',                 'Química',                  'ciencias',    'teal',    'flask-conical',   230),
  ('ciencias',                'Ciências',                 'ciencias',    'green',   'microscope',      240),
  ('iniciacao-cientifica',    'Iniciação Científica',     'ciencias',    'sky',     'microscope',      250),
  -- Humanas
  ('historia',                'História',                 'humanas',     'amber',   'landmark',        310),
  ('geografia',               'Geografia',                'humanas',     'yellow',  'globe-2',         320),
  ('filosofia',               'Filosofia',                'humanas',     'slate',   'brain',           330),
  ('sociologia',              'Sociologia',               'humanas',     'stone',   'users',           340),
  ('educacao-socioemocional', 'Educação Socioemocional',  'humanas',     'red',     'heart-handshake',  350),
  ('projeto-de-vida',         'Projeto de Vida',          'humanas',     'orange',  'compass',         360),
  ('ensino-religioso',        'Ensino Religioso',         'humanas',     'stone',   'hand-heart',      370),
  -- Tecnologia
  ('pensamento-computacional','Pensamento Computacional', 'tecnologia',  'indigo',  'binary',          410),
  ('robotica',                'Robótica',                 'tecnologia',  'indigo',  'bot',             420),
  ('empreendedorismo',        'Empreendedorismo',         'tecnologia',  'emerald', 'rocket',          430)
on conflict (slug) do update
  set name = excluded.name,
      area = excluded.area,
      default_color = excluded.default_color,
      default_icon = excluded.default_icon,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------- achievements --
-- Rows, not code: a new achievement ships without a deploy.
-- Tone follows README Parte 3 — every one of these rewards showing up, never
-- punishes falling behind.
insert into public.achievements (id, name, description, icon, category, metric, threshold, xp_reward, sort_order)
values
  ('first_steps',    'Primeiros passos',   'Você configurou o Nexa. Bem-vindo.',                'sparkles',    'geral',        'onboarded',        1,  50,  10),
  ('first_grade',    'Primeira nota',      'Você registrou sua primeira nota.',                 'clipboard-check', 'notas',    'grades_logged',    1,  30,  20),
  ('ten_grades',     'Boletim em dia',     'Dez notas registradas.',                            'clipboard-list',  'notas',    'grades_logged',   10, 100,  30),
  ('first_session',  'Cronômetro ligado',  'Sua primeira sessão de estudo.',                    'timer',       'estudo',       'sessions',         1,  30,  40),
  ('study_10h',      '10 horas de foco',   'Dez horas estudadas no Nexa.',                      'hourglass',   'estudo',       'study_minutes',  600, 200,  50),
  ('study_50h',      '50 horas de foco',   'Cinquenta horas estudadas. Isso é constância.',     'flame',       'estudo',       'study_minutes', 3000, 500,  60),
  ('streak_3',       'Três dias seguidos', 'Você apareceu três dias em sequência.',             'flame',       'constancia',   'streak_days',      3,  60,  70),
  ('streak_7',       'Uma semana inteira', 'Sete dias seguidos de presença.',                   'flame',       'constancia',   'streak_days',      7, 150,  80),
  ('streak_30',      'Um mês de rotina',   'Trinta dias seguidos. Virou hábito.',               'trophy',      'constancia',   'streak_days',     30, 600,  90),
  ('checklist_day',  'Dia completo',       'Você concluiu todo o checklist de um dia.',         'check-check', 'organizacao',  'perfect_days',     1,  40, 100),
  ('checklist_week', 'Semana completa',    'Sete dias de checklist concluído.',                 'calendar-check', 'organizacao', 'perfect_days',   7, 250, 110),
  ('tasks_25',       'Nada esquecido',     'Vinte e cinco tarefas concluídas.',                 'list-checks', 'organizacao',  'tasks_done',      25, 200, 120),
  ('goal_reached',   'Meta batida',        'Uma disciplina alcançou a meta que você definiu.',  'target',      'notas',        'goals_reached',    1, 300, 130),
  ('all_passing',    'Tudo em ordem',      'Todas as disciplinas acima da média no bimestre.',  'shield-check','notas',        'all_passing',      1, 400, 140)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      metric = excluded.metric,
      threshold = excluded.threshold,
      xp_reward = excluded.xp_reward,
      sort_order = excluded.sort_order;

-- ============================================================================
-- Biblioteca inicial · conteúdo global (school_id null)
--
-- Existe para que uma instalação nova NÃO abra a aba Estudar vazia. Um app de
-- estudo que estreia sem nada para estudar não é avaliável: não dá para saber
-- se a tela está certa, se a trilha destrava, se o simulado corrige. Isto é o
-- mínimo para que tudo isso seja verificável no primeiro minuto.
--
-- Ids fixos e `on conflict do nothing` — reaplicar o seed não duplica nada.
-- ============================================================================

insert into public.content_topics (id, subject_catalog_id, name, slug, sort_order)
select v.id, sc.id, v.name, v.slug, v.sort_order
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'fisica',    'Cinemática',       'cinematica',       1),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'fisica',    'Leis de Newton',   'leis-de-newton',   2),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'historia',  'Era Vargas',       'era-vargas',       1),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'biologia',  'Ciclos biogeoquímicos', 'ciclos',      1),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'matematica','Funções',          'funcoes',          1)
) as v(id, subject_slug, name, slug, sort_order)
join public.subject_catalog sc on sc.slug = v.subject_slug
on conflict (id) do nothing;

insert into public.resources
  (id, subject_catalog_id, topic_id, kind, title, subtitle, description, body,
   duration_seconds, difficulty, xp_reward, is_published, sort_order)
select v.id, sc.id, v.topic_id, v.kind, v.title, v.subtitle, v.description, v.body,
       v.duration_seconds, v.difficulty, v.xp_reward, true, v.sort_order
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 'fisica', '10000000-0000-4000-8000-000000000001'::uuid,
   'resumo', 'Cinemática: movimento uniforme e uniformemente variado',
   'Física · 7 min de leitura', 'A base de tudo que cai na primeira prova do bimestre.',
   E'No **movimento uniforme** a velocidade não muda, então a posição cresce em linha reta com o tempo. É o caso mais simples e serve de base para tudo o que vem depois.\n\nNo **movimento uniformemente variado** a aceleração é constante, e a velocidade passa a variar de forma linear. Daí vêm as três equações que costumam aparecer na prova.\n\n### Equações que caem na prova\n\n- v = v₀ + a·t\n- s = s₀ + v₀·t + a·t²/2\n- v² = v₀² + 2·a·Δs\n\nNa **queda livre** a aceleração é a da gravidade, cerca de 9,8 m/s². Um corpo solto do repouso ganha 9,8 m/s de velocidade a cada segundo — e é por isso que a queda livre é só um MUV com a aceleração já conhecida.\n\n> Pegadinha clássica: massa não muda a queda. Uma pedra e uma pena caem juntas no vácuo.',
   420, 'medio', 20, 1),

  ('20000000-0000-4000-8000-000000000002'::uuid, 'historia', '10000000-0000-4000-8000-000000000003'::uuid,
   'resumo', 'Era Vargas: da Revolução de 1930 ao fim do Estado Novo',
   'História · 9 min de leitura', 'Os três períodos, sem decorar data solta.',
   E'A **Era Vargas** vai de 1930 a 1945 e se divide em três períodos.\n\n### Governo Provisório (1930–1934)\n\nVargas chega ao poder pela Revolução de 1930, que encerra a República Velha e a política do café com leite. Governa por decreto.\n\n### Governo Constitucional (1934–1937)\n\nA Constituição de 1934 traz voto feminino e legislação trabalhista. É o período mais curto e mais instável.\n\n### Estado Novo (1937–1945)\n\nO golpe de 1937 instaura a ditadura, com a Constituição outorgada — a "Polaca". Censura pelo DIP, sindicatos atrelados ao Estado e a CLT em 1943.\n\n> O que a prova cobra: ligar cada ano ao que ele significa. 1930 é a Revolução; 1937 é o Estado Novo; 1945 é a queda; 1954 é o suicídio, já no segundo governo.',
   540, 'medio', 20, 1),

  ('20000000-0000-4000-8000-000000000003'::uuid, 'biologia', '10000000-0000-4000-8000-000000000004'::uuid,
   'resumo', 'Ciclo do carbono em cinco passos',
   'Biologia · 5 min de leitura', 'Como o carbono circula entre atmosfera, seres vivos, solo e oceano.',
   E'O carbono circula entre quatro reservatórios: **atmosfera**, **seres vivos**, **solo** e **oceano**.\n\n1. A fotossíntese retira CO₂ da atmosfera e o fixa em matéria orgânica.\n2. A respiração devolve parte desse carbono como CO₂.\n3. A decomposição libera o carbono dos organismos mortos.\n4. Em condições específicas, a matéria orgânica vira combustível fóssil ao longo de milhões de anos.\n5. A queima desses combustíveis devolve à atmosfera, em décadas, o que levou eras para ser guardado.\n\nO desequilíbrio atual está no passo 5: entra mais CO₂ do que a fotossíntese e o oceano conseguem retirar.',
   300, 'facil', 15, 1)
) as v(id, subject_slug, topic_id, kind, title, subtitle, description, body, duration_seconds, difficulty, xp_reward, sort_order)
join public.subject_catalog sc on sc.slug = v.subject_slug
on conflict (id) do nothing;

-- Simulado de Cinemática · 4 questões
insert into public.resources
  (id, subject_catalog_id, topic_id, kind, title, subtitle, description,
   difficulty, time_limit_seconds, xp_reward, is_published, sort_order)
select '20000000-0000-4000-8000-000000000010', sc.id, '10000000-0000-4000-8000-000000000001',
       'simulado', 'Simulado de Cinemática', 'Física · 4 questões',
       'Movimento uniforme, MUV e queda livre no formato da prova.',
       'medio', 1200, 120, true, 1
from public.subject_catalog sc where sc.slug = 'fisica'
on conflict (id) do nothing;

-- Quiz rápido de Era Vargas · 3 questões
insert into public.resources
  (id, subject_catalog_id, topic_id, kind, title, subtitle, description,
   difficulty, xp_reward, is_published, sort_order)
select '20000000-0000-4000-8000-000000000011', sc.id, '10000000-0000-4000-8000-000000000003',
       'quiz', 'Quiz rápido · Era Vargas', 'História · 3 questões · 4 min',
       'Feedback na hora, com o porquê de cada resposta.',
       'facil', 45, true, 1
from public.subject_catalog sc where sc.slug = 'historia'
on conflict (id) do nothing;

insert into public.questions (id, resource_id, topic_id, position, statement, explanation, difficulty)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 1,
   'Um carro parte do repouso com aceleração constante de 2 m/s². Qual a velocidade após 6 segundos?',
   'v = v₀ + a·t. Com v₀ = 0, a = 2 e t = 6: v = 0 + 2 · 6 = 12 m/s.', 'facil'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 2,
   'No movimento uniforme, como a posição varia com o tempo?',
   'Velocidade constante significa que a posição cresce em taxa constante — ou seja, linearmente.', 'facil'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 3,
   'Um corpo cai do repouso. Desprezando a resistência do ar, qual a velocidade após 3 s? (g = 10 m/s²)',
   'Queda livre é MUV com a = g. v = 0 + 10 · 3 = 30 m/s.', 'medio'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000010',
   '10000000-0000-4000-8000-000000000001', 4,
   'Duas esferas de massas diferentes são soltas da mesma altura no vácuo. O que acontece?',
   'No vácuo não há resistência do ar, e a aceleração da gravidade não depende da massa: as duas chegam juntas.', 'medio'),

  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000003', 1,
   'Em que ano começou o Estado Novo?',
   'O Estado Novo começa em 1937, com o golpe e a Constituição outorgada. 1930 é a Revolução; 1945 é o fim do período; 1954 é o suicídio de Vargas.', 'facil'),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000003', 2,
   'Qual documento consolidou a legislação trabalhista em 1943?',
   'A CLT — Consolidação das Leis do Trabalho — reuniu em um texto único a legislação trabalhista construída ao longo da Era Vargas.', 'facil'),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000011',
   '10000000-0000-4000-8000-000000000003', 3,
   'O que a Revolução de 1930 encerrou?',
   'A República Velha e o arranjo do café com leite, em que São Paulo e Minas alternavam a presidência.', 'medio')
on conflict (id) do nothing;

insert into public.question_options (question_id, position, body, is_correct) values
  ('30000000-0000-4000-8000-000000000001', 1, '6 m/s', false),
  ('30000000-0000-4000-8000-000000000001', 2, '12 m/s', true),
  ('30000000-0000-4000-8000-000000000001', 3, '18 m/s', false),
  ('30000000-0000-4000-8000-000000000001', 4, '36 m/s', false),

  ('30000000-0000-4000-8000-000000000002', 1, 'Linearmente', true),
  ('30000000-0000-4000-8000-000000000002', 2, 'Exponencialmente', false),
  ('30000000-0000-4000-8000-000000000002', 3, 'De forma quadrática', false),
  ('30000000-0000-4000-8000-000000000002', 4, 'Não varia', false),

  ('30000000-0000-4000-8000-000000000003', 1, '10 m/s', false),
  ('30000000-0000-4000-8000-000000000003', 2, '20 m/s', false),
  ('30000000-0000-4000-8000-000000000003', 3, '30 m/s', true),
  ('30000000-0000-4000-8000-000000000003', 4, '45 m/s', false),

  ('30000000-0000-4000-8000-000000000004', 1, 'A mais pesada chega primeiro', false),
  ('30000000-0000-4000-8000-000000000004', 2, 'Chegam juntas', true),
  ('30000000-0000-4000-8000-000000000004', 3, 'A mais leve chega primeiro', false),
  ('30000000-0000-4000-8000-000000000004', 4, 'Depende do formato', false),

  ('30000000-0000-4000-8000-000000000010', 1, '1930', false),
  ('30000000-0000-4000-8000-000000000010', 2, '1937', true),
  ('30000000-0000-4000-8000-000000000010', 3, '1945', false),
  ('30000000-0000-4000-8000-000000000010', 4, '1954', false),

  ('30000000-0000-4000-8000-000000000011', 1, 'A Constituição de 1934', false),
  ('30000000-0000-4000-8000-000000000011', 2, 'A CLT', true),
  ('30000000-0000-4000-8000-000000000011', 3, 'O Ato Institucional nº 1', false),
  ('30000000-0000-4000-8000-000000000011', 4, 'A Lei Áurea', false),

  ('30000000-0000-4000-8000-000000000012', 1, 'O Império', false),
  ('30000000-0000-4000-8000-000000000012', 2, 'A República Velha', true),
  ('30000000-0000-4000-8000-000000000012', 3, 'A ditadura militar', false),
  ('30000000-0000-4000-8000-000000000012', 4, 'O Estado Novo', false)
on conflict do nothing;

-- Trilha de Física: três lições encadeadas, cada uma com o material dentro.
insert into public.tracks (id, subject_catalog_id, title, description, is_published, sort_order)
select '40000000-0000-4000-8000-000000000001', sc.id, 'Trilha de Física',
       'Do movimento uniforme às Leis de Newton, uma lição por vez.', true, 1
from public.subject_catalog sc where sc.slug = 'fisica'
on conflict (id) do nothing;

insert into public.track_sections (id, track_id, position, title) values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1, 'Assunto 1 · Cinemática')
on conflict (id) do nothing;

insert into public.track_lessons (id, section_id, position, title, description, estimated_minutes, xp_reward, unlock_after_lesson_id) values
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 1,
   'Movimento uniforme', 'Resumo e quiz para fixar a base.', 12, 20, null),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000001', 2,
   'Movimento variado (MUV)', 'As três equações que caem na prova.', 15, 20,
   '42000000-0000-4000-8000-000000000001'),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000001', 3,
   'Queda livre', 'MUV com a aceleração já conhecida.', 10, 25,
   '42000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into public.track_lesson_resources (lesson_id, resource_id, position) values
  ('42000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1),
  ('42000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000010', 1)
on conflict do nothing;
