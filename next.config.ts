import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    // Keeps Server Action payloads small; grade edits are tiny objects.
    serverActions: { bodySizeLimit: '1mb' },
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
    '/admin/conteudo/**': [
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**',
    ],
  },
};

export default nextConfig;
