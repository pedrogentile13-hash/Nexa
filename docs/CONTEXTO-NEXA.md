# Nexa — contexto completo do projeto

Atualizado em 11/11/2026 (commit `051b22e`). Este documento é a "passagem de bastão" da sessão na nuvem para o Claude local.
Regras de trabalho e de deploy estão no `CLAUDE.md` (raiz). Aqui está **o que o Nexa é, o que já existe, o que mudou por último e o que falta**.

## 1. O que é o Nexa

Plataforma de estudos em português do Brasil, com três "casas" no mesmo sistema:

| Casa                | Para quem                                                   | Como entra                                                                                                | Dinheiro                                                 |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Nexa Study**      | aluno do 6º ano ao 3º EM, por conta própria                 | cadastro com e-mail (código de 6 dígitos)                                                                 | grátis com anúncios, ou Plus/Pro                         |
| **Nexa Vestibular** | quem se prepara para ENEM, Fuvest, Unicamp, Unesp, ITA, IME | mesma conta; troca de plataforma pelo logo                                                                | mesmos planos                                            |
| **Nexa Escolas**    | alunos, professores, coordenação e direção de uma escola    | endereço da escola (ex.: `anglomorumbi.nexastudy.com.br`) ou código da escola; contas criadas pela escola | contrato da escola: sem anúncios e sem cobrança do aluno |

- Dono: estudante fundador (usa muito o celular). Piloto com o **Colégio Anglo Morumbi**. Domínio: `nexastudy.com.br`.
- App Android (Google Play, pacote `br.com.nexastudy.app`): um **Capacitor** que abre o site publicado. Correção no site chega ao app sem nova versão. Detalhes em `docs/APP-ANDROID.md`.

## 2. Tecnologia e onde cada coisa vive

| Peça                   | Onde                                                   | Observação                                                                      |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Código                 | GitHub `pedrogentile13-hash/Nexa`                      | 252 commits                                                                     |
| Site                   | **Hostinger** (Node)                                   | publica sozinha a branch `claude/nexa-review-architecture-o6q9zu` a cada push   |
| Banco, login, arquivos | **Supabase** (Postgres + RLS + Storage `nexa-content`) | 104 migrations; o SQL é rodado à mão no SQL Editor                              |
| IA                     | Gemini (principal) com Groq de reserva                 | tudo passa por `completeWithAI` (`src/lib/ai/provider.ts`), com trava de escopo |
| Pagamentos             | **Stripe** (Billing), sem SDK, por `fetch`             | webhook assinado em `/api/stripe/webhook`                                       |
| E-mail                 | SMTP próprio + modelos do Supabase com a marca         | confirmação de conta e de assinatura                                            |
| Anúncios               | AdSense no plano grátis                                | nunca em prova/quiz/revisão, nunca em escola                                    |
| Monitor                | UptimeRobot (grátis, a cada 5 min) em `/api/health`    | erros 500 são registrados e aparecem em Admin → Erros                           |

Stack: Next.js 15 (App Router, `typedRoutes`), React, TypeScript estrito, Tailwind, Supabase SSR, Zod, Vitest, KaTeX para fórmulas.

## 3. Mapa do código

- `src/app/(app)/…` telas do aluno · `src/app/admin/…` painel geral · `src/app/escola/…` direção/coordenação · `src/app/professor/…` professor · `src/app/api/…` rotas.
- `src/features/<área>/{components,lib,server}`: `lib` é lógica pura com teste; `server` tem Server Actions e leituras.
- `supabase/migrations/` (idempotentes) · `supabase/tests/` (65 arquivos de teste SQL) · `supabase/setup-completo.sql` (gerado, junta tudo).
- `docs/`: `ARCHITECTURE`, `DECISIONS`, `ROADMAP`, `MONETIZACAO`, `STRIPE-PLANO`, `PLANEJAMENTO-VESTIBULAR`, `PLANEJAMENTO-CONTEUDO`, `CONTEUDO-STUDY-LISTA`, `SEGURANCA`, `SEGURANCA-PENDENCIAS`, `APP-ANDROID`, `PLANO-ANGLO`, `MIGRACAO-LOCAL`.
- Qualidade hoje: **494 testes** do app (Vitest) passando, suíte de banco passando, `next build` passando.

## 4. O que o aluno tem hoje

### Nexa Study

- **Hoje** (início), **Biblioteca** (`/estudar`, com filtro por série e idade aproximada), **Agenda**, **Revisões**, **Metas**, **Desempenho** (com **boletim por série**), **Trilhas**, **Simulados**, **Ranking**, **Conquistas**, **Comunidade**, **Perfil**.
- **Conteúdo inicial**: 132 tópicos e 112 pacotes (resumo + quiz de 8 questões com explicação) de Matemática, Ciências, Biologia, Física, Química, Português, História e Geografia. Carregado pelo Admin como rascunho e publicado depois (etiqueta `pacote-nexa-v1`).
- **NexaAI**: tutor com modos, "Explicar com IA" nos resumos, dicas dentro do simulado, leitura de material (PDF/foto) e criação de resumo/quiz pelo aluno.
- **Quadro branco** em toda questão (quiz, simulado, treino, cartão-resposta): caneta, marca-texto, borracha, cores, quadriculado, desfazer. É só rascunho do aluno.

### Nexa Vestibular

- **Início**, **Treinar** (questões avulsas com correção na hora), **Biblioteca** (`/vestibular/provas`: uma estante por banca, com "Simulados e treino" antes de "Provas anteriores"), **Plano de estudo**, **Minhas redações**, **Banco de temas**, **Erros e revisões**, **Desempenho**.
- **Simulados do Nexa**: 8 simulados de 10 questões no estilo ENEM (4 áreas), Fuvest (2), Unicamp e Unesp. São questões originais (etiqueta `pacote-vestibular-v1`, `context = 'vestibular'`).
- **Provas oficiais**: caderno e gabarito abrem dentro do app (o servidor busca o PDF e o entrega pelo endereço do Nexa; só sites oficiais de uma lista, ou PDF enviado ao próprio Nexa).
- **Cartão-resposta**: o aluno faz a prova no caderno, escolhe a **cor do caderno** dele, marca as letras (ou envia a foto do cartão, que a IA lê) e o Nexa corrige com o gabarito daquela cor. Mostra nota por área. O gabarito nunca é legível pelo aluno antes de enviar.
- **Redação**: banco de temas oficiais e inspirados, leitura de redação escrita à mão (foto/PDF), corretor em dois modos:
  - **Básico** (8 moedas): estimativa rápida nas 5 competências.
  - **PRO** (30 moedas): modelo avançado, regras rígidas do ENEM, auditoria do texto (parágrafos, desvios, tese, elementos da proposta, risco de anulação), "o que falta para subir" em cada competência, e calibração com **redações reais já corrigidas** que o admin cadastra.

### Nexa Escolas

- Hierarquia direção › coordenação › professor; turmas e anos; contas criadas pela escola (login e senha, importação por planilha).
- Chat da escola com o bot de cada professor, mural de avisos com confirmação de leitura, eventos, planejamento do professor alimentando a IA, painel com números da escola, pedidos de publicação de conteúdo.
- O Vestibular está disponível também dentro das escolas.

## 5. Planos e a Nexa Coin

| Plano  | Preço                      | Nexa Coins por mês | Anúncios |
| ------ | -------------------------- | ------------------ | -------- |
| Grátis | —                          | 150                | sim      |
| Plus   | R$ 19,90/mês ou R$ 199/ano | 2.000              | não      |
| Pro    | R$ 39,90/mês ou R$ 399/ano | 6.000              | não      |
| Escola | contrato da escola         | 600                | não      |

- **Custos por ação** (`src/lib/ai/coins.ts`): conversa/explicar/dica 1 · leitura de material 2 · resumo 4 · quiz 6 · foto do cartão-resposta 6 · redação Básico 8 · redação PRO 30. Os números de saldo são estimativas iniciais, ajustáveis sem migração.
- O gasto é atômico no banco (`spend_ai_coins`); se a IA falha, as moedas voltam. O chat da equipe da escola tem limite diário próprio e não gasta moedas.
- O Perfil mostra saldo, extrato do mês e tabela de preços. Dentro do app da Play não se vende assinatura (regra da loja).
- A conta do dono tem **Nexa Pro de cortesia** (lista em `NEXA_PRO_FREE_EMAILS`; sem a variável, vale o e-mail padrão do código).
- Stripe: checkout, portal do cliente, cancelamento, faturas, sincronização manual ("Conferir minha assinatura") como rede de segurança do webhook, e-mail de confirmação.

## 6. Painel do administrador

- **Conteúdo**: criar/editar resumos, quizzes, simulados; importar simulado; gerar simulado com IA no estilo de uma banca; cartões para **carregar e publicar** o pacote inicial do Study e os simulados de vestibular.
- **Arquivos das provas**: cadastrar link ou enviar PDF; **Testar** se o Nexa consegue abrir; **envio em massa** em que a IA lê a capa e classifica vestibular, ano, tipo, dia/fase, caderno e cor; para gabaritos, lê também as respostas e salva o gabarito do caderno certo.
- **Gabaritos**: um gabarito por caderno (cor); lê do site, de PDF enviado ou de texto colado; aceita provas que começam em qualquer número (2º dia do ENEM: 91 a 180).
- **Redações-modelo**: redações reais corrigidas que calibram o corretor PRO.
- Também: Trilhas, Matérias, Escolas, Usuários, Contas da escola, Comunidade, Notificações, NexaAI/Bots, Relatórios, Erros, Configurações.
- Padrão que liga caderno e gabarito: **dia + cor** (ex.: "1º dia · Amarelo"), em `src/features/vestibular/lib/classify-file.ts`.

## 7. Últimas mudanças (9 a 11/11/2026), da mais nova para a mais antiga

1. `CLAUDE.md` e guia de migração para o computador, com verificador de ambiente.
2. Nexa Pro de cortesia para a conta do dono.
3. Gabarito em massa com leitura por IA, ligado ao caderno por dia + cor; gabarito pode começar em qualquer questão; botão de admin na Biblioteca para carregar e publicar os simulados.
4. Envio em massa de cadernos e gabaritos com a IA lendo a capa.
5. Gabarito por caderno (cor).
6. "Banco de provas" virou **Biblioteca** do Vestibular, com simulados em prateleira própria.
7. Admin → Arquivos das provas (link, teste, envio de PDF) e mensagens de erro que dizem o motivo.
8. Simulados de vestibular (8 simulados, 80 questões) e enunciado com texto-base separado do comando.
9. Quadro branco nas questões.
10. Nexa Coin e corretor de redação Básico/PRO.
11. Antes disso (9/11): cartão-resposta com leitura de foto, boletim por série, filtro de série, conteúdo do Study, Vestibular nas escolas, telas de erro que tentam de novo sozinhas a cada 10 s, e todo o fluxo do Stripe (checkout, webhook, e-mail, aba Assinatura, preços novos).

## 8. SQL: o que precisa estar rodado no Supabase

O deploy **não** atualiza o banco. Confirme que estas migrations foram rodadas (ou rode o `supabase/setup-completo.sql`, que é seguro repetir):

| Migration                              | Para quê                     | Sem ela                                       |
| -------------------------------------- | ---------------------------- | --------------------------------------------- |
| `20261109000300_billing_alerts`        | alertas de cobrança          | alertas não aparecem                          |
| `20261109000400_escola_com_vestibular` | Vestibular nas escolas       | escola fica sem Vestibular                    |
| `20261109000500_biblioteca_series`     | filtro por série             | filtro não funciona                           |
| `20261109000600_cartao_resposta`       | cartão-resposta e gabarito   | "gabarito em breve" e erro ao salvar gabarito |
| `20261109000700_boletim_por_serie`     | boletim por série            | boletim por série vazio                       |
| `20261110000100_nexa_coins`            | Nexa Coins e redações-modelo | moedas não contam; PRO sem calibração         |
| `20261110000200_gabarito_por_caderno`  | gabarito por cor             | erro ao salvar gabarito com nome de caderno   |

## 9. Pendências e riscos conhecidos

**Para o dono fazer (operação)**

- Confirmar as migrations da seção 8.
- Carregar e publicar os simulados de vestibular (botão de admin em Vestibular → Biblioteca, ou Admin → Conteúdo).
- Enviar os cadernos e gabaritos reais (Admin → Arquivos das provas, envio em massa) e conferir cor, dia e intervalo de questões.
- Cadastrar pelo menos 2 redações-modelo do ENEM para calibrar o corretor PRO.
- Criar `GEMINI_PRO_MODEL` na Hostinger se quiser um modelo específico no PRO (o padrão do código cai para o próximo da lista se o nome não existir).
- Backup da keystore do app Android e das senhas.

**Ainda não verificado**

- Os links do ENEM 2025 foram montados pelo padrão dos anos anteriores e **não foram conferidos**; o botão Testar diz se abrem. Se o INEP bloquear o servidor, a saída é enviar o PDF ao Nexa.
- As telas novas (Nexa Coin, corretor PRO, Biblioteca, envio em massa, gabarito por caderno) passaram em testes automáticos, mas **não foram abertas no app em produção** pela sessão que as criou. A leitura de capa e de gabarito pela IA não foi testada com PDFs reais.
- Erros 500 intermitentes: causa ainda desconhecida; precisa dos logs da Hostinger.

**Falta construir**

- Fatura (Stripe Invoicing) para escolas; trilhas por banca; imagens e gráficos autorais nas questões; mais simulados por banca (ITA, IME, UERJ, UFRGS); resumos e quizzes específicos de vestibular.
- App: AdMob, Google Play Billing e push nativo; tarefas da Play (keystore do `.aab`, testadores).
- Segurança: itens abertos em `docs/SEGURANCA-PENDENCIAS.md` (ex.: recriptografia ligada a `SCHOOL_PASSWORD_KEY`).

## 10. Como validar antes de enviar

```
npm run verify                 # tipos + lint + testes do app
npm run format                 # formatação
bash scripts/build-setup-sql.sh && bash scripts/test-db.sh   # só quando mexer no banco
node scripts/verificar-ambiente.mjs
```

Depois: commit na branch do deploy, **Push origin** no GitHub Desktop, esperar a Hostinger publicar e conferir o site. Se algo quebrar, **Revert** do commit.
