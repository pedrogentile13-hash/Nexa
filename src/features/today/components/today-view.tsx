import Link from 'next/link';
import type { Route } from 'next';
import {
  Brain,
  CalendarClock,
  ChevronRight,
  Crosshair,
  Flame,
  GraduationCap,
  Headphones,
  TrendingDown,
  TrendingUp,
  Video,
} from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatGrade } from '@/lib/format/grade';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { cn } from '@/lib/utils';
import { Checklist } from './checklist';
import { FocusList } from './focus-list';
import { MiniCalendar } from './mini-calendar';
import { StreakWeek } from './streak-week';
import { StudyNowCard } from './study-now-card';
import { StudyTimer } from './study-timer';
import { greetingFor, longDate, relativeDay } from '../lib/greeting';
import { daysBetween } from '../lib/ranking';
import type { RankedFocus } from '../lib/ranking';
import type { ResumeItem, TodaySnapshot } from '../server/queries';

/** Frases curtas, no mesmo tom do resto do produto — uma por dia, estável no servidor. */
const QUOTES = [
  'Pequenos avanços, grandes conquistas.',
  'Disciplina hoje, resultados amanhã.',
  'Constância vale mais que intensidade.',
  'Um passo de cada vez chega longe.',
  'Seu esforço de hoje é o resultado de amanhã.',
];

function quoteOf(isoDate: string): string {
  const day = Number(isoDate.slice(8, 10)) || 0;
  return QUOTES[day % QUOTES.length] ?? QUOTES[0]!;
}

/**
 * A tela Hoje, separada da busca de dados.
 *
 * A separação existe para que o layout possa ser renderizado com dados de
 * exemplo — em revisão de design ou num teste — sem exigir sessão, banco e um
 * aluno de verdade. Uma tela que só existe autenticada é uma tela que ninguém
 * consegue conferir antes de subir.
 */

/** Título de seção do kit: ícone pequeno, título, e a contagem em cinza. */
function SectionTitle({
  icon,
  children,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      {icon}
      <h2 className="text-base font-semibold">{children}</h2>
      {hint && <span className="text-muted truncate text-xs">{hint}</span>}
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

/** Cartão de estatística do topo: valor grande, rótulo, tendência opcional. */
function StatTile({
  icon,
  label,
  value,
  hint,
  trend,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
  href?: Route;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden
          className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-xl"
        >
          {icon}
        </span>
        {trend !== undefined && trend !== null && trend !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
              trend > 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="size-3" aria-hidden />
            ) : (
              <TrendingDown className="size-3" aria-hidden />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-muted mt-2 text-xs font-medium">{label}</p>
      <p className="tabular text-xl leading-tight font-semibold">{value}</p>
      {hint && <p className="text-subtle mt-0.5 text-[11px] leading-tight">{hint}</p>}
    </>
  );

  const className = 'border-border bg-surface block rounded-2xl border p-3.5 transition-colors';

  return href ? (
    <Link href={href} className={cn(className, 'hover:bg-surface-2')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** Cartão "continue ouvindo/assistindo": mesma peça, ícone e rótulo trocam. */
function ResumeCard({
  item,
  icon,
  label,
}: {
  item: ResumeItem;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={`/estudar/${item.id}`}
      className="border-border bg-surface hover:bg-surface-2 flex min-w-0 items-center gap-3 rounded-[20px] border p-3.5 transition-colors"
    >
      <span
        aria-hidden
        className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-muted block text-xs">{label}</span>
        <span className="block truncate text-sm font-semibold">{item.title}</span>
        <span className="text-subtle block truncate text-xs">
          {item.subjectName} · {Math.round(item.progressPercent)}%
        </span>
      </span>
      <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
    </Link>
  );
}

export function TodayView({
  snapshot,
  focus,
  now = new Date(),
}: {
  snapshot: TodaySnapshot;
  focus: RankedFocus[];
  now?: Date;
}) {
  const routinesDone = snapshot.routines.filter((r) => r.doneCount >= r.targetCount).length;
  const routinesTotal = snapshot.routines.length;

  const studyPercent =
    snapshot.dailyGoalMinutes > 0
      ? Math.min(100, (snapshot.studiedTodayMinutes / snapshot.dailyGoalMinutes) * 100)
      : 0;

  const greeting = greetingFor(now, 'America/Sao_Paulo');

  const weekTrend =
    snapshot.previousWeekStudiedMinutes > 0
      ? Math.round(
          ((snapshot.weekStudiedMinutes - snapshot.previousWeekStudiedMinutes) /
            snapshot.previousWeekStudiedMinutes) *
            100,
        )
      : null;

  // Pontinhos do mini-calendário: reaproveita as tarefas já buscadas (mesmo
  // horizonte de 14 dias) em vez de uma segunda consulta — não é o
  // planejamento em si, só um resumo visual.
  const calendarDots = new Map<string, string[]>();
  for (const candidate of snapshot.candidates) {
    if (!candidate.dueDate) continue;
    const colors = calendarDots.get(candidate.dueDate) ?? [];
    colors.push(candidate.subjectColor ?? 'blue');
    calendarDots.set(candidate.dueDate, colors);
  }

  return (
    <PageMain className="grid gap-4 pt-4 md:pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
      {/* Saudação, com a identidade de volta no topo — a prévia visual da
          reforma pediu explicitamente o degradê e a citação decorativa de
          volta, ao contrário do layout anterior. */}
      <div
        className="relative min-w-0 overflow-hidden rounded-[20px] p-5 text-white lg:col-start-1 lg:row-start-1"
        style={{ background: 'var(--gradient-header)' }}
      >
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight font-bold tracking-tight md:text-[28px]">
              {snapshot.greetingName ? `${greeting}, ${snapshot.greetingName}!` : `${greeting}!`}{' '}
              👋
            </h1>
            <p className="mt-1.5 text-sm opacity-90">
              {longDate(snapshot.today)} · veja o que está acontecendo hoje
            </p>
          </div>
          <p className="hidden max-w-[180px] shrink-0 rounded-2xl bg-white/15 p-3 text-xs leading-snug backdrop-blur-sm sm:block">
            “{quoteOf(snapshot.today)}”
            <span className="mt-1 block opacity-80">— Nexa Study</span>
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:block">
        <MiniCalendar today={snapshot.today} dotsByDate={calendarDots} />
      </div>

      {/* Estatísticas rápidas ------------------------------------------------ */}
      <div className="grid min-w-0 grid-cols-3 gap-2.5 lg:col-start-1 lg:row-start-2 lg:gap-3">
        <StatTile
          icon={<Flame className="size-4.5" aria-hidden />}
          label="Sequência"
          value={`${snapshot.streak} ${snapshot.streak === 1 ? 'dia' : 'dias'}`}
          hint={`recorde: ${snapshot.longestStreak}`}
        />
        <StatTile
          icon={<GraduationCap className="size-4.5" aria-hidden />}
          label="Horas de estudo"
          value={`${Math.floor(snapshot.weekStudiedMinutes / 60)}h${String(snapshot.weekStudiedMinutes % 60).padStart(2, '0')}`}
          hint="nesta semana"
          trend={weekTrend}
        />
        <StatTile
          icon={<Brain className="size-4.5" aria-hidden />}
          label="Seu desempenho"
          value={formatGrade(snapshot.overallScore, 1)}
          hint="ver detalhes"
          href="/desempenho"
        />
      </div>

      {/* Sequência em destaque ---------------------------------------------- */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-3">
        <StreakWeek
          weekDays={snapshot.weekDays}
          currentStreak={snapshot.streak}
          longestStreak={snapshot.longestStreak}
          weeklyGoalMinutes={snapshot.weeklyGoalMinutes}
          weekStudiedMinutes={snapshot.weekStudiedMinutes}
        />
      </div>

      {/* Foco do dia ------------------------------------------------------ */}
      <section aria-labelledby="foco" className="min-w-0 lg:col-start-1 lg:row-start-4">
        <SectionTitle
          icon={<Crosshair className="text-brand size-4" aria-hidden />}
          hint={
            focus.length > 0
              ? `${focus.length} ${focus.length === 1 ? 'item' : 'itens'} · por prioridade`
              : undefined
          }
        >
          <span id="foco">Foco do dia</span>
        </SectionTitle>
        <FocusList items={focus} />
      </section>

      {/* Rotina + Estudo ------------------------------------------------- */}
      {/* No celular, rotina e estudo dividem uma linha. No desktop viram a
          coluna da direita, empilhados na ordem do guia: estudo, rotina.

          `minmax(0,1fr)` e não `1fr`: a trilha flexível do grid tem mínimo
          `auto`, ou seja, o min-content do cartão da esquerda. Com um
          checklist dentro, esse mínimo passa da largura disponível e empurra
          o cartão da direita para fora da tela. */}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 lg:col-start-2 lg:row-span-6 lg:row-start-4 lg:grid-cols-1 lg:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">Rotina de hoje</h2>
              <span className="text-muted text-xs font-semibold tabular-nums">
                {routinesDone}/{routinesTotal}
              </span>
            </div>

            {routinesTotal === 0 ? (
              <p className="text-muted text-sm leading-relaxed">
                Sem rotina para hoje. Você pode montar a sua no perfil.
              </p>
            ) : (
              <Checklist routines={snapshot.routines} />
            )}
          </CardContent>
        </Card>

        <Card className="w-[152px] min-w-0 lg:order-first lg:w-auto">
          <CardContent className="flex flex-col items-center gap-3 p-4">
            <h2 className="self-start text-sm font-semibold">Meta de hoje</h2>

            <ProgressRing
              value={studyPercent}
              size={104}
              label={`Estudo de hoje: ${snapshot.studiedTodayMinutes} de ${snapshot.dailyGoalMinutes} minutos`}
            >
              <span>
                <span className="tabular block text-2xl leading-none font-semibold">
                  {snapshot.studiedTodayMinutes}
                </span>
                <span className="text-subtle mt-1 block text-[11px] tabular-nums">
                  /{snapshot.dailyGoalMinutes} min
                </span>
              </span>
            </ProgressRing>

            <StudyTimer
              compact
              runningSessionId={snapshot.runningSessionId}
              startedAt={snapshot.runningSessionStartedAt}
            />
          </CardContent>
        </Card>

        {/* Retomar é o caminho mais provável de quem já começou algo: no
            guia ele fecha a coluna da direita, depois da rotina. */}
        {snapshot.resume && (
          <Link
            href={`/estudar/${snapshot.resume.id}`}
            className="border-border bg-surface hover:bg-surface-2 col-span-2 flex items-center gap-3 rounded-[20px] border p-3.5 transition-colors lg:col-span-1"
          >
            <span
              aria-hidden
              className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl"
            >
              <GraduationCap className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Continuar estudando</span>
              <span className="text-muted block truncate text-xs">
                {snapshot.resume.title} · {Math.round(snapshot.resume.progressPercent)}%
              </span>
            </span>
            <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
          </Link>
        )}
      </div>

      {/* Estudar agora (Etapa 8) -------------------------------------------- */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-5">
        <StudyNowCard
          runningSessionId={snapshot.runningSessionId}
          startedAt={snapshot.runningSessionStartedAt}
        />
      </div>

      {/* Quiz recomendado ------------------------------------------------------ */}
      {snapshot.recommendedQuiz && (
        <Link
          href={`/estudar/${snapshot.recommendedQuiz.id}`}
          className="border-border bg-surface hover:bg-surface-2 flex min-w-0 items-center gap-3 rounded-[20px] border p-4 transition-colors lg:col-start-1 lg:row-start-6"
        >
          <span
            aria-hidden
            className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl"
          >
            <Brain className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-muted block text-xs">Quiz recomendado</span>
            <span className="block truncate text-sm font-semibold">
              {snapshot.recommendedQuiz.title}
            </span>
            <span className="text-subtle block truncate text-xs">
              {snapshot.recommendedQuiz.subjectName}
            </span>
          </span>
          <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
        </Link>
      )}

      {/* Continue ouvindo / assistindo ------------------------------------- */}
      {(snapshot.resumeAudio || snapshot.resumeVideo) && (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:col-start-1 lg:row-start-7">
          {snapshot.resumeAudio && (
            <ResumeCard
              item={snapshot.resumeAudio}
              icon={<Headphones className="size-5" />}
              label="Continue ouvindo"
            />
          )}
          {snapshot.resumeVideo && (
            <ResumeCard
              item={snapshot.resumeVideo}
              icon={<Video className="size-5" />}
              label="Continue assistindo"
            />
          )}
        </div>
      )}

      {/* Aulas de hoje ---------------------------------------------------- */}
      {snapshot.classesToday.length > 0 && (
        <section aria-labelledby="aulas" className="min-w-0 lg:col-start-1 lg:row-start-8">
          <SectionTitle icon={<CalendarClock className="text-brand size-4" aria-hidden />}>
            <span id="aulas">Aulas de hoje</span>
          </SectionTitle>

          {/* Faixa horizontal, não lista: o dia é uma sequência, e vê-la
                inteira de relance é a razão de a seção existir. */}
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {snapshot.classesToday.map((slot, index) => (
              <li
                key={`${slot.subjectId}-${index}`}
                style={subjectColorVars(slot.subjectColor)}
                className="border-border bg-surface relative w-[124px] shrink-0 overflow-hidden rounded-2xl border p-3"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: 'var(--subject-base)' }}
                />
                <div className="pl-2">
                  <p className="text-muted text-xs font-semibold tabular-nums">
                    {slot.startsAt.slice(0, 5)}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{slot.subjectName}</p>
                  <p className="text-subtle truncate text-xs">{slot.room ?? '—'}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* O que vem por aí -------------------------------------------------- */}
      {snapshot.upcoming.length > 0 && (
        <section aria-labelledby="proximos" className="min-w-0 lg:col-start-1 lg:row-start-9">
          <SectionTitle
            action={
              <Link
                href="/agenda"
                className="text-brand-text inline-flex h-11 items-center gap-1 text-sm font-medium"
              >
                Ver agenda
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            }
          >
            <span id="proximos">Próximos eventos</span>
          </SectionTitle>

          <Card>
            <CardContent className="p-2">
              <ul className="divide-border divide-y">
                {snapshot.upcoming.map((item) => {
                  const days = daysBetween(snapshot.today, item.dueDate);
                  return (
                    <li
                      key={item.id}
                      style={subjectColorVars(item.subjectColor)}
                      className="flex items-center gap-3 px-2 py-2.5"
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: 'var(--subject-base)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        {item.subjectName && (
                          <p className="text-muted truncate text-xs">{item.subjectName}</p>
                        )}
                      </div>
                      <span className="text-muted shrink-0 text-xs tabular-nums">
                        {relativeDay(days)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </PageMain>
  );
}
