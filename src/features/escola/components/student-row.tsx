import Link from 'next/link';
import type { Route } from 'next';
import { Flame } from 'lucide-react';
import { Avatar, Chip, sinceLabel } from './ui';
import type { RosterStudent } from '../server/queries';

/** Uma linha de aluno: quem é, quando entrou por último e o quanto estudou. */
export function StudentRow({ s, showClass = false }: { s: RosterStudent; showClass?: boolean }) {
  const days = s.lastActive ? Math.round((Date.now() - Date.parse(`${s.lastActive}T00:00:00Z`)) / 86_400_000) : null;
  const tone = days === null ? 'bad' : days <= 2 ? 'good' : days <= 7 ? 'warn' : 'bad';

  return (
    <li>
      <Link href={`/escola/alunos/${s.id}` as Route} className="hover:bg-surface-2 flex items-center gap-3 rounded-2xl p-3 transition-colors">
        <Avatar name={s.name} url={s.avatarUrl} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{s.name}</span>
          <span className="text-muted block truncate text-xs">
            {showClass ? `${s.className} · ` : ''}
            {s.login ? <span className="font-mono">{s.login}</span> : 'conta própria'} · {s.weekMinutes} min na semana
          </span>
        </span>
        {s.streak > 0 && (
          <span className="text-warning hidden items-center gap-0.5 text-xs font-semibold sm:inline-flex">
            <Flame className="size-3.5" aria-hidden />
            {s.streak}
          </span>
        )}
        <Chip tone={tone} className="shrink-0">{sinceLabel(s.lastActive)}</Chip>
      </Link>
    </li>
  );
}
