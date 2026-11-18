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
    <main className="pb-safe flex min-h-dvh flex-col lg:flex-row">
      <header
        className="pt-safe rounded-b-[20px] px-6 pt-6 pb-8 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:rounded-none lg:px-16 lg:py-16"
        style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
      >
        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md">
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

          <h1 className="mt-5 text-2xl leading-tight font-semibold tracking-tight lg:mt-8 lg:text-4xl">
            {title}
          </h1>
          <div className="mt-2 text-sm leading-relaxed opacity-90 lg:mt-4 lg:text-lg">
            {description}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center px-5 pt-6 pb-8 lg:px-16">
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
