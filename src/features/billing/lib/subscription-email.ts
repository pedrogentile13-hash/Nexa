import { PLAN_LABEL, formatBRL, type BillingInterval, type PaidPlan } from './plans';

export interface SubscriptionEmailInput {
  plan: PaidPlan;
  interval: BillingInterval;
  /** Valor da cobrança, em centavos. */
  amountCents: number | null;
  /** Fim do período atual = próxima cobrança (ISO). */
  nextPaymentAt: string | null;
  manageUrl: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const date = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });

/** E-mail de confirmação da assinatura (sem dados sensíveis: nada de cartão, só plano, valor e datas). */
export function subscriptionEmail(input: SubscriptionEmailInput): { subject: string; html: string; text: string } {
  const label = PLAN_LABEL[input.plan];
  const every = input.interval === 'year' ? 'ano' : 'mês';
  const amount = input.amountCents != null ? `${formatBRL(input.amountCents)} por ${every}` : null;
  const next = input.nextPaymentAt ? date.format(new Date(input.nextPaymentAt)) : null;

  const rows: [string, string][] = [['Plano', label], ['Cobrança', input.interval === 'year' ? 'Anual' : 'Mensal']];
  if (amount) rows.push(['Valor', amount]);
  if (next) rows.push(['Próxima cobrança', next]);

  const subject = `Assinatura confirmada: ${label}`;
  const text = [
    `Sua assinatura do ${label} está ativa. Obrigado por estudar com o Nexa!`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Ver fatura, trocar de plano ou cancelar: ${input.manageUrl}`,
    '',
    'Você pode cancelar quando quiser; o plano continua até o fim do período já pago.',
  ].join('\n');

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f5f9;font-family:Arial,Helvetica,sans-serif;color:#1b1738">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#0e7490);padding:28px 28px 24px;color:#ffffff">
<div style="font-size:14px;opacity:.9">Nexa Study</div>
<div style="font-size:26px;font-weight:700;margin-top:6px">Assinatura confirmada</div></td></tr>
<tr><td style="padding:24px 28px">
<p style="margin:0 0 16px;font-size:15px;line-height:1.5">Seu <b>${esc(label)}</b> está ativo. Obrigado por estudar com o Nexa!</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e8f0">
${rows.map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e8f0;font-size:14px;color:#5b5f78">${esc(k)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #e6e8f0;font-size:14px;font-weight:600">${esc(v)}</td></tr>`).join('')}
</table>
<p style="margin:24px 0"><a href="${esc(input.manageUrl)}" style="background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:999px;display:inline-block">Gerenciar assinatura</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#5b5f78">Lá você vê suas faturas, confere a próxima cobrança e pode cancelar quando quiser. O plano continua até o fim do período já pago.</p>
</td></tr></table></td></tr></table></body></html>`;

  return { subject, html, text };
}
