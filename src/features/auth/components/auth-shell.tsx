import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, GraduationCap } from 'lucide-react';

/**
 * Moldura das telas de autenticação.
 *
 * O bloco de marca em degradê é o que o kit usa no login, e ele precisa ser o
 * mesmo em recuperar e redefinir senha — três telas do mesmo fluxo com três
 * topos diferentes fazem o aluno achar que saiu do app no meio do caminho.
 */
export function AuthShell({
  title,
  description,
  backHref,
  children,
}: {
  title: string;
  description: React.ReactNode;
  backHref?: Route;
  children: React.ReactNode;
}) {
  return (
    <main className="pb-safe flex min-h-dvh flex-col">
      <header
        className="pt-safe rounded-b-[20px] px-6 pt-6 pb-8"
        style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
      >
        <div className="mx-auto w-full max-w-sm">
          {backHref ? (
            <Link
              href={backHref}
              className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium opacity-90 hover:opacity-100"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Link>
          ) : (
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm"
            >
              <GraduationCap className="size-6" />
            </span>
          )}

          <h1 className="mt-5 text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
          <div className="mt-2 text-sm leading-relaxed opacity-90">{description}</div>
        </div>
      </header>

      <div className="flex-1 px-5 pt-6 pb-8">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
