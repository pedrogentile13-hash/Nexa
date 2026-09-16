import Link from 'next/link';

/**
 * Moldura das páginas legais (Política de Privacidade, Termos de Uso).
 *
 * Texto longo pede uma coluna de leitura, não o painel em degradê do
 * `AuthShell` — este grupo de rotas fica fora de `(app)` e `(auth)` de
 * propósito: são páginas públicas (sem sessão), mas não fazem parte do fluxo
 * de entrar/cadastrar.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-border bg-surface pt-safe sticky top-0 z-10 border-b">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve */}
          <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-6 shrink-0" />
          <Link href="/login" className="text-sm font-semibold">
            Nexa Study
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
