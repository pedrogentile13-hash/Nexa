-- ============================================================================
-- Alertas de cobrança: falha de pagamento, disputa, reembolso e alerta de
-- fraude do Stripe. Só o webhook escreve (chave de serviço); só o administrador
-- geral lê. Servem para ninguém descobrir uma disputa só quando o dinheiro
-- já foi embora.
-- ============================================================================

create table if not exists public.billing_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_customer_id text,
  kind text not null check (kind in ('payment_failed', 'dispute', 'refund', 'fraud_warning')),
  stripe_object_id text,
  amount_cents integer,
  currency text,
  detail text check (detail is null or length(detail) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists billing_alerts_open_idx on public.billing_alerts (created_at desc) where resolved_at is null;
create index if not exists billing_alerts_customer_idx on public.billing_alerts (stripe_customer_id, kind);

alter table public.billing_alerts enable row level security;

drop policy if exists billing_alerts_select_admin on public.billing_alerts;
create policy billing_alerts_select_admin on public.billing_alerts
  for select to authenticated using (public.is_admin());

drop policy if exists billing_alerts_update_admin on public.billing_alerts;
create policy billing_alerts_update_admin on public.billing_alerts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
