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

---

## ADR-016 · O "Foco de hoje" é um algoritmo explicável, não uma lista por data

**Divergência da spec** (ausência). A Parte 1 dedica a tela mais importante do
produto à pergunta "o que preciso fazer hoje?" e não define como responder.

**Contexto.** Ordenar por data não responde. A PB que vale 35% da média daqui a
três dias importa mais que a lição de amanhã, e o aluno sabe disso — se o app
não souber, ele para de confiar na ordem e volta a decidir sozinho, que é
exatamente o problema que o Nexa existe para resolver.

**Decisão.** `score = urgência × (1 + impacto) × (1 + risco)`, com no máximo
três itens na tela.

- **urgência** decai com a distância da data; atrasado pesa mais que hoje.
- **impacto** é o peso da categoria na média × o peso do item, saturado — peso 7
  não vale sete vezes peso 1.
- **risco** é a distância entre a média atual da disciplina e a aprovação (ou a
  meta que o próprio aluno definiu).

A multiplicação é intencional: um item pesado sem urgência não sobe sozinho, e
um item urgente de disciplina tranquila não afoga um item urgente de disciplina
em risco.

**Cada item carrega o motivo em uma frase** — "Em 3 dias · PB vale 35% da média ·
disciplina abaixo da média". Um ranking que ninguém entende é um ranking em que
ninguém confia.

**Sem nota lançada, o risco é neutro.** Uma disciplina sem dados nunca é
apresentada como problema: a Parte 3 é explícita sobre o aluno nunca sentir
cobrança, e chamar de crítico o que é apenas desconhecido é cobrança sem
fundamento.

---

## ADR-017 · `?next=` sempre passa por `safeNext`

**Contexto.** Um `next` não validado numa página de login é um open redirect — o
buraco exato que um link de phishing quer: `nexa.app/login?next=https://nexa-falso.app`
leva o aluno para outro lugar _depois_ de um login genuíno, então o fluxo inteiro
parece legítimo.

**Decisão.** Um único `safeNext`, usado pela Server Action, pelo callback do
OAuth e pelo confirm do magic link. Ele valida por _parsing_ contra uma origem
descartável, não por regex: os ataques interessantes são truques de codificação
que um regex perde e um parser de URL normaliza — `//host`, barras invertidas que
alguns navegadores dobram, caracteres de controle.

**Testado pela invariante, não pela string.** A suíte roda uma lista de entradas
hostis e afirma que o resultado, resolvido contra a origem real, nunca sai dela.
Isso continua valendo conforme a implementação fica mais estrita.

---

## ADR-018 · A agenda é uma projeção, não uma tabela

**Contexto.** O caminho óbvio para "Agenda" é uma tabela `events`.

**Decisão.** Não existe. A agenda projeta o que já está modelado: `activities`,
`tasks` e `study_sessions`.

**Motivo.** Uma tabela paralela significaria duas verdades sobre a mesma prova —
a linha em `activities` que calcula a média e a linha em `events` que aparece no
calendário. Elas divergem no primeiro dia em que alguém edita uma e esquece a
outra, e aí o aluno vê uma prova na agenda que não conta na média.

**Consequência.** Sessões de estudo do mesmo dia colapsam em uma linha só na
lista: quinze entradas de "estudou Matemática" não são informação, são ruído.

---

## ADR-019 · A paleta dos gráficos tem duas cores, não quatro

**Contexto.** O instinto era colorir as barras com os quatro status do design
system (ok / atenção / abaixo da meta / abaixo da média).

**Decisão.** Duas: `--chart-line` e `--chart-alert`. A nuance "abaixo da meta"
vira rótulo de texto e tooltip.

**Motivo.** O validador de paleta reprovou o par `warning` (#b45309) ×
`danger` (#c2261f): **ΔE 8.0 para visão normal** — abaixo do piso de 15, ou
seja, indistinguível mesmo por quem enxerga todas as cores; e ΔE 2.5 em
deuteranopia. Um aluno não conseguiria diferenciar "atenção" de "abaixo da
média" olhando o gráfico, que é a única coisa que o gráfico precisava comunicar.

Os tokens de gráfico vivem separados dos tokens de UI porque respondem a outro
critério: separação perceptual entre marcas adjacentes, não legibilidade de
texto sobre superfície. O tema escuro tem passos próprios (`#ef5350`, não um
espelho do claro), validados contra a superfície escura.

**Como isso é verificado.** `node scripts/validate_palette.js "<hex,...>"` da
skill `dataviz`, em `--mode light` e `--mode dark`. Não se avalia ΔE no olho.

---

## ADR-020 · E-mail e senha é o caminho principal de entrada

**Contexto.** A v1.0 saiu com dois caminhos de autenticação: link mágico e
Google. Os dois pareciam mais modernos que uma senha, e o link mágico dispensa
o aluno de lembrar de mais uma.

No primeiro deploy real, nenhum dos dois funcionava — e não por bug de código:

- o **link mágico** depende do remetente padrão do Supabase, que entrega poucos
  e-mails por hora e, em projeto novo, só para endereços do próprio time;
- o **Google** só existe depois de alguém habilitar o provider no painel e
  colar Client ID e Secret.

O resultado é a pior falha possível numa tela de login: um projeto recém-criado
onde **não existe nenhuma forma de criar conta**, e a tela não diz por quê.

**Decisão.** Adicionar e-mail + senha como caminho padrão, com o link mágico
rebaixado a alternativa ("prefiro receber um link") e o Google mantido no topo.
`signInWithPassword` e `signUp` não tocam em SMTP nem em provider externo:
funcionam com o projeto no estado em que ele nasce.

**Motivo.** Uma decisão de produto não pode depender de configuração que o dono
do projeto talvez nunca faça. O caminho que sempre funciona precisa ser o
caminho padrão; os que dependem de infraestrutura de terceiros são o extra.

**Consequências.**

- Com _Confirm email_ ligado, `signUp` devolve usuário **sem sessão**. Mandar
  para `/hoje` nesse caso faria o middleware devolver para `/login` sem
  explicação — exatamente o "não funciona" mudo. A ação devolve
  `status: 'confirm'` e a tela avisa o que falta.
- Um `AuthFormState` com `mode` acompanha o erro, para a mensagem aparecer sob
  o formulário que a causou depois do round-trip ao servidor.

---

## ADR-021 · As duas rotas de retorno aceitam os três formatos de link

**Contexto.** `/auth/confirm` lia só `token_hash` + `type`; `/auth/callback`
lia só `code`. O formato do link, porém, não é decisão do app: é do template de
e-mail do projeto Supabase, que varia por painel e por versão.

Com o template padrão, o e-mail leva o aluno para `/auth/confirm?code=…`. A
rota não entendia `code`, respondia "link inválido" e devolvia para o login. A
conta existia, o link era legítimo, e entrar era impossível.

**Decisão.** Um handler único, `completeSignIn`, usado pelas duas rotas, que
aceita:

- `?token_hash=…&type=…` → `verifyOtp`
- `?code=…` → `exchangeCodeForSession`
- `#access_token=…` → fragmento não chega ao servidor; redireciona para
  `/auth/finalizar`, que termina no browser com `setSession` e limpa o
  fragmento do histórico

**Motivo.** O app não controla qual formato chega. Aceitar todos custa trinta
linhas e elimina uma classe inteira de falha em que o usuário não tem nenhuma
pista do que deu errado.

**Consequência.** `/auth/confirm` e `/auth/callback` viram nomes diferentes
para o mesmo comportamento — mantidos separados porque os dois já estão em
templates e allowlists existentes, e renomear quebraria links já enviados.

---

## ADR-022 · O erro do Supabase é traduzido, não engolido

**Contexto.** As ações de auth colapsavam qualquer falha em "não consegui
enviar o link agora, tente novamente em instantes".

**Decisão.** `authErrorMessage` mapeia código e texto do erro para uma frase que
indica a ação: senha errada, e-mail já cadastrado, confirmação pendente, limite
de envio atingido, provider desabilitado.

**Motivo.** "Tente de novo" é a resposta certa para quase nenhuma dessas causas.
Para limite de envio, tentar de novo piora; para provider desabilitado, tentar
mil vezes não resolve — a ação é no painel. Esconder a causa transforma um
problema de configuração de dois minutos numa tarde de tentativa e erro.

**Como isso é verificado.** `src/features/auth/lib/auth-errors.test.ts` — o
mapeador é puro, então cada caso é um teste, incluindo a garantia de que
nenhuma entrada produz string vazia.

---

## ADR-023 · Um `kind` para sete formatos, não sete tabelas

**Contexto.** O kit pede resumo, simulado, quiz, podcast, vídeo, imagem e
música. O caminho óbvio seria uma tabela por formato.

**Decisão.** Uma tabela `resources` com uma coluna `kind`. As cargas úteis
específicas ficam em colunas anuláveis (`body` para o resumo, `storage_path` para
mídia) e em tabelas satélites (`questions`, `resource_chapters`).

**Motivo.** Os sete compartilham tudo o que importa: título, matéria, assunto,
escola, publicação, ordenação, progresso do aluno. O que muda é um campo. Sete
tabelas significariam sete telas de painel, sete consultas de biblioteca, sete
policies de RLS — e sete lugares para esquecer a mesma regra. O que separa os
formatos é a TELA, não o armazenamento, e a tela já é escolhida por `kind`.

**Consequência.** Um formato novo é uma linha no `check` da coluna e um caso no
`ResourceViewer`. Nenhuma migration de tabela.

---

## ADR-024 · O gabarito nunca chega ao navegador

**Contexto.** `questions.explanation` e `question_options.is_correct` são o
gabarito. Simulado e quiz precisam mostrar enunciado e alternativas.

**Decisão.** As duas tabelas não têm policy de SELECT para o aluno. Ele lê as
questões por `quiz_questions()`, responde por `answer_quiz_question()` e só
recebe a resposta certa DEPOIS que a dele foi registrada. `quiz_attempt_review()`
libera o gabarito completo apenas com a tentativa encerrada.

**Motivo.** RLS no Postgres é por linha, não por coluna: não existe policy que
libere o enunciado e esconda a resposta na mesma tabela. Com leitura direta,
bastaria o DevTools para gabaritar qualquer simulado — e um simulado gabaritável
não mede nada, o que destrói o único propósito da funcionalidade.

**Como isso é verificado.** `supabase/tests/20_content.test.sql` afirma que uma
aluna lê **zero** linhas de `question_options` e zero de `questions`, e que
`quiz_questions()` devolve as alternativas sem `is_correct`. A suíte roda como
`authenticated`, não como superusuário, então as policies são exercitadas de
verdade.

---

## ADR-025 · `school_id NULL` significa global

**Contexto.** Cada escola pode ter a própria biblioteca, e existe um acervo
comum que serve a todas.

**Decisão.** `school_id` anulável em `resources`, `content_topics` e `tracks`.
Nulo é global; preenchido é exclusivo. O aluno enxerga a união: `is_published and
(school_id is null or school_id = current_school_id())`.

**Motivo.** A alternativa — duplicar o acervo comum para cada escola — faria uma
correção em um resumo virar N correções, e a divergência apareceria primeiro nos
alunos que menos têm como reclamar. Nulo-como-global também torna o caso mais
comum (conteúdo para todos) o caso que não exige nenhuma decisão de quem cadastra.

**Consequência.** O `school_id` de uma escrita vem sempre do PERFIL de quem
escreve, nunca de um campo do formulário — senão um administrador de escola
publicaria para outra mandando um id diferente.

---

## ADR-026 · O middleware mora em `src/`

**Contexto.** `middleware.ts` estava na raiz do repositório. O projeto usa
diretório `src/`.

**Decisão.** Movido para `src/middleware.ts`, com um teste que falha se voltar.

**Motivo.** Projetos com `src/` fazem o Next procurar o middleware dentro dele.
Na raiz o arquivo é ignorado — sem erro, sem aviso, com o build passando. O
sintoma é o pior tipo possível: tudo parece funcionar, porque a RLS continua
devolvendo vazio para quem não entrou e nenhum dado escapa. O que some é o
portão: rota protegida respondia 200 em vez de mandar para o login, a sessão
nunca era renovada e o desvio para o onboarding nunca acontecia.

**Como isso é verificado.** `src/lib/middleware-location.test.ts`, porque nem
typecheck, nem lint, nem build apontam esse erro. Na dúvida:
`.next/server/middleware-manifest.json` precisa listar o middleware — com
`"middleware": {}` ele não está rodando.

---

## ADR-027 · Duas larguras de página, e a diferença não é estética

**Contexto.** O kit cobre só o celular. No desktop, a escolha era esticar tudo ou
deixar uma coluna estreita no meio de uma tela vazia.

**Decisão.** `PageMain` com `reading` (672px fixo) e `board` (até 1120px).

**Motivo.** Texto corrido tem medida de linha ótima entre 60 e 75 caracteres.
Esticar um resumo até 1400px não aproveita o espaço: piora a leitura, porque o
olho perde a linha ao voltar para a esquerda. Já Hoje, Estudar, Matérias e
Desempenho são feitas de cartões independentes, e ali o espaço extra vira uma
segunda coluna de conteúdo — mais informação visível, mesma legibilidade.

**Armadilha encontrada.** Trocar `space-y` por `grid` nas listas trouxe 38px de
rolagem horizontal no celular: item de grid nasce com `min-width: auto`, e um
título com `truncate` (nowrap) tem min-content igual à largura inteira do texto.
`min-w-0` em cada item resolve. Vale para todo `grid` que contenha texto truncado.

---

## ADR-028 · O degradê do kit foi corrigido por contraste

**Contexto.** O kit especifica cabeçalho em degradê azul→ciano, terminando em
#0ea5e9, com título em branco.

**Decisão.** O fim virou #0369a1. O tema escuro segue o kit sem ajuste.

**Motivo.** Branco sobre #0ea5e9 mede **2,77:1** — reprova até no critério de
texto grande (3:1). O título ficaria ilegível na metade clara da faixa, que é
justamente onde ele fica no desenho. Com #0369a1, o PIOR ponto ao longo de toda
a extensão do degradê fica em 5,17:1, e a passagem azul→ciano continua visível.

Um degradê precisa ser avaliado ao longo da faixa inteira, não nas pontas: o
texto atravessa todos os pontos intermediários.
