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

**Etapa 1 de 5 concluída** — fundação, banco de dados e motor de cálculo.

| Etapa | Escopo                                                             | Status |
| ----- | ------------------------------------------------------------------ | ------ |
| 0     | Scaffold, TypeScript estrito, Tailwind, design tokens, PWA, testes | ✅     |
| 1     | Schema completo + RLS + views de cálculo + motor de notas testado  | ✅     |
| 2     | Auth + onboarding de 60s + shell de navegação                      | ⏳     |
| 3     | Tela **Hoje** (algoritmo de foco, checklist, timer, progresso)     | ⏳     |
| 4     | Disciplinas + lançamento de notas + solver "quanto preciso tirar"  | ⏳     |
| 5     | Agenda + Desempenho + Perfil + gamificação                         | ⏳     |

O que já está pronto e verificável:

- **20 tabelas**, **24 policies** — Row Level Security em 100% delas, verificado
  por asserção que varre o catálogo do Postgres.
- **5 views** de cálculo de média, todas `security_invoker`.
- **`bootstrap_student()`** — onboarding completo em uma transação.
- **Motor de notas** em TypeScript, espelho das views, com solver de meta.
- **104 verificações**: 73 asserções SQL contra um Postgres real + 31 testes
  unitários.

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

Banco local (requer [Supabase CLI](https://supabase.com/docs/guides/cli) e Docker):

```bash
supabase start                 # aplica migrations + seed automaticamente
npm run db:types               # regenera src/types/database.types.ts
```

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
