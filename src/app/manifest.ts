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
    name: 'Nexa — Your Academic Operating System',
    short_name: 'Nexa',
    description:
      'Organize sua vida acadêmica: o que fazer hoje, suas notas, sua rotina e sua evolução.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    background_color: '#f6f7f9',
    theme_color: '#2563eb',
    categories: ['education', 'productivity'],
    // Gerados por scripts/generate-icons.mjs a partir da mesma arte do
    // icon.svg. Os três são necessários e nenhum substitui o outro:
    //   • SVG      — favicon nítido em qualquer densidade
    //   • 192/512  — o que o Android usa na tela inicial e no splash
    //   • maskable — recortado na forma do sistema (círculo, squircle, gota);
    //                sem ele o Android desenha o ícone dentro de um quadrado
    //                branco, que é a cara de app mal instalado
    // O ícone do iOS não entra aqui: vem de src/app/apple-icon.png, que o Next
    // publica como <link rel="apple-touch-icon">.
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
