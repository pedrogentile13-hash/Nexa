import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // O JSX dos testes é compilado com o runtime automático — sem isso o Vitest
  // exige `import React` em cada arquivo, que o resto do projeto (Next 15,
  // React 19) não usa em lugar nenhum.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    // `.tsx` entrou junto com o renderizador de markdown: ele produz nós React
    // e a única forma honesta de provar que não executa HTML é renderizando.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
