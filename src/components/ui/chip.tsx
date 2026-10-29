import { cn } from '@/lib/utils';

/**
 * Pastilha de filtro do kit — "Risco", "A–Z", "3º bimestre", as matérias no
 * hub de estudo.
 *
 * Ativa é sólida na cor da marca; inativa é `surface-2`. 44px de altura porque
 * é um alvo de toque, e não um rótulo: no kit elas ficam em fileira rolável, e
 * uma fileira de alvos de 32px no polegar erra mais do que acerta.
 */
export function Chip({
  active,
  className,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors',
        active ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted hover:text-text',
        className,
      )}
      {...props}
    />
  );
}

/** Versão em link, para filtros que vivem na URL. */
export function ChipLink({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<'a'> & { active?: boolean }) {
  return (
    <a
      aria-current={active ? 'true' : undefined}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors',
        active ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted hover:text-text',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
