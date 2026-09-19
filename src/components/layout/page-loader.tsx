import { BrandLoader } from './brand-loader';

/**
 * O carregamento de qualquer tela do app.
 *
 * Mesma peça da abertura (`BrandLoader`), então trocar de aba e abrir o app
 * mostram a mesma coisa.
 *
 * A altura é `100dvh` menos 8.5rem, e esse número não é chute: o cabeçalho
 * mede ~4.25rem e o `pb-nav` que o layout aplica ao conteúdo mede exatamente
 * 4.25rem. Descontar os dois faz o centro desta caixa cair em 50dvh — o meio
 * real da tela. Com `72dvh` (o valor anterior) a marca parava perto de 37%,
 * que é o "muito pra cima" que se via.
 */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[calc(100dvh-8.5rem)] items-center justify-center"
    >
      <BrandLoader label={label} />
    </div>
  );
}
