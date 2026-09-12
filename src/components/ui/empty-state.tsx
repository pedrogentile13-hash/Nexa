import { cn } from '@/lib/utils';

/**
 * O estado vazio "pop": selo em degradê + título + descrição + próximo passo.
 *
 * Extraído do padrão que nasceu em `FocusList` (Hoje vazio) — um texto cinza
 * sozinho não diz o que fazer a seguir, e cada tela reinventando o mesmo bloco
 * é como a inconsistência visual se instala sem ninguém decidir isso de
 * propósito. Toda tela vazia do Nexa deveria passar por aqui.
 */

type Tone = 'brand' | 'success' | 'warning';

const TONE_GRADIENT: Record<Tone, string> = {
  brand: 'from-brand to-brand-hover',
  success: 'from-success to-success/80',
  warning: 'from-warning to-warning/80',
};

export interface PopEmptyStateProps {
  /** Ícone central do selo — passe já com `className="text-white"` etc. */
  icon: React.ReactNode;
  tone?: Tone;
  /** Ícone pequeno sobreposto no canto do selo, tipo o brilho de "conquista". */
  badge?: React.ReactNode;
  title: string;
  description?: string;
  /** Botões/links do próximo passo. Omita quando genuinamente não há ação. */
  action?: React.ReactNode;
  /** `sm` para blocos dentro de listas menores (ex.: um dia vazio na agenda). */
  size?: 'sm' | 'md';
  className?: string;
}

export function PopEmptyState({
  icon,
  tone = 'brand',
  badge,
  title,
  description,
  action,
  size = 'md',
  className,
}: PopEmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border bg-surface flex flex-col items-center gap-4 rounded-[20px] border text-center',
        size === 'md' ? 'px-6 py-10 lg:py-14' : 'px-4 py-7',
        className,
      )}
    >
      <div
        className={cn(
          'relative grid place-items-center rounded-[32%] bg-gradient-to-br shadow-md',
          TONE_GRADIENT[tone],
          size === 'md' ? 'size-14' : 'size-11',
        )}
      >
        {icon}
        {badge && <span className="absolute -top-2 -right-1.5">{badge}</span>}
      </div>

      <div>
        <p className={cn('font-semibold', size === 'md' ? 'text-base' : 'text-sm')}>{title}</p>
        {description && <p className="text-muted mt-1 text-sm">{description}</p>}
      </div>

      {action && <div className="flex flex-wrap justify-center gap-2 pt-1">{action}</div>}
    </div>
  );
}

/**
 * Classe da pílula de ação usada dentro de `PopEmptyState` — mesma
 * altura/toque dos CTAs do kit. Exportada como string (não só como
 * componente) porque a ação às vezes é um `<Link>` (ex.: "Ir estudar") e às
 * vezes um `<button>` que abre algo na própria tela (ex.: "Adicionar
 * compromisso"), e os dois precisam do mesmo visual.
 */
export const popEmptyStateActionClass =
  'border-border bg-surface hover:bg-surface-2 inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors';

/** Versão `<button>` pronta, para ações que não navegam. */
export function PopEmptyStateAction({
  icon,
  children,
  className,
  ...props
}: React.ComponentProps<'button'> & { icon?: React.ReactNode }) {
  return (
    <button type="button" {...props} className={cn(popEmptyStateActionClass, className)}>
      {icon}
      {children}
    </button>
  );
}
