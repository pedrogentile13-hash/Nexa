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
    // Only the SVG is listed because only the SVG exists. Raster icons are a
    // design asset, not code: iOS ignores SVG for the home-screen icon and
    // Android wants a `maskable` PNG, so 180/192/512 PNGs plus a maskable
    // variant still need to be produced before install looks right on a phone.
    // Listing files that do not exist would make the manifest silently invalid.
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
