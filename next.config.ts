import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
