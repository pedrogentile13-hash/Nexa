'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Barra de topo dos visualizadores.
 *
 * `router.back()` em vez de um link fixo para /estudar: o aluno pode ter
 * chegado pela trilha, pela tela Hoje ou pela busca, e devolvê-lo sempre ao hub
 * apagaria o caminho que ele estava seguindo.
 */
export function StudyTopBar({
  title,
  subtitle,
  right,
  transparent,
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  transparent?: boolean;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'pt-safe sticky top-0 z-30 backdrop-blur-lg',
        transparent ? 'bg-transparent' : 'bg-bg/85',
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="text-muted hover:bg-surface-2 hover:text-text grid size-11 shrink-0 place-items-center rounded-full"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-muted truncate text-xs">{subtitle}</p>}
        </div>

        {right}
      </div>
    </header>
  );
}
