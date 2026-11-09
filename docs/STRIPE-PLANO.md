# Stripe — plano de integração do Nexa (Billing + Invoicing)

Gerado a partir das boas práticas do plugin Stripe e da revisão do código existente. O servidor MCP do Stripe
(`stripe_implementation_planner`) não estava disponível nesta sessão: o plugin precisa ser recarregado e autenticado
em https://mcp.stripe.com pela própria pessoa. Quando estiver, rode o planner e compare com este documento.

## O que já existe (e está certo)
- Checkout hospedado + Portal do cliente (`/api/billing/checkout`, `/api/billing/portal`), sem `payment_method_types`.
- Webhook com assinatura HMAC e idempotência (`stripe_events`); `subscriptions` como espelho; plano via `my_plan()`.
- Google Play: sem pagamento externo dentro do app (política).

## Melhorias feitas nesta rodada
1. Webhook resolve o dono pela tabela `billing_customers` (cliente do Stripe) e só usa `metadata.user_id` como reserva.
2. Se gravar no banco falhar, o evento é liberado e o webhook responde 503 → o Stripe reenvia (antes o evento era perdido).
3. Novos eventos: `invoice.paid` (fecha avisos), `invoice.payment_failed`, `charge.dispute.created`, `charge.refunded`,
   `radar.early_fraud_warning.created` → tabela `billing_alerts` (só administrador lê).
4. `STRIPE_API_VERSION` opcional fixa a versão da API.

## Faça no Stripe (sandbox primeiro)
- Um **Product por plano** (Plus, Pro), cada um com preço mensal e anual em BRL → variáveis `STRIPE_PRICE_*`.
- Chave **restrita** (`rk_`) no servidor: Checkout Sessions (write), Customers (write), Subscriptions (read),
  Billing Portal (write), Charges (read), Invoices (write, para Nexa Escolas). Só em `STRIPE_SECRET_KEY` na Hostinger.
- Webhook em `https://nexastudy.com.br/api/stripe/webhook` com os 9 eventos de `HANDLED_EVENTS`.
- Portal: ligar cancelamento, troca de plano e atualização do cartão.
- Só depois de testar no sandbox, repetir em produção.

## Invoicing — Nexa Escolas (a construir)
- Colégios pagam por **fatura** (`collection_method=send_invoice`, `days_until_due` 15–30), não por cartão.
- Preço por aluno: `quantity` = nº de alunos ativos; atualizar a cada ciclo.
- Mapear `school_billing` ↔ `customer` do Stripe; guardar CNPJ como `tax_id` (`br_cnpj`).
- Fatura hospedada (link/PDF) enviada pelo Stripe; `invoice.paid` / `invoice.payment_failed` já alimentam `billing_alerts`.
- Decisão pendente do fundador: preço por aluno/ano ou valor fixo por escola.

## Stripe Tax (nota)
Stripe Tax calcula e cobra impostos indiretos, mas **não emite NFS-e brasileira**. Para o Brasil, a nota fiscal de
serviço continua a cargo da contabilidade/emissor municipal; confirme com seu contador antes de cobrar escolas.

## Segurança
Nunca cole chaves no chat nem no código. Se quiser que eu chame a API do Stripe, use o formulário seguro de
credencial da sessão (chave restrita de sandbox).
