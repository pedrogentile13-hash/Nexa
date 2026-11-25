/**
 * Onde pode aparecer anúncio no Nexa padrão gratuito.
 *
 * Regra de ouro: nunca no meio do estudo. Nada de anúncio em prova, quiz, revisão, na conversa
 * com a NexaAI nem na tela de assinatura. Só nas telas de "passagem" (início, biblioteca, agenda, desempenho…).
 * Nexa Escolas não chega aqui: `adsEnabled` é falso para quem tem escola.
 */
const ALLOWED = ['/hoje', '/estudar', '/agenda', '/desempenho', '/metas', '/ranking', '/trilhas', '/conquistas', '/vestibular'];
const STUDY_FLOW = /\/(simulado|quiz|prova|sessao|resolver)(\/|$)/;

export function adAllowed(pathname: string): boolean {
  if (STUDY_FLOW.test(pathname)) return false;
  return ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Anúncios personalizados só se ligados no ambiente; o padrão é não personalizado (público é majoritariamente menor de idade). */
export function adsPersonalized(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_ADS_PERSONALIZED === '1';
}
