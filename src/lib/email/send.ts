import nodemailer from 'nodemailer';

/**
 * Envio de e-mail do Nexa por SMTP (ex.: a caixa de e-mail da Hostinger).
 * Variáveis (só no servidor): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM.
 * Sem elas, nada é enviado e quem chama segue normalmente: e-mail nunca derruba um pagamento.
 */

export function emailConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.EMAIL_FROM);
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** `true` se enviou. Nunca lança: falha vira `false` (e fica no log do servidor, sem dados da pessoa). */
export async function sendEmail(mail: OutgoingEmail): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transport.sendMail({ from: process.env.EMAIL_FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
    return true;
  } catch (error) {
    console.error('[email] falha ao enviar', error instanceof Error ? error.message : 'erro');
    return false;
  }
}
