'use client';

import { useEffect, useState } from 'react';
import { Award, Clock, Flame, HelpCircle, Loader2, Trophy } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { levelForXp } from '@/features/performance/lib/level';
import { getStudentProfileCard, type StudentProfileCard } from '../server/actions';
import { RARITY_BADGE_VARIANT, RARITY_LABEL } from '../lib/rarity';

function lastActivityLabel(iso: string | null): string {
  if (!iso) return 'Sem atividade registrada';
  const days = Math.floor((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return `${days} dias atrás`;
}

export function StudentProfileModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [card, setCard] = useState<StudentProfileCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCard(null);
    getStudentProfileCard(userId).then((result) => {
      if (active) {
        setCard(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <Dialog open onClose={onClose} title="Perfil do aluno">
      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
        </div>
      ) : !card ? (
        <p className="text-muted py-6 text-center text-sm">
          Não consegui abrir esse perfil — pode ser de outra escola.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={
                card.avatarUrl
                  ? 'grid size-14 shrink-0 place-items-center overflow-hidden rounded-full'
                  : 'bg-brand-soft text-brand-text grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold'
              }
            >
              {card.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                (card.fullName?.trim()[0]?.toUpperCase() ?? '?')
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{card.fullName ?? 'Sem nome'}</p>
              <p className="text-muted truncate text-sm">
                {[card.className, card.schoolName].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatTile icon={Trophy} value={`Nível ${levelForXp(card.xp)}`} label={`${card.xp.toLocaleString('pt-BR')} XP`} />
            <StatTile icon={Flame} value={String(card.currentStreak)} label="Sequência atual" />
            <StatTile icon={Clock} value={`${card.studyHours}h`} label="Horas de estudo" />
            <StatTile icon={HelpCircle} value={String(card.questionsAnswered)} label="Questões respondidas" />
          </div>

          <p className="text-subtle text-xs">Última atividade: {lastActivityLabel(card.lastActivity)}</p>

          {card.topSubjects.length > 0 && (
            <div>
              <h3 className="text-muted mb-1.5 text-xs font-semibold tracking-wide uppercase">
                Matérias favoritas
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {card.topSubjects.map((s) => (
                  <li
                    key={s.name}
                    className="border-border bg-surface rounded-full border px-2.5 py-1 text-xs font-medium"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-muted mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              Conquistas · {card.achievements.length}
            </h3>
            {card.achievements.length === 0 ? (
              <p className="text-subtle text-xs">Nenhuma conquista desbloqueada ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {card.achievements.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5">
                    <span className="from-warning to-warning/80 grid size-7 shrink-0 place-items-center rounded-[32%] bg-gradient-to-br shadow-sm">
                      <Award className="size-3.5 text-white" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.name}</span>
                    <Badge variant={RARITY_BADGE_VARIANT[a.rarity]}>{RARITY_LABEL[a.rarity]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
