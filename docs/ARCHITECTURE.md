# Arquitetura

Como o Nexa é montado. O _porquê_ de cada escolha está em
[`DECISIONS.md`](DECISIONS.md); aqui é o mapa.

---

## Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  App Router · Server Components por padrão                  │
│  "use client" só nas folhas: charts, timer, formulários      │
└────────────┬────────────────────────────────┬───────────────┘
             │ leitura                        │ escrita
             ▼                                ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│  features/*/server/        │   │  Server Actions + Zod      │
│  queries tipadas           │   │  caminho ÚNICO de escrita  │
└────────────┬───────────────┘   └────────────┬───────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase · PostgreSQL                                      │
│  RLS em toda tabela · views security_invoker                │
│  as views SÃO a autoridade sobre qualquer média             │
└─────────────────────────────────────────────────────────────┘
```

O motor em `features/grades/lib/` roda **dos dois lados**: no servidor para
render inicial, no cliente para UI otimista e simulação. É puro — não conhece
Supabase, não conhece React.

---

## Organização por feature

```
src/features/<feature>/
├── index.ts        # superfície pública — o resto do app importa só daqui
├── types.ts        # tipos de domínio, sem banco
├── lib/            # lógica pura + testes ao lado
├── server/         # queries, mappers row→domínio, Server Actions
├── components/     # UI da feature
└── hooks/          # hooks da feature
```

Regras:

- Nada fora de `features/x` importa de dentro dela — só de `features/x`.
- `components/ui/` é só primitivo genérico (Button, Card, Badge). Se um
  componente sabe o que é uma nota, ele mora na feature.
- `lib/` (raiz) é cola de framework: Supabase, env, design tokens, `cn`.

---

## Banco de dados

```
schools          academic_years ──< terms
   │                                  │
profiles                              │
   │                                  │
subject_catalog ──< subjects ──┬──────┴──> subject_terms ──< activities
                               │                 │              │
                               │            grading_schemes ──< grading_scheme_categories
                               │
                    ┌──────────┼──────────┬──────────────┐
                    ▼          ▼          ▼              ▼
              timetable_slots tasks  study_sessions  attachments
                                │
                          routines ──< routine_completions

user_stats · xp_events · achievements ──< user_achievements
```

**Views de cálculo** (a autoridade sobre médias):

| View                       | Responde                                          |
| -------------------------- | ------------------------------------------------- |
| `v_subject_terms_resolved` | qual esquema esta disciplina×período usa          |
| `v_activities_effective`   | esta nota conta? normalizada para que valor?      |
| `v_category_averages`      | média de PB / VA / Qualitativa                    |
| `v_subject_term_averages`  | média final da disciplina + cobertura do bimestre |
| `v_term_summary`           | média geral, disciplinas críticas, pendências     |

**Convenções**

- `user_id` desnormalizado em toda tabela filha — deixa as policies de RLS
  usarem índice em vez de fazer join por linha.
- `local_date` (não timestamp) em tudo que tem recorte diário.
- `created_at` / `updated_at` em tudo, com trigger `set_updated_at`.

---

## Segurança

| Camada                           | O que garante                                    |
| -------------------------------- | ------------------------------------------------ |
| RLS                              | um aluno nunca lê nem escreve linha de outro     |
| `security_invoker` nas views     | as views não furam a RLS de baixo                |
| Zod nas Server Actions           | payload inválido não chega ao banco              |
| Funções `SECURITY DEFINER`       | XP, streak e stats só mudam pelo caminho oficial |
| Storage por prefixo `<user_id>/` | arquivo de um aluno é inacessível a outro        |

Duas asserções na suíte SQL varrem o catálogo do Postgres e falham se qualquer
tabela ficar sem RLS ou qualquer view sem `security_invoker`.

---

## Design system

- **Tokens semânticos** (`--surface`, `--border`, `--text-muted`) em `globals.css`,
  expostos ao Tailwind por `@theme inline`. Componentes nunca usam cor crua.
- **Dark mode** por classe `.dark`, aplicada antes do primeiro paint por script
  inline no `<head>` — sem flash branco em cold start.
- **Cores de disciplina** são tokens com valor claro _e_ escuro
  (`lib/design/subject-colors.ts`), nunca hex livre: gráficos permanecem
  legíveis e o tema escuro não quebra.
- **Toque ≥ 44px**, safe areas do iPhone (`pt-safe`, `pb-nav`),
  `prefers-reduced-motion` respeitado globalmente.

---

## Testes

| Suíte    | Onde               | O que cobre                                                                      |
| -------- | ------------------ | -------------------------------------------------------------------------------- |
| SQL      | `supabase/tests/`  | onboarding atômico, matemática de notas, RLS, gamificação, invariantes de schema |
| Unitário | `src/**/*.test.ts` | motor de cálculo, solver de meta, arredondamento                                 |

As duas rodam os **mesmos fixtures com os mesmos valores esperados**. É isso que
impede as views e o motor em TS de divergirem.

```bash
npm run verify        # typecheck + lint + unitários
scripts/test-db.sh    # migrations + seed + suíte SQL num banco descartável
```

---

## Rotas

| Rota                               | Papel                                                    |
| ---------------------------------- | -------------------------------------------------------- |
| `/login`                           | magic link + Google; público                             |
| `/auth/callback` · `/auth/confirm` | troca de código e verificação do link                    |
| `/bem-vindo`                       | onboarding de 3 passos → `bootstrap_student()`           |
| `/hoje`                            | a tela âncora: foco, checklist, cronômetro, progresso    |
| `/disciplinas`                     | médias do período, ordenadas por quem precisa de atenção |
| `/desempenho`                      | números do período (gráficos na Etapa 5)                 |
| `/agenda`                          | Etapa 5                                                  |
| `/perfil`                          | dados, tema, conquistas, sair                            |

O `middleware.ts` na raiz aplica três regras antes de qualquer tela renderizar:
sem sessão → `/login` (guardando o destino); onboarding pendente → `/bem-vindo`;
já dentro e batendo em `/login` → `/hoje`. É por isso que o app nunca renderiza
um dashboard vazio.

---

## Próximas camadas (Etapas 4–5)

- `features/grades/server/actions.ts` — lançamento de nota com `useOptimistic`
  sobre o motor de cálculo, e a UI do solver "quanto preciso tirar".
- `features/agenda/` — calendário mensal, semanal e lista, lendo das mesmas
  tabelas que a Hoje já consome.
- `features/performance/` — gráficos Recharts sobre `v_term_summary` e o
  histórico por período.
