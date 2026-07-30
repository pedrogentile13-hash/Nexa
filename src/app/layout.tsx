import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Nexa',
    template: '%s · Nexa',
  },
  description:
    'Nexa organiza sua vida acadêmica: o que fazer hoje, suas notas, sua rotina e sua evolução em um só lugar.',
  applicationName: 'Nexa',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    // Installed from the iOS share sheet, Nexa opens without Safari chrome —
    // the difference between "an app" and "a website", per README Parte 3.
    capable: true,
    title: 'Nexa',
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
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('nexa-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
