import Link from 'next/link';
import { Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Cabeçalho do app.
 *
 * Carrega só duas informações: a sequência (que é o hábito que o produto quer
 * reforçar) e o acesso ao perfil. Tudo mais que poderia estar aqui compete com
 * a resposta que a tela está tentando dar.
 */
export function AppHeader({
  title,
  subtitle,
  streak,
  avatarUrl,
  name,
  action,
}: {
  title: string;
  subtitle?: string;
  streak?: number;
  avatarUrl?: string | null;
  name?: string | null;
  /**
   * Ação própria da tela — o "+" das matérias, as setas do mês na agenda.
   * Quando existe, ela SUBSTITUI sequência e avatar: as duas são atalhos que
   * vivem em outros lugares, e disputar espaço com a ação da própria tela é
   * trocar o que a pessoa veio fazer por algo que ela não pediu.
   */
  action?: React.ReactNode;
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;

  return (
    <header className="pt-safe bg-bg/85 sticky top-0 z-30 backdrop-blur-lg">
      {/* Contêiner idêntico ao de `PageMain`: com larguras diferentes, o título
          começa num ponto e os cartões em outro — foi essa divergência que
          deixou o desktop desalinhado. */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-xl leading-tight font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted truncate text-sm">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {action}

          {!action && typeof streak === 'number' && streak > 0 && (
            <span
              className={cn(
                'bg-warning-soft text-warning flex items-center gap-1 rounded-full px-2.5 py-1.5',
                'text-sm font-semibold tabular-nums',
              )}
              title={`${streak} dia${streak === 1 ? '' : 's'} seguidos`}
            >
              <Flame className="size-4" aria-hidden />
              {streak}
              <span className="sr-only">dias seguidos de estudo</span>
            </span>
          )}

          {!action && (
            <Link
              href="/perfil"
              aria-label="Abrir perfil"
              className="border-border bg-surface-2 grid size-10 place-items-center overflow-hidden rounded-full border"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : initial ? (
                <span className="text-muted text-sm font-semibold">{initial}</span>
              ) : (
                <User className="text-muted size-5" aria-hidden />
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
