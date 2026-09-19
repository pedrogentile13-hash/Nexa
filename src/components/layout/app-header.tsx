import Link from 'next/link';
import { Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavContext } from '@/lib/supabase/server';
import { PlatformSwitcher } from './platform-switcher';
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
export async function AppHeader({
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
  // Leitura deduplicada por requisição (`cache()`): o shell já pediu a mesma
  // coisa pra montar a navegação, então isto não custa um round-trip novo.
  const { journey, vestibularEnabled } = await getNavContext();

  return (
    <header className="pt-safe bg-bg/85 sticky top-0 z-30 backdrop-blur-lg">
      {/* Contêiner idêntico ao de `PageMain`: com larguras diferentes, o título
          começa num ponto e os cartões em outro — foi essa divergência que
          deixou o desktop desalinhado. */}
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 py-3 md:gap-3 md:px-6 lg:px-8">
        {/* No celular a marca é o seletor de plataforma: é o único lugar da
            tela onde ela aparece, então é nela que o menu tem que morar. */}
        <PlatformSwitcher
          journey={journey}
          vestibularEnabled={vestibularEnabled}
          variant="mark"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl leading-tight font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted truncate text-sm">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 md:gap-1.5">
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
