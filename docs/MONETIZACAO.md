# Nexa — planos, pagamento e anúncios

## Duas casas no mesmo sistema

| | Nexa Escolas | Nexa padrão (Estudos / Vestibular) |
|---|---|---|
| Quem | Quem tem escola vinculada, ou acessa pelo endereço da escola (ex.: `anglomorumbi.nexastudy.com.br`) | Contas sem escola |
| Anúncios | **Nunca** | Só no plano grátis |
| Plano pago / tela Nexa Pro | **Não existe** (a rota `/pro` redireciona; os endpoints de pagamento respondem 403) | Grátis, Plus, Pro |
| Quem paga | O contrato da escola | A pessoa, pelo Stripe |

A decisão é única, em `getPlanInfo()` (`src/features/billing/server/entitlements.ts`):
1. Endereço de escola → `school`, sempre (vale até para quem ainda não entrou).
2. Perfil com `school_id` → o banco (`my_plan()`) devolve `school`, mesmo que exista assinatura.
3. Senão, assinatura ativa → `plus` / `pro`; senão `free`.
4. Qualquer falha (SQL não rodou, rede) → `free`. **Nunca** `school` nem pago por engano.

Os números (limites por plano, preços exibidos) ficam em `src/features/billing/lib/plans.ts`.

## Limites por plano

| | Escola | Grátis | Plus | Pro |
|---|---|---|---|---|
| Materiais na Biblioteca | 30 | 10 | 60 | 300 |
| Limite diário de IA | ×1 | ×1 | ×3 | ×8 |
| Anúncios | não | sim | não | não |

## Stripe

Fluxo: `/pro` → `POST /api/billing/checkout` → Stripe Checkout → webhook `POST /api/stripe/webhook` → tabela `subscriptions` → `my_plan()`.
O Stripe é a fonte da verdade; o banco guarda o espelho (escrito só pelo webhook, com a chave de serviço).

Configuração (uma vez):
1. Stripe → Products: criar **Nexa Plus** e **Nexa Pro**, cada um com preço mensal e anual (R$ 14,90 / 149,00 e R$ 29,90 / 299,00 — se mudar, ajuste `PLAN_PRICES`). Copiar os 4 IDs `price_...` para as variáveis `STRIPE_PRICE_*`.
2. Stripe → Developers → Webhooks → endpoint `https://<site>/api/stripe/webhook` com os eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.dispute.created`, `charge.refunded`, `radar.early_fraud_warning.created` (os quatro últimos viram avisos em `billing_alerts`). Copiar o segredo para `STRIPE_WEBHOOK_SECRET`.
3. Stripe → Settings → Billing → Customer portal: ativar (troca de cartão, faturas, cancelamento).
4. Variáveis na Hostinger: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `SUPABASE_SERVICE_ROLE_KEY`.
5. Testar com chaves de teste (`sk_test_`) e o cartão `4242 4242 4242 4242` antes de virar para as chaves reais.

Segurança: o webhook confere a assinatura do corpo cru (`src/lib/stripe/signature.ts`, com tolerância de 5 min) e ignora eventos repetidos (`stripe_events`).
Dados de cartão **nunca** passam pelo Nexa: o pagamento acontece na página do Stripe.

## Anúncios

- **Web (AdSense):** o código do site (`ca-pub-1522563448244366`) já está no projeto (`src/features/ads/lib/config.ts`) e o `public/ads.txt` também. O script entra nas páginas públicas (entrar, política, termos) — é onde o Google aprova o site — e nunca no endereço de uma escola. Para o banner aparecer no app falta o bloco de anúncio: crie em AdSense → Anúncios → Por bloco de anúncios (Display, responsivo) e coloque o número em `NEXT_PUBLIC_ADSENSE_SLOT_BANNER`. **Desligue os "Anúncios automáticos" no painel do AdSense**: com eles ligados o Google coloca anúncio onde quiser, inclusive onde o Nexa não permite. O banner só entra em telas de "passagem" (`src/features/ads/lib/placement.ts`) — nunca em prova, quiz, revisão, na NexaAI ou na tela de assinatura.
  Pré-requisito do Google: o site precisa ser aprovado no AdSense (domínio próprio, páginas de política de privacidade e termos, conteúdo real).
- **App Android (AdMob):** é nativo, não roda dentro de página web. Só funciona com um app que tenha o SDK do AdMob (ex.: empacotar com Capacitor + plugin AdMob). O APK atual é um empacotamento do site (TWA), então **não mostra AdMob** — hoje ele mostra o AdSense da página, se o Google permitir. O AdMob entra quando o app nativo existir.
- **Menores de idade:** o público é majoritariamente adolescente. Por isso os anúncios são **não personalizados** por padrão. Antes de ligar: declare a faixa etária no AdSense/AdMob e use a marcação "voltado a crianças" se houver menores de 13; o Google restringe anúncios para esse público. Isso é decisão sua e vale conversar com um jurídico.
- **CSP:** com o AdSense configurado, `next.config.ts` libera os endereços do Google na política (hoje em modo "só relatar").

## Riscos e regras de loja

- **Google Play:** assinatura de conteúdo digital dentro de app distribuído na Play deve usar o **Google Play Billing**; levar o usuário a pagar por fora (Stripe) pode violar a política. Por isso, **dentro do app da Play a tela Nexa Pro só mostra o plano, sem botão de assinar**. Quem assina pelo site (navegador) tem o plano valendo também no app. Se quiser vender dentro do app, o caminho é Play Billing (ou os programas de cobrança alternativa do Google, se disponíveis no Brasil na época).
- **LGPD:** atualizar a política de privacidade com Stripe (pagamento), Google (anúncios) e a base legal. Pagantes menores de idade precisam de responsável.
- **Escolas:** a separação é por regra de negócio e testada no banco (`supabase/tests/74_planos.test.sql`). Ainda assim, confira na prática: entrar com conta da escola e abrir `/pro` deve voltar para `/hoje`, sem anúncios em lugar nenhum.
