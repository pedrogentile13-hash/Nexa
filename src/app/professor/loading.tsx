import { PageLoader } from '@/components/layout/page-loader';

/**
 * Carregamento de todas as telas desta área.
 *
 * `loading.tsx` num segmento vira o fallback de Suspense só do `children` do
 * layout — a navegação lateral e o rodapé continuam na tela e clicáveis, só
 * a área de conteúdo troca. É isso que faz a troca de aba parecer instantânea
 * mesmo quando os dados demoram.
 */
export default function Loading() {
  return <PageLoader />;
}
