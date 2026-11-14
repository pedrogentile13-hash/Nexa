# Nexa — guia para o Claude (leia primeiro)

Nexa Study / Nexa Vestibular / Nexa Escolas. Next.js 15 (App Router, typedRoutes) + Supabase (Postgres, RLS) + Tailwind, em português do Brasil.
Domínio: nexastudy.com.br. Dono: estudante fundador, usa muito o celular. Piloto com o Colégio Anglo Morumbi.

**Contexto completo do projeto (o que existe, últimas mudanças, pendências): `docs/CONTEXTO-NEXA.md`. Leia antes de começar uma tarefa grande.**

## Como trabalhar com o dono (combinados fixos)

- **Aja sem perguntar** quando a decisão é óbvia. Pergunte só o que só o dono pode decidir.
- **Todo SQL vai na mensagem do chat**, completo e pronto para colar no SQL Editor do Supabase (o banco NÃO é atualizado pelo deploy).
- **Nunca peça, mostre ou cole segredos no chat** (chave service role, Stripe, SMTP, keystore, senhas). Segredos vivem na Hostinger e no `.env.local`.
- **Termine as respostas com uma lista curta "Para você fazer"**, em passos numerados, fácil de ler no celular.
- Respostas diretas, em português, sem enrolação. Diga com franqueza o que foi testado e o que não foi.

## Git e deploy (delicado — não quebre)

- A **Hostinger publica sozinha** a branch **`claude/nexa-review-architecture-o6q9zu`**. **Nunca** renomeie, apague, recrie ou faça force push nela.
- A `main` está desatualizada e **não** é usada no deploy. Não trabalhe nela. Existe o PR #1 (rascunho) dessa branch.
- Faça **commits pequenos e claros** nessa branch. O dono envia (Push) pelo **GitHub Desktop**; se ele pedir, você pode fazer o push.
- Antes de qualquer commit: `npm run verify` (tipos + lint + testes) e `npm run format`. Teste de banco: ver abaixo.
- Se der problema em produção: **Revert** do commit ruim (nunca reescrever histórico).
- Guia completo da migração para o computador: `docs/MIGRACAO-LOCAL.md`. Verificador: `node scripts/verificar-ambiente.mjs`.

## Ambiente local

- Node 22+ (funciona no 24). `npm ci` (nunca `npm audit fix`, mexe nas versões). `npm run dev` em http://localhost:3000.
- A pasta do projeto **não pode ter `:` nem espaços no caminho** (quebra o `npm`). Local: `~/Projetos/Nexa`.
- O `.env.local` aponta para o **Supabase real**: o que se faz logado acontece em produção. **Stripe local = só chaves de teste.**
- Nunca commitar `.env*` (exceto `.env.example`).

## Banco de dados (Supabase)

- Migrations em `supabase/migrations/` (idempotentes). Toda migration termina com:
  `revoke execute on all functions in schema public from public, anon;` + `grant execute` de `resolve_school_host` e `report_error` ao `anon`.
- Funções `security definer` sempre com `set search_path = public`.
- `bash scripts/build-setup-sql.sh` regenera `supabase/setup-completo.sql` (junta tudo; seguro rodar de novo). **Rode antes de `scripts/test-db.sh`** (o teste de idempotência reaplica esse arquivo).
- Testes de banco: `bash scripts/test-db.sh` (Postgres local; precisa de `pg_ctl`; o teste de idempotência confere o número de tabelas — hoje 99). Testes em `supabase/tests/NN_nome.test.sql`.
- Tipos do banco são escritos à mão em `src/types/database.types.ts`: ao criar tabela/função, atualize lá.
- Depois de criar página nova, rode `npx next typegen` (typedRoutes) antes do `tsc`.
- O app **falha aberto** quando uma função nova ainda não existe no banco (IA e telas seguem funcionando); sempre diga ao dono qual SQL rodar.

## Estrutura (resumo)

- `src/features/<área>/{components,lib,server}`: `lib` é puro e testável (vitest); `server` tem Server Actions e queries.
- Planos: `school | free | plus | pro` em `src/features/billing/lib/plans.ts`; `getPlanInfo()` decide. Nexa Pro de cortesia só para o e-mail do dono (`NEXA_PRO_FREE_EMAILS`).
- **Nexa Coin** (créditos de IA): `src/lib/ai/coins.ts` (custos e saldo mensal por plano), gasto atômico no banco (`spend_ai_coins`), estorno se a IA falha. Chat da equipe tem limite diário próprio.
- Stripe sem SDK (`fetch`), webhook assinado, idempotência em `stripe_events`. Google Play: sem pagamento externo dentro do app (TWA).
- IA: `completeWithAI` em `src/lib/ai/provider.ts` (Gemini com reserva Groq; `GEMINI_MODEL`, `GEMINI_PRO_MODEL` para o corretor PRO).
- Vestibular: Biblioteca em `/vestibular/provas` (estantes por banca), simulados em `src/features/content/seed/vestibular/`, cartão-resposta com gabarito por caderno (cor) e leitura da foto pela IA, corretor de redação Básico/PRO calibrado com redações reais (Admin → Redações-modelo), quadro branco nas questões.
- Admin: Arquivos das provas (envio em massa com a IA lendo a capa), Gabaritos, Conteúdo (carregar/publicar pacotes), Redações-modelo.
- O gabarito oficial **nunca** é legível pelo aluno (RLS só admin; correção dentro de `submit_exam_attempt`).

## Pendências conhecidas

- Rodar no Supabase as migrations recentes (lista em `docs/MIGRACAO-LOCAL.md`, seção 8).
- Cadastrar gabaritos reais por caderno e conferir os links do ENEM 2025 (Admin → Arquivos das provas → Testar).
- Falta: fatura (Stripe Invoicing) para escolas, trilhas por banca, imagens/gráficos autorais nas questões, tarefas da Play Store (keystore do `.aab`, testadores), investigar os erros 500 intermitentes (precisa dos logs da Hostinger).
- Mais contexto: `docs/PLANEJAMENTO-VESTIBULAR.md`, `docs/MONETIZACAO.md`, `docs/STRIPE-PLANO.md`, `docs/SEGURANCA-PENDENCIAS.md`, `docs/ROADMAP.md`.
