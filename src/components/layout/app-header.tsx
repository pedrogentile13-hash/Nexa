import Link from 'next/link';
import { Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderSearchToggle } from './header-search-toggle';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

/**
 * Cabeçalho do app — o mesmo em toda tela, sem exceção.
 *
 * A marca vai sempre no canto esquerdo (mesmo lugar da sidebar de desktop e
 * do topo do admin); busca e sino sempre no direito, junto com o que a
 * própria tela precisar (`action` — o "+" das matérias, as setas do mês na
 * agenda). Nenhum desses elementos briga por espaço escondendo o outro: a
 * página mostra tudo, e quem decide o que cabe é o layout flexível, não uma
 * regra de "isto substitui aquilo".
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
  /** Ação própria da tela — o "+" das matérias, as setas do mês na agenda. */
  action?: React.ReactNode;
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? null;

  return (
    <header className="pt-safe bg-bg/85 sticky top-0 z-30 backdrop-blur-lg">
      {/* Contêiner idêntico ao de `PageMain`: com larguras diferentes, o título
          começa num ponto e os cartões em outro — foi essa divergência que
          deixou o desktop desalinhado. */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 px-4 py-3 md:px-6 lg:px-8">
        <Link href="/hoje" aria-label="Nexa Study · início" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve, não precisa de otimização do next/image */}
          <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-8" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl leading-tight font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted truncate text-sm">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {action}

          {typeof streak === 'number' && streak > 0 && (
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

          <HeaderSearchToggle />
          <NotificationBell />

          <Link
            href="/perfil"
            aria-label="Abrir perfil"
            className="border-border bg-surface-2 grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border"
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
        </div>
      </div>
    </header>
  );
}
