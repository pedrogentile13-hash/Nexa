# Decisões de arquitetura

Registro das decisões que moldam o Nexa, com o raciocínio por trás delas. Onde
uma decisão **diverge da especificação** (`docs/readme-oficial/`), isso está
marcado explicitamente — a especificação continua sendo a fonte da verdade, e
toda divergência aqui foi aprovada antes de ser implementada.

---

## ADR-001 · Período letivo (`terms`) como entidade de primeira classe

**Divergência da spec.** O modelo da Parte 2 não tem nenhuma tabela de período.

**Contexto.** O Dashboard pede "meta do bimestre" e "evolução"; o Desempenho
pede "histórico". Nada disso é expressável sem saber a qual período uma nota
pertence.

**Decisão.** `academic_years` → `terms` → `subject_terms`. Toda nota pertence a
um `subject_term` (disciplina × período), que é a unidade sobre a qual toda
média é calculada.

**Consequências.** Uma tabela de junção a mais no caminho de escrita. Em troca,
"média do 2º bimestre", gráficos de evolução e histórico entre anos são
consultas triviais — e adicionar isso depois exigiria reescrever a camada
inteira de notas.

---

## ADR-002 · Esquemas de avaliação reutilizáveis

**Divergência da spec.** A Parte 2 prende `assessment_categories` a `subject_id`.

**Contexto.** 15 disciplinas × 3 categorias × 4 bimestres = 180 linhas para o
aluno criar e manter. Mudar "PB de 35% para 40%" seriam 15 edições separadas —
o oposto direto da regra de "máximo 3 cliques".

**Decisão.** `grading_schemes` + `grading_scheme_categories`, aplicados por
`subject_terms.scheme_id` (com fallback para o esquema padrão do usuário). Uma
disciplina que avalia diferente aponta para o próprio esquema.

**Consequências.** Um nível de indireção. Um trigger
(`assert_activity_category_matches_scheme`) garante que uma atividade nunca
aponte para categoria de outro esquema — sem ele, uma escrita mal ligada produz
uma média final silenciosamente errada, que é a única classe de bug capaz de
destruir a confiança no produto.

---

## ADR-003 · Percentuais de categoria não precisam somar 100

**Contexto.** O instinto é criar uma constraint "soma = 100". Mas o Supabase faz
uma transação por request REST, então um edit de dois passos (baixar PB, subir
VA) seria rejeitado no meio do caminho.

**Decisão.** Sem constraint. O cálculo **normaliza pela soma real**
(`Σ(média × peso) / Σ(peso)`), então a média final está correta para qualquer
total. A UI mostra um aviso quando não soma 100.

**Consequências.** Nunca há um estado em que o app mostra um número errado.
Testado nos dois lados: PB 40 · VA 40 · QL 30 (soma 110) produz 7,4727, não
lixo.

---

## ADR-004 · As views SQL são a autoridade; o TypeScript é espelho

**Contexto.** Média precisa ser calculada em dois lugares: no servidor, para
listas e dashboards que agregam muitas linhas; e no cliente, para a média subir
no mesmo frame em que o aluno digita a nota. Duas implementações divergem.

**Decisão.** As views (`v_category_averages`, `v_subject_term_averages`,
`v_term_summary`) são a autoridade — é delas que todo consumidor lê. O motor em
`src/features/grades/lib/` existe para UI otimista e simulação what-if.

**Como elas ficam honestas.** As duas suítes rodam os **mesmos fixtures com os
mesmos valores esperados**: exemplo do README → 6,8; três categorias → 7,53;
`drop_lowest` → 8,5; 18/20 → 9. Mudar uma regra sem mudar a outra quebra
metade dos testes.

---

## ADR-005 · RLS em toda tabela, `security_invoker` em toda view

**Contexto.** Com Supabase o cliente fala direto com o Postgres. Sem RLS,
qualquer aluno lê os dados de qualquer outro.

**Decisão.** RLS habilitada nas 20 tabelas. Views criadas com
`WITH (security_invoker = true)` — uma view comum roda com privilégios do dono e
**ignoraria a RLS das tabelas abaixo**, o que vazaria as notas de todos.

**Como isso é garantido.** Duas asserções na suíte SQL varrem o catálogo do
Postgres: nenhuma tabela em `public` sem `relrowsecurity`, nenhuma view sem
`security_invoker`. Uma tabela adicionada amanhã sem RLS quebra o CI.

---

## ADR-006 · XP e streak só mudam por funções `SECURITY DEFINER`

**Contexto.** O caminho óbvio (dar `UPDATE` em `user_stats` ao dono da linha)
significa que qualquer cliente pode setar o próprio XP para um milhão. Com
leaderboard (v3) isso deixa de ser cosmético.

**Decisão.** `user_stats` e `xp_events` são **somente-leitura** para o cliente.
Escritas passam por `award_xp()`, `touch_streak()` e `ensure_user_stats()`.
`xp_events` tem índice único por `(user, source_type, source_id, reason)`, então
um checkbox clicado duas vezes concede XP uma vez só.

---

## ADR-007 · Tudo que é "hoje" usa o fuso do usuário

**Contexto.** Streak, progresso diário e a tela Hoje dependem de onde o dia
começa. Em UTC, o dia de um aluno em Brasília vira às 21h — a sequência
quebraria sozinha, todos os dias, sem ninguém fazer nada errado.

**Decisão.** `profiles.timezone` + `public.user_local_date()`. Toda tabela com
recorte diário guarda `local_date` (não um timestamp), já convertido.

---

## ADR-008 · Streak com tolerância

**Contexto.** A Parte 3 é explícita: "o estudante nunca deve sentir que está
sendo cobrado". Uma sequência que zera em um dia perdido é a razão mais comum de
abandono nesta categoria de app.

**Decisão.** Um "freeze" por semana ISO, concedido automaticamente. Exatamente
um dia perdido com freeze disponível → a sequência continua e o freeze é gasto.
Dois dias → reinicia em 1, mas `longest_streak` é preservado: o recorde é a
parte que vale guardar.

---

## ADR-009 · Escala de nota como dado, não como suposição

**Divergência da spec.** A Parte 2 assume 0–10 implicitamente e limita peso a
0–10.

**Decisão.** `grading_schemes` carrega `grade_min`, `grade_max`,
`passing_grade`, `decimals` e `rounding_mode`. `activities.max_score` guarda a
escala em que a nota foi dada, e tudo é normalizado antes de entrar na média —
uma prova de 20 pontos e uma de 10 convivem na mesma categoria. Peso é numérico
positivo, sem teto.

---

## ADR-010 · Substitutiva e descarte da menor nota

**Divergência da spec** (ausência). Realidade das escolas brasileiras que o
modelo original não comportava.

**Decisão.** `activities.replaces_activity_id` (uma substitutiva **com nota**
aposenta a que ela substitui) e `grading_scheme_categories.drop_lowest` (descarta
as N menores). O descarte considera apenas atividades elegíveis, então uma linha
ainda sem nota nunca consome uma vaga de descarte — o aluno perde a pior nota
real, que é para isso que a regra existe.

---

## ADR-011 · Catálogo de disciplinas vs. disciplina do aluno

**Contexto.** "As disciplinas nunca serão fixas no código" — mas fazer cada
aluno digitar as mesmas 15 é péssimo onboarding.

**Decisão.** `subject_catalog` (compartilhado, semeado, somente leitura) e
`subjects` (a disciplina _do aluno_: cor, meta, professor). Onboarding converte
seleções do catálogo em `subjects` com um toque cada. `catalog_id` nulo = uma
disciplina totalmente customizada, e nada quebra.

---

## ADR-012 · Escritas por Server Actions, não pelo SDK no cliente

**Decisão.** O client SDK é usado para auth, realtime e upload no Storage.
Escritas de dados passam por Server Actions com validação Zod.

**Motivo.** RLS é a fronteira de _segurança_, mas não valida regra de negócio nem
concede XP nem invalida cache. Um caminho único de escrita mantém isso em um
lugar só. O feedback imediato exigido pela spec vem de `useOptimistic` + o motor
de cálculo em TS, não de escrever direto do cliente.

---

## ADR-013 · Fundir Dashboard em Desempenho

**Divergência da spec.** A Parte 1 lista seis telas.

**Contexto.** As listas de bullets de Dashboard e Desempenho são quase
idênticas (média geral, evolução, sequência, metas, médias por disciplina).
Duas telas respondendo "como estou?" contradizem o princípio de uma pergunta por
tela — e seis itens não cabem confortavelmente numa bottom nav de iPhone.

**Decisão.** Bottom nav com quatro: **Hoje · Agenda · Disciplinas ·
Desempenho**. Perfil no avatar do header. Desempenho abre com o estado atual e
desce para tendência e histórico.

---

## ADR-014 · `type`, nunca `interface`, em `database.types.ts`

**Contexto.** Custou um bug real durante a Etapa 1.

**Detalhe.** O postgrest-js restringe cada tabela a `Row: Record<string, unknown>`.
TypeScript **não** dá índice implícito a `interface`, só a alias de tipo — então
uma row declarada como `interface` reprova a constraint em silêncio, o schema
inteiro cai no fallback, e **todo `.select()` do projeto** vira `never`, sem
nenhum erro apontando para perto da causa.

**Decisão.** Todas as rows são `type`. Documentado no topo do arquivo.

---

## ADR-015 · PWA e dark mode na v1

**Divergência da spec** (ausência).

**Motivo.** A Parte 3 exige que o Nexa "nunca pareça um site adaptado". No
iPhone, o que produz isso é concreto: `display: standalone`, `viewport-fit=cover`,
safe-area insets, sem bounce de scroll. Dark mode entra porque estudante estuda
à noite, e porque cor escolhida agora (tokens com valor claro **e** escuro) sai
de graça, enquanto retrofitar depois é auditar cada arquivo.

**Pendência conhecida.** Ícones raster (180/192/512 + maskable) ainda não
existem — o manifest lista só o SVG, porque listar arquivo inexistente
invalidaria o manifest silenciosamente.
