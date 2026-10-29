/**
 * Detecção de plataforma para o convite de instalação.
 *
 * Puro e testável de propósito: o comportamento certo depende do navegador, e
 * a diferença é grande demais para ser decidida dentro de um componente com
 * `if (isIOS)` espalhado.
 *
 * Três mundos, três caminhos:
 *
 *   • Chrome/Edge (Android e desktop) — dispara `beforeinstallprompt`. Dá para
 *     abrir o instalador nativo com um toque.
 *   • Safari no iOS — NUNCA dispara o evento, e a Apple não expõe API nenhuma.
 *     A única forma é o aluno usar Compartilhar → Adicionar à Tela de Início,
 *     então o app precisa ENSINAR o caminho em vez de oferecer um botão.
 *   • Firefox e afins — não instalam. Não se oferece o que não existe.
 */

export type InstallPlatform = 'prompt' | 'ios' | 'unsupported' | 'installed';

export interface PlatformInput {
  userAgent: string;
  /** `display-mode: standalone` casa, ou `navigator.standalone` no iOS. */
  isStandalone: boolean;
  /** O navegador já ofereceu o evento nativo nesta sessão? */
  hasNativePrompt: boolean;
}

export function isIOS(userAgent: string): boolean {
  // iPadOS 13+ se declara como Macintosh; o que o denuncia é o toque, checado
  // por quem chama. Aqui fica o que dá para ver na string.
  return /iPad|iPhone|iPod/.test(userAgent);
}

export function isSafari(userAgent: string): boolean {
  return /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/.test(userAgent);
}

export function detectPlatform(input: PlatformInput): InstallPlatform {
  if (input.isStandalone) return 'installed';
  if (input.hasNativePrompt) return 'prompt';

  // No iOS todo navegador roda o motor do Safari, e todos instalam pelo mesmo
  // caminho da folha de compartilhamento — então a instrução vale para todos.
  if (isIOS(input.userAgent)) return 'ios';

  return 'unsupported';
}

/**
 * Quando voltar a convidar depois de uma recusa.
 *
 * Um banner que reaparece a cada visita é o motivo pelo qual as pessoas
 * aprenderam a fechar banner sem ler. Duas semanas é tempo de o aluno ter usado
 * o app o bastante para a oferta fazer sentido — e, se ele recusar de novo, o
 * app entende que a resposta é não.
 */
export const DISMISS_DAYS = 14;
export const DISMISS_KEY = 'nexa:install-dismissed-at';
export const DISMISS_COUNT_KEY = 'nexa:install-dismiss-count';
/** Recusou duas vezes: a resposta é não, e não se pergunta de novo. */
export const MAX_DISMISSALS = 2;

export function shouldOffer(
  dismissedAt: string | null,
  dismissCount: number,
  now: Date = new Date(),
): boolean {
  if (dismissCount >= MAX_DISMISSALS) return false;
  if (!dismissedAt) return true;

  const parsed = Date.parse(dismissedAt);
  if (Number.isNaN(parsed)) return true;

  const days = (now.getTime() - parsed) / 86_400_000;
  return days >= DISMISS_DAYS;
}
