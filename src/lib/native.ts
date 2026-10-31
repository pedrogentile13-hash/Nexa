/**
 * O Nexa rodando DENTRO do app Android (Capacitor). Usado para esconder o que a loja não permite lá:
 * anúncios do AdSense (no app o anúncio é o AdMob) e botão de assinar por fora da Play.
 */
declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

export function isNativeApp(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}
