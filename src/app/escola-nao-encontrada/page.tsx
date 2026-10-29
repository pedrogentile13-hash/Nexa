import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Escola não encontrada' };

/**
 * Endereço de escola que o banco desconhece (digitado errado, ou escola
 * desativada). Fica FORA do Nexa geral de propósito: cair no login do Nexa
 * normal faria um erro de digitação parecer outro produto.
 */
export default function SchoolNotFoundPage() {
  return (
    <main className="pb-safe grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Escola não encontrada</h1>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Este endereço não está ligado a nenhuma escola. Confira o link que a sua escola enviou ou fale com a
          secretaria.
        </p>
      </div>
    </main>
  );
}
