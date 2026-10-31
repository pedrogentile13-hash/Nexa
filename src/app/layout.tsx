import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { AppSplash } from '@/components/layout/app-splash';
import { SchoolBrandProvider } from '@/components/layout/school-brand';
import { ADSENSE_CLIENT, ADSENSE_SCRIPT } from '@/features/ads/lib/config';
import { decodeTenant, tenantCss, TENANT_HEADER } from '@/lib/tenant/resolve';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Nexa Study',
    template: '%s · Nexa Study',
  },
  description:
    'Nexa Study organiza sua vida acadêmica: o que fazer hoje, seu desempenho automático, sua rotina e sua evolução em um só lugar.',
  applicationName: 'Nexa Study',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    // Installed from the iOS share sheet, Nexa Study opens without Safari
    // chrome — the difference between "an app" and "a website", per README
    // Parte 3.
    capable: true,
    title: 'Nexa Study',
    statusBarStyle: 'default',
  },
  formatDetection: {
    // Stops iOS from turning grades and dates into phone-number links.
    telephone: false,
    date: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Content must reach under the notch and the home indicator; the safe-area
  // utilities in globals.css then pad the parts that need it.
  viewportFit: 'cover',
  // Pinch-zoom stays enabled: disabling it is an accessibility regression, and
  // the layout is built so it is never needed.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0c11' },
  ],
};

/**
 * Applies the stored theme before first paint.
 *
 * Without this, a student who chose dark mode sees a white flash on every cold
 * start. It has to be inline and synchronous in <head> — any React-driven
 * approach runs after the browser has already painted.
 */
const themeScript = (lockLogin: boolean) => `
(function () {
  try {
    // No endereço de uma escola a tela de login é sempre clara (pedido da escola).
    if (${lockLogin} && location.pathname === '/login') return;
    var stored = localStorage.getItem('nexa-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Escola do endereço (definida pelo middleware). Só as CORES entram aqui; nome
  // e logo aparecem nas telas que os usam.
  const tenant = decodeTenant((await headers()).get(TENANT_HEADER));
  const tenantStyle = tenantCss(tenant);

  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(Boolean(tenant)) }} />
        {tenantStyle && <style dangerouslySetInnerHTML={{ __html: tenantStyle }} />}
        {/*
          Google AdSense — no HTML bruto da primeira resposta (o rastreador do AdSense não executa JS, então
          `next/script` não serve) e NUNCA no endereço de uma escola: lá não existe anúncio.
          O meta `google-adsense-account` é o segundo método de verificação do site.
        */}
        {!tenant && (
          <>
            <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
            <script async src={ADSENSE_SCRIPT} crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body className="min-h-dvh antialiased">
        <SchoolBrandProvider value={tenant ? { name: tenant.name, logoUrl: tenant.logoUrl } : null}>
          <AppSplash />
          {children}
        </SchoolBrandProvider>
      </body>
    </html>
  );
}
