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
    background_color: '#f6f7f9',
    theme_color: '#7c3aed',
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
