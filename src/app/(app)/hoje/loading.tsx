import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto da tela Hoje.
 *
 * A forma imita o layout real — bloco de progresso, três cards de foco,
 * checklist. Um spinner genérico faria a tela "pular" quando o conteúdo
 * chegasse; o esqueleto mantém a página parada.
 */
export default function TodayLoading() {
  return (
    <>
      <div className="pt-safe mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="size-10 rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-4 px-4">
        <Skeleton className="h-36 rounded-lg" />

        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      </div>
    </>
  );
}
