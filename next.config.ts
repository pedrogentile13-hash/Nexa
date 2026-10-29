import type { NextConfig } from 'next';

/**
 * Cabeçalhos de segurança, em todas as páginas.
 *
 * O que vale desde já: ninguém embute o Nexa em outro site (clickjacking), o
 * navegador não "adivinha" tipos de arquivo, só HTTPS, e câmera/microfone/GPS ficam
 * desligados. A política de conteúdo (CSP) tem duas partes: a parte segura é
 * OBRIGATÓRIA; a parte que restringe scripts e conexões vai em modo "só relatar"
 * (aparece no console do navegador, não bloqueia) até a escola validar o app sem
 * nenhuma violação — aí é só trocar para obrigatória.
 */
const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const isDev = process.env.NODE_ENV !== 'production';

const strictCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost || '*.supabase.co'}`,
  `media-src 'self' blob: https://${supabaseHost || '*.supabase.co'}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost || '*.supabase.co'} wss://${supabaseHost || '*.supabase.co'}`,
  "frame-src 'self' blob: about:",
  "worker-src 'self' blob:",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Obrigatório: não segura nada que o app use hoje.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  // Só relata: mostra no console o que a política completa bloquearia.
  { key: 'Content-Security-Policy-Report-Only', value: strictCsp },
];

const nextConfig: NextConfig = {
  // A tela de Matérias foi retirada (o boletim agora está em Desempenho).
  async redirects() {
    return [
      { source: '/disciplinas', destination: '/estudar', permanent: false },
      { source: '/disciplinas/:path*', destination: '/estudar', permanent: false },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    // Notas são objetos minúsculos, mas o material de estudo do aluno (PDF/imagem,
    // até 12 MB no total) também sobe por Server Action — com 1 MB o envio falhava.
    serverActions: { bodySizeLimit: '14mb' },
  },
  // Thumbnails e imagens de conteúdo vêm do bucket público do Supabase
  // Storage — sem isto, `next/image` recusa a URL (hostname não configurado)
  // em produção, mesmo funcionando em `next dev`.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/**' }],
  },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  // `pdf-parse` (via `pdfjs-dist`) carrega o binário nativo de `@napi-rs/canvas`
  // com um `require()` dentro de um try/catch — invisível para o rastreador de
  // arquivos do Next, que por conta disso deixa o binário de fora do pacote da
  // função serverless. Sem ele, `pdfjs-dist` não consegue polyfillar `DOMMatrix`
  // e todo processamento de PDF quebra em produção (funciona local, onde
  // `node_modules` está inteiro no disco). Isto força a inclusão manual.
  outputFileTracingIncludes: {
    '/nexa-ia/**': [
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**',
    ],
    '/admin/conteudo/**': [
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**',
    ],
  },
};

export default nextConfig;
