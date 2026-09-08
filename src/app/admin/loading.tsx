import { Skeleton } from '@/components/ui/skeleton';

/**
 * Esqueleto genérico do painel — a barra lateral (`AdminShell`) não passa por
 * aqui, porque `loading.tsx` num segmento só cobre o `children` do layout;
 * quem já viu o painel não vê a navegação piscar ao trocar de seção.
 */
export default function AdminLoading() {
  return (
    <div className="p-5">
      <Skeleton className="mb-1.5 h-6 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </div>
  );
}
