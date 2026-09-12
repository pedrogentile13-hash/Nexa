'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Clock,
  Flame,
  HelpCircle,
  Medal,
  Play,
  Target,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatTile } from '@/components/ui/stat-tile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { levelForXp, levelProgressPercent, xpToNextLevel } from '@/features/performance/lib/level';
import { RankingEvolutionChart } from './ranking-charts';
import { FriendsCard } from './friends-card';
import { StudentProfileModal } from './student-profile-modal';
import type { RankingOrderBy, RankingPage, RankingPeriod, RankingScope } from '../server/queries';
import type { ClassOption } from '@/features/classes/server/queries';

/**
 * Ranking de XP.
 *
 * Filtros vivem na URL (mesmo padrão do filtro de bimestre em
 * `study-hub.tsx`) — `router.push` dispara uma navegação de verdade, que
 * busca dado fresco no servidor. É o mecanismo de "atualiza sozinho ao
 * voltar pra tela" decidido para esta rodada, sem introduzir Supabase
 * Realtime (que este projeto não usa em lugar nenhum hoje).
 */

const PERIOD_LABEL: Record<RankingPeriod, string> = {
  hoje: 'Hoje',
  semana: 'Semana',
  mes: 'Mês',
  geral: 'Geral',
};

const ORDER_LABEL: Record<RankingOrderBy, string> = {
  xp: 'XP',
  streak: 'Sequência',
  questoes: 'Questões',
  horas: 'Horas',
};

/**
 * Número em evidência de cada linha da tabela — segue o "Ordenar" escolhido,
 * não sempre XP. Antes disso, ordenar por sequência/questões/horas reordenava
 * as linhas mas o número visível continuava sendo o de XP, o que não serve
 * pra comparar desempenho no critério escolhido. `metricValue` isola só o
 * número (reaproveitado nas contas de "falta X pra ultrapassar" do card
 * lateral); `evidenceValue` empacota o número com a unidade certa.
 */
function metricValue(row: RankingPage['rows'][number], orderBy: RankingOrderBy): number {
  switch (orderBy) {
    case 'streak':
      return row.currentStreak;
    case 'questoes':
      return row.questionsAnswered;
    case 'horas':
      return row.studyHours;
    case 'xp':
    default:
      return row.xp;
  }
}

function evidenceValue(row: RankingPage['rows'][number], orderBy: RankingOrderBy): string {
  const value = metricValue(row, orderBy).toLocaleString('pt-BR');
  switch (orderBy) {
    case 'streak':
      return `${value} ${metricValue(row, orderBy) === 1 ? 'dia' : 'dias'}`;
    case 'questoes':
      return `${value} quest.`;
    case 'horas':
      return `${value}h`;
    case 'xp':
    default:
      return `${value} XP`;
  }
}

const METRIC_LABEL: Record<RankingOrderBy, string> = {
  xp: 'XP atual',
  streak: 'Sequência atual',
  questoes: 'Questões respondidas',
  horas: 'Horas estudadas',
};

const METRIC_UNIT: Record<RankingOrderBy, string> = {
  xp: 'XP',
  streak: 'dias',
  questoes: 'questões',
  horas: 'h',
};

function segmentClass(active: boolean) {
  return cn(
    'h-10 shrink-0 rounded-lg px-3.5 text-sm font-medium transition-colors',
    active ? 'bg-surface text-brand-text shadow-sm' : 'text-muted hover:text-text',
  );
}

function ChangeArrow({ rank, previousRank }: { rank: number; previousRank: number | null }) {
  if (previousRank === null) return <span className="text-subtle text-xs">—</span>;
  const delta = previousRank - rank;
  if (delta > 0)
    return (
      <span className="text-success inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums">
        <ArrowUp className="size-3.5" aria-hidden />
        {delta}
      </span>
    );
  if (delta < 0)
    return (
      <span className="text-danger inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums">
        <ArrowDown className="size-3.5" aria-hidden />
        {Math.abs(delta)}
      </span>
    );
  return (
    <span className="text-subtle inline-flex items-center text-xs">
      <ArrowRight className="size-3.5" aria-hidden />
    </span>
  );
}

// Mesmo selo em degradê já usado pelas conquistas desbloqueadas em
// `perfil/page.tsx` ("from-warning to-warning/80... bg-gradient-to-br") —
// um lugar de ouro é, na prática, uma conquista, então reaproveita a mesma
// linguagem visual em vez de inventar tons de prata/bronze que não existem
// no design system.
const MEDAL_TONE: Record<number, string> = {
  1: 'from-warning to-warning/80',
  2: 'from-brand to-brand-hover',
  3: 'from-success to-success/80',
};

// Mesmo tom da medalha, só que como anel — dá o "destaque sutil" nas 3
// primeiras linhas da tabela sem inventar sombra ou cor nova.
const RING_TONE: Record<number, string> = {
  1: 'ring-warning/40',
  2: 'ring-brand/40',
  3: 'ring-success/40',
};

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-110',
          MEDAL_TONE[rank],
        )}
      >
        <Medal className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="bg-surface-2 text-muted grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums">
      {rank}
    </span>
  );
}

export function RankingView({
  data,
  scope,
  period,
  orderBy,
  classId,
  classes,
}: {
  data: RankingPage;
  scope: RankingScope;
  period: RankingPeriod;
  orderBy: RankingOrderBy;
  classId: string | null;
  classes: ClassOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `/ranking?${qs}` : '/ranking');
  }

  const level = levelForXp(data.lifetimeXp);

  // `row.rank`/`previousRank` vêm da RPC sempre calculados por XP — a lista
  // (`data.rows`) já chega ordenada pelo critério escolhido, mas a posição
  // numérica em si só bate com XP. Pra sequência/questões/horas, a posição
  // exibida usa o índice na lista já ordenada (o que o aluno está vendo na
  // tela), e a seta de variação (que só existe pra XP) some — mostrar uma
  // seta calculada sobre outro critério seria uma informação errada.
  const myDisplayPosition = data.me
    ? data.rows.findIndex((r) => r.userId === data.me!.userId) + 1
    : null;

  return (
    <div className="space-y-5 pt-4">
      <p className="text-muted text-sm italic">
        &ldquo;Grandes conquistas começam com pequenos estudos.&rdquo;
      </p>

      {/* ------------------------------------------------ 4 cartões do topo -- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Trophy}
          value={myDisplayPosition ? `#${myDisplayPosition}` : '—'}
          label={
            orderBy === 'xp' && data.me?.previousRank != null
              ? data.me.previousRank > data.me.rank
                ? `↑ +${data.me.previousRank - data.me.rank} essa ${PERIOD_LABEL[period].toLowerCase()}`
                : data.me.previousRank < data.me.rank
                  ? `↓ ${data.me.rank - data.me.previousRank} essa ${PERIOD_LABEL[period].toLowerCase()}`
                  : 'Minha posição'
              : 'Minha posição'
          }
        />
        <StatTile
          icon={Flame}
          value={data.me ? data.me.xp.toLocaleString('pt-BR') : '0'}
          label={`XP · ${PERIOD_LABEL[period]}`}
        />
        <StatTile
          icon={Flame}
          value={String(data.me?.currentStreak ?? 0)}
          label="Sequência atual"
        />
        <StatTile icon={Trophy} value={`Nível ${level}`} label="Nível" />
      </div>

      {/* ------------------------------------------------------- filtros --- */}
      <div className="space-y-2">
        <div className="bg-surface-2 flex gap-1 overflow-x-auto rounded-xl p-1">
          {(Object.keys(PERIOD_LABEL) as RankingPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              className={segmentClass(p === period)}
              onClick={() => setParam('periodo', p === 'geral' ? null : p)}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-surface-2 flex gap-1 rounded-xl p-1">
            <button
              type="button"
              className={segmentClass(scope === 'escola')}
              onClick={() => setParam('escopo', null)}
            >
              Minha escola
            </button>
            <button
              type="button"
              className={segmentClass(scope === 'turma')}
              onClick={() => setParam('escopo', 'turma')}
            >
              Minha turma
            </button>
          </div>

          {scope === 'turma' && classes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setParam('turma', c.id)}
                  className={cn(
                    'h-9 rounded-full border px-3 text-xs font-medium transition-colors',
                    c.id === classId
                      ? 'border-brand bg-brand-soft text-brand-text'
                      : 'border-border bg-surface text-muted hover:bg-surface-2',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="bg-surface-2 ml-auto flex gap-1 rounded-xl p-1">
            {(Object.keys(ORDER_LABEL) as RankingOrderBy[]).map((o) => (
              <button
                key={o}
                type="button"
                className={segmentClass(o === orderBy)}
                onClick={() => setParam('ordenar', o === 'xp' ? null : o)}
              >
                {ORDER_LABEL[o]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-6">
        {/* --------------------------------------------------- tabela ---- */}
        <Card>
          <CardContent className="p-0">
            {data.rows.length === 0 ? (
              <p className="text-muted p-6 text-center text-sm">
                Ninguém por aqui ainda com esse filtro.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {data.rows.map((row, index) => {
                  const displayRank = index + 1;
                  return (
                    <li key={row.userId}>
                      <button
                        type="button"
                        onClick={() => setOpenProfile(row.userId)}
                        className={cn(
                          'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                          row.userId === (data.me?.userId ?? '')
                            ? 'bg-brand-soft border-brand border-l-4'
                            : 'hover:bg-surface-2',
                          displayRank <= 3 && ['ring-1 ring-inset', RING_TONE[displayRank]],
                        )}
                      >
                        <RankBadge rank={displayRank} />
                        <span
                          className={cn(
                            'grid size-9 shrink-0 place-items-center overflow-hidden rounded-full',
                            row.avatarUrl ? '' : 'bg-brand-soft text-brand-text',
                          )}
                        >
                          {row.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.avatarUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold">
                              {row.fullName.trim()[0]?.toUpperCase() ?? '?'}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{row.fullName}</span>
                          <span className="text-muted flex items-center gap-1.5 truncate text-xs">
                            {row.className && <span>{row.className}</span>}
                            <span className="tabular">Nível {row.level}</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Flame className="size-3" aria-hidden />
                              {row.currentStreak}
                            </span>
                          </span>
                        </span>
                        <span className="tabular shrink-0 text-right text-sm font-semibold">
                          {evidenceValue(row, orderBy)}
                        </span>
                        <span className="w-8 shrink-0 text-right">
                          <ChangeArrow
                            rank={displayRank}
                            previousRank={orderBy === 'xp' ? row.previousRank : null}
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* --------------------------------------------------- lateral --- */}
        <aside className="mt-4 space-y-4 lg:mt-0">
          {data.me && (
            <Card>
              <CardHeader>
                <CardTitle>Meu desempenho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Posição</span>
                  <span className="tabular font-semibold">#{myDisplayPosition}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{METRIC_LABEL[orderBy]}</span>
                  <span className="tabular font-semibold">
                    {metricValue(data.me, orderBy).toLocaleString('pt-BR')}
                  </span>
                </div>
                {data.aboveMe && (
                  <p className="text-muted text-xs leading-relaxed">
                    Faltam{' '}
                    <strong className="text-text tabular">
                      {(
                        metricValue(data.aboveMe, orderBy) - metricValue(data.me, orderBy)
                      ).toLocaleString('pt-BR')}{' '}
                      {METRIC_UNIT[orderBy]}
                    </strong>{' '}
                    para ultrapassar {data.aboveMe.fullName.split(' ')[0]}.
                  </p>
                )}
                {data.belowMe && (
                  <p className="text-muted text-xs leading-relaxed">
                    {data.belowMe.fullName.split(' ')[0]} está{' '}
                    <strong className="text-text tabular">
                      {(
                        metricValue(data.me, orderBy) - metricValue(data.belowMe, orderBy)
                      ).toLocaleString('pt-BR')}{' '}
                      {METRIC_UNIT[orderBy]}
                    </strong>{' '}
                    atrás.
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpenProfile(data.me!.userId)}
                >
                  Ver meu perfil
                </Button>
              </CardContent>
            </Card>
          )}

          <FriendsCard
            friends={data.friends}
            incomingRequests={data.incomingRequests}
            onOpenProfile={setOpenProfile}
          />

          <Card>
            <CardHeader>
              <CardTitle>Nível</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-brand-soft text-brand-text grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-semibold tabular-nums">
                  {level}
                </span>
                <div className="min-w-0">
                  <p className="tabular text-lg leading-none font-semibold">
                    {data.lifetimeXp.toLocaleString('pt-BR')} XP
                  </p>
                  <p className="text-muted mt-1 text-xs leading-relaxed">
                    {xpToNextLevel(data.lifetimeXp).toLocaleString('pt-BR')} XP para o nível{' '}
                    {level + 1}
                  </p>
                </div>
              </div>
              <Progress
                value={levelProgressPercent(data.lifetimeXp)}
                label={`Progresso para o nível ${level + 1}`}
                size="sm"
              />
              <Link
                href="/conquistas"
                className="text-brand block text-center text-sm font-medium hover:underline"
              >
                Ver todas as conquistas →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução (30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingEvolutionChart points={data.evolution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <StatTile
                  icon={HelpCircle}
                  value={String(data.stats.questionsAnswered)}
                  label="Questões"
                />
                <StatTile
                  icon={Clock}
                  value={`${data.stats.studyHours}h`}
                  label="Horas de estudo"
                />
                <StatTile
                  icon={BookOpen}
                  value={String(data.stats.summariesRead)}
                  label="Resumos lidos"
                />
                <StatTile
                  icon={Play}
                  value={String(data.stats.videosWatched)}
                  label="Vídeos assistidos"
                />
                <StatTile
                  icon={Target}
                  value={String(data.stats.simuladosDone)}
                  label="Simulados"
                />
                <StatTile
                  icon={Target}
                  value={
                    data.stats.accuracyPercent !== null ? `${data.stats.accuracyPercent}%` : '—'
                  }
                  label="Precisão"
                />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {openProfile && (
        <StudentProfileModal userId={openProfile} onClose={() => setOpenProfile(null)} />
      )}
    </div>
  );
}
