import { BrandLoader } from './brand-loader';

/**
 * O carregamento de qualquer tela do app.
 *
 * Mesma peça da abertura (`BrandLoader`), então trocar de aba e abrir o app
 * mostram a mesma coisa.
 *
 * `min-h` em vez de `h-dvh`: o rodapé de navegação ocupa a base da tela no
 * celular, e centralizar na altura cheia da janela jogaria a marca atrás
 * dele. 72dvh centraliza no espaço que sobra entre cabeçalho e rodapé.
 */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[72dvh] items-center justify-center">
      <BrandLoader label={label} />
    </div>
  );
}
