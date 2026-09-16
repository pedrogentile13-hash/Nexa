import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto genérico das telas do app.
 *
 * Só `/hoje` tinha um `loading.tsx` próprio — todo o resto ficava com a tela
 * em branco parada durante a busca de dados no servidor, o que faz a
 * navegação parecer muito mais lenta do que é (nenhum feedback visual até o
 * conteúdo inteiro chegar). Este arquivo cobre TODAS as outras rotas de uma
 * vez: `loading.tsx` num segmento vira o fallback de Suspense só do
 * `children` do layout, então a coluna lateral/rodapé continuam visíveis —
 * só a área de conteúdo pisca o esqueleto. A forma é genérica de propósito
 * (cabeçalho + tiles + blocos), não uma cópia de nenhuma tela específica.
 */
export default function AppLoading() {
  return (
    <>
      <header className="pt-safe bg-bg/85 sticky top-0 z-30 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <Skeleton className="size-9 shrink-0 rounded-full" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] space-y-4 px-4 pt-4 md:px-6 md:pt-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </>
  );
}
