# Nexa

> **Your Academic Operating System.**

Nexa organiza toda a vida acadêmica do estudante em um só lugar: o que fazer
hoje, as notas, a rotina, a agenda e a evolução. O foco não é estudar — é
**organização, rotina, desempenho e acompanhamento**.

Cada tela responde exatamente uma pergunta:

| Tela            | Pergunta                 |
| --------------- | ------------------------ |
| **Hoje**        | O que fazer agora?       |
| **Agenda**      | O que vem pela frente?   |
| **Disciplinas** | O que sei?               |
| **Desempenho**  | Como estou / evoluindo?  |
| **Perfil**      | Quem sou e minhas metas? |

A especificação oficial do produto está em `docs/readme-oficial/` (Partes 1, 2 e 3) e é a fonte da verdade. As divergências deliberadas entre a especificação e o
que foi construído estão registradas — com justificativa — em
[`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Estado atual

**Todas as 5 etapas da v1.0 concluídas.** O Nexa está funcional de ponta a ponta:
login, onboarding, tela Hoje, lançamento de notas, agenda, gráficos de desempenho
e perfil editável.

| Etapa | Escopo                                                                | Status |
| ----- | --------------------------------------------------------------------- | ------ |
| 0     | Scaffold, TypeScript estrito, Tailwind, design tokens, PWA, testes    | ✅     |
| 1     | Schema completo + RLS + views de cálculo + motor de notas testado     | ✅     |
| 2     | Auth (senha + link + Google) + onboarding de 60s + shell de navegação | ✅     |
| 3     | Tela **Hoje** (algoritmo de foco, checklist, timer, progresso)        | ✅     |
| 4     | Disciplinas + lançamento de notas + solver "quanto preciso tirar"     | ✅     |
| 5     | Agenda + Desempenho + Perfil + gamificação                            | ✅     |

O que já está pronto e verificável:

- **20 tabelas**, **24 policies** — Row Level Security em 100% delas, verificado
  por asserção que varre o catálogo do Postgres.
- **5 views** de cálculo de média, todas `security_invoker`.
- **`bootstrap_student()`** — onboarding completo em uma transação.
- **Motor de notas** em TypeScript, espelho das views, com solver de meta.
- **Login com e-mail e senha, link por e-mail e Google**, com guarda contra open redirect.
- **Aba Estudar** com sete formatos de material: resumos, simulados, quiz, podcasts, vídeos,
  imagens (com modo flashcard) e músicas — mais trilha gamificada por matéria.
- **Painel `/admin`** para cadastrar tudo isso, com biblioteca própria por escola.
- **Instalável na tela inicial** (PWA), com instruções próprias para iOS.
- **Onboarding de 3 passos** que já sai com tudo pré-preenchido.
- **Tela Hoje** com algoritmo de foco explicável, checklist otimista e
  cronômetro de estudo.
- **Caderno de notas** com média recalculada a cada tecla e salvamento automático.
- **Solver de meta** — "você precisa de 8,6 em cada avaliação que falta".
- **Agenda** com grade mensal e lista contínua, projetada sobre as tabelas
  existentes (não há tabela `events`).
- **Gráficos de desempenho** com paleta validada para daltonismo, mais uma
  tabela equivalente para quem não lê gráfico.
- **Perfil editável**, incluindo o fuso horário.
- **139 verificações**: 73 asserções SQL contra um Postgres real + 66 testes
  unitários.

### O que ainda não existe

- **Conquistas desbloqueiam sozinhas** — as definições estão no banco e a tela
  as lista, mas ninguém avalia os critérios ainda. Precisa de um gatilho por
  métrica (`streak_days`, `study_minutes`, `grades_logged`…).
- **Upload de arquivos e resumos** por disciplina — tabela `attachments` e o
  bucket do Storage estão prontos; falta a interface.
- **Grade horária editável** — `timetable_slots` alimenta a tela Hoje, mas ainda
  não há tela para preencher.
- **Criar e arquivar disciplinas** depois do onboarding.
- **Ícones raster do PWA** — o manifest lista só o SVG; PNG 180/192/512 e
  maskable são ativo de design ainda por produzir.

---

## Stack

| Camada      | Escolha                                                             |
| ----------- | ------------------------------------------------------------------- |
| Framework   | Next.js 15 (App Router, Server Components)                          |
| Linguagem   | TypeScript estrito (`noUncheckedIndexedAccess` incluído)            |
| Estilo      | Tailwind CSS v4 + tokens semânticos + dark mode                     |
| Componentes | shadcn/ui (Radix) — escritos no repositório, não instalados via CLI |
| Banco       | Supabase · PostgreSQL · Auth · Storage                              |
| Gráficos    | Recharts                                                            |
| Animação    | Framer Motion                                                       |
| Ícones      | Lucide                                                              |
| Testes      | Vitest (lógica) + suíte SQL (banco)                                 |

---

## Como rodar

```bash
npm install
cp .env.example .env.local     # preencha com os valores do seu projeto Supabase
npm run dev
```

### Preparar o banco no Supabase (sem instalar nada)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No projeto: **SQL Editor → New query**
3. Cole todo o conteúdo de [`supabase/setup-completo.sql`](supabase/setup-completo.sql) e **Run**

Isso cria as 20 tabelas, as políticas de RLS, as 5 views de cálculo, as funções e
os dados de catálogo. Depois, copie de **Project Settings → API**:

| Variável                        | De onde vem           |
| ------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` `public` |

A chave `anon` é pública por definição — quem protege os dados é a RLS. Nunca use
a `service_role`.

### Configurar a autenticação (Authentication → no painel do Supabase)

O app oferece três formas de entrar, e elas exigem coisas diferentes do projeto.
**E-mail e senha funciona sem configuração nenhuma** — é o caminho que sempre
existe. Os outros dois dependem de um ajuste no painel:

| Forma           | O que precisa no painel                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| E-mail + senha  | nada — já vem habilitado                                                                                   |
| Link por e-mail | um SMTP que entregue: o remetente padrão do Supabase é limitado a poucos e-mails por hora e só para o time |
| Google          | **Authentication → Providers → Google** habilitado, com Client ID e Secret                                 |

Duas configurações valem para todos:

1. **Authentication → URL Configuration**
   - _Site URL_: a URL do seu deploy (ex.: `https://seu-site.netlify.app`)
   - _Redirect URLs_: adicione `https://seu-site.netlify.app/auth/**` e, para
     desenvolvimento, `http://localhost:3000/auth/**`

   Sem isso o Supabase recusa o retorno e o aluno volta para o login sem entrar.

2. **Authentication → Providers → Email → Confirm email**
   - **Desligado**: a conta já entra no ato de criar. É o recomendado enquanto
     não houver SMTP próprio configurado.
   - **Ligado**: o aluno precisa clicar num link antes de entrar — e aí o envio
     de e-mail passa a ser obrigatório para qualquer conta nova.

O app trata os dois casos: com confirmação ligada, a tela avisa que falta
confirmar o e-mail em vez de tentar entrar e falhar em silêncio.

### Banco local (alternativa, requer [Supabase CLI](https://supabase.com/docs/guides/cli) e Docker)

```bash
supabase start                 # aplica migrations + seed automaticamente
npm run db:types               # regenera src/types/database.types.ts
```

### Virar administrador do painel

O painel `/admin` é onde as escolas, as matérias, os resumos, os simulados, os
podcasts, os vídeos, as imagens e as trilhas são cadastrados. Ele só abre para
quem tem papel de administrador — e o PRIMEIRO administrador precisa ser nomeado
pelo SQL Editor, porque não existe administrador anterior para nomeá-lo.

1. Crie sua conta normalmente pela tela de login do app
2. No Supabase: **SQL Editor → New query**, cole e rode:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'SEU-EMAIL-AQUI');
```

3. Recarregue o app e acesse `/admin`

Daí em diante, novos administradores são criados pelo próprio painel, em
**Pessoas**. Há dois papéis:

| Papel               | Alcance                                                       |
| ------------------- | ------------------------------------------------------------- |
| **Admin geral**     | tudo: escolas, catálogo de matérias, papéis e todo o conteúdo |
| **Admin da escola** | só o conteúdo da escola dele — não vê nem edita as outras     |

Um aluno não consegue se promover: há uma trava no banco que recusa a mudança de
papel vinda de quem não é administrador.

### Como o conteúdo chega ao aluno

Um item publicado sem escola (`school_id` nulo) é **global** — todo aluno vê. Um
item preso a uma escola só aparece para os alunos dela. O aluno enxerga a união
das duas coisas, então uma escola ganha biblioteca própria sem perder o acervo
compartilhado.

Nada aparece enquanto o interruptor **Publicado** estiver desligado.

### Enviar áudio, vídeo e imagem

O upload acontece dentro do formulário de conteúdo e vai direto para o bucket
`nexa-content`, criado pelo `setup-completo.sql`. Ele é público para leitura e
restrito a administradores na escrita — material de estudo publicado não é
segredo, e URL assinada expiraria no meio de um podcast de 20 minutos.

O que **não** deve subir ali: prova antes da aplicação, gabarito em PDF, ou
qualquer arquivo cujo vazamento importe. O gabarito de quiz e simulado vive em
tabelas fechadas, que nem o aluno consegue ler.

### Verificação

```bash
npm run verify                 # typecheck + lint + testes unitários
npm test                       # só os testes unitários
scripts/test-db.sh             # aplica migrations + seed + suíte SQL num banco descartável
```

O `scripts/test-db.sh` sobe um banco novo, roda todas as migrations, o seed e as
asserções SQL. Ele usa `PGHOST`/`PGPORT`/`PGUSER` do ambiente — não precisa do
Supabase CLI, só de um Postgres acessível.

---

## Estrutura

Organização **por feature**, não por tipo de arquivo. Uma pasta `components/`
com 200 arquivos é o destino inevitável da alternativa.

```
src/
├── app/                       # rotas (App Router), layout, globals.css, manifest
├── components/
│   └── ui/                    # primitivos reutilizáveis (Button, Card, Badge…)
├── features/
│   └── grades/                # domínio de notas
│       ├── types.ts           # tipos puros, sem banco
│       ├── lib/               # motor de cálculo, solver, arredondamento
│       └── server/            # mappers row → domínio
├── lib/
│   ├── design/                # paleta de disciplinas, tokens em TS
│   ├── supabase/              # clients (browser, server, middleware)
│   ├── env.ts                 # ambiente validado com Zod
│   └── utils.ts
└── types/
    └── database.types.ts      # contrato do banco (gerado)

supabase/
├── migrations/                # schema versionado — a fonte da verdade
├── seed.sql                   # dados de catálogo (disciplinas, conquistas)
└── tests/                     # suíte SQL + stub do schema `auth`

docs/
├── ARCHITECTURE.md            # como o sistema é montado e por quê
├── DECISIONS.md               # ADRs: divergências da spec, com justificativa
└── readme-oficial/            # a especificação original (Partes 1, 2 e 3)
```

---

## Decisões que valem saber de antemão

1. **As views SQL são a autoridade sobre qualquer média.** O motor em TypeScript
   é espelho, para UI otimista e simulação. As duas implementações rodam os
   mesmos fixtures com os mesmos valores esperados — mexer em uma quebra a outra.
2. **Escritas passam por Server Actions**, nunca pelo client SDK. RLS é a
   fronteira de segurança; o caminho único de escrita é o que evita reimplementar
   regra de negócio por tela.
3. **`user_stats` e `xp_events` são somente-leitura para o cliente.** XP e streak
   só mudam por funções `SECURITY DEFINER`.
4. **Todo "hoje" é calculado no fuso do usuário** (`public.user_local_date`).
   Em UTC, o dia do aluno viraria às 21h de Brasília e a sequência quebraria só.
5. **Percentuais de categoria não são obrigados a somar 100.** O cálculo
   normaliza pela soma real, então a média nunca fica errada durante uma edição.

O raciocínio completo de cada uma está em [`docs/DECISIONS.md`](docs/DECISIONS.md).
