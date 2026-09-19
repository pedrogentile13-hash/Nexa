import type { MetadataRoute } from 'next';

/**
 * PWA manifest.
 *
 * `display: standalone` + `orientation: portrait` is what makes an installed
 * Nexa behave like the app README Parte 3 asks for rather than a bookmark:
 * no browser chrome, no accidental landscape on a phone, its own task switcher
 * entry.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexa Study — Seu estudo, mais longe.',
    short_name: 'Nexa Study',
    description:
      'Organize sua vida acadêmica: o que fazer hoje, seu desempenho automático, sua rotina e sua evolução.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    // Branco, não o fundo do app (#f6f7f9): esta cor é a do splash NATIVO do
    // Android, gerado no build do APK a partir dela + do ícone 512. O cinza
    // deixava a tela de abertura com cara de página não carregada.
    background_color: '#ffffff',
    // A cor da barra de STATUS (em cima) no app instalado. Estava roxa
    // (`--brand`) enquanto o app inteiro é claro — o TWA pega este valor no
    // build, então a faixa de cima destoava de tudo. Agora é o mesmo fundo do
    // app, igual ao `viewport.themeColor` do layout raiz, que é quem manda no
    // navegador. Os dois apontavam pra cores diferentes; agora não mais.
    theme_color: '#f6f7f9',
    categories: ['education', 'productivity'],
    // Gerados por scripts/generate-icons.mjs a partir de public/brand/logo-mark-src.png
    // (a arte oficial da marca). 192/512 e maskable são necessários e nenhum
    // substitui o outro:
    //   • 192/512  — o que o Android usa na tela inicial e no splash
    //   • maskable — recortado na forma do sistema (círculo, squircle, gota);
    //                sem ele o Android desenha o ícone dentro de um quadrado
    //                branco, que é a cara de app mal instalado
    // O favicon vem de src/app/icon.png, e o ícone do iOS de
    // src/app/apple-icon.png — os dois seguem a convenção de arquivo do Next,
    // que já publica as tags <link> certas sozinho.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
