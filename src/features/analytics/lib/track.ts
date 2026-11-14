/**
 * Eventos de uso do produto no Google Analytics. Só nomes fixos e valores curtos e fixos: NUNCA texto digitado,
 * nome, e-mail ou id de pessoa. Sem consentimento de medição, não sai nada (o Analytics nem foi carregado).
 */
export type TrackEvent =
  | { name: 'journey_chosen'; journey: 'school' | 'vestibular' | 'both' }
  | { name: 'nexa_ia_message'; platform: 'school' | 'vestibular' | 'unknown' }
  | { name: 'essay_file_read' }
  | { name: 'pro_view'; plan: string }
  | { name: 'pro_checkout_start'; plan: 'plus' | 'pro'; interval: 'month' | 'year' }
  | { name: 'pro_checkout_success' };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __nxAnalytics?: boolean;
  }
}

export function track(event: TrackEvent): void {
  try {
    if (typeof window === 'undefined' || !window.__nxAnalytics || !window.gtag) return;
    const { name, ...params } = event;
    window.gtag('event', name, params);
  } catch {
    // medição nunca derruba a tela
  }
}
