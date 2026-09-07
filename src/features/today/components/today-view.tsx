import Link from 'next/link';
import {
  Brain,
  CalendarClock,
  ChevronRight,
  Crosshair,
  GraduationCap,
  Headphones,
  Video,
} from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatGrade } from '@/lib/format/grade';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { Checklist } from './checklist';
import { FocusList } from './focus-list';
import { StreakWeek } from './streak-week';
import { StudyNowCard } from './study-now-card';
import { StudyTimer } from './study-timer';
import { greetingFor, longDate, relativeDay } from '../lib/greeting';
import { daysBetween } from '../lib/ranking';
import type { RankedFocus } from '../lib/ranking';
import type { ResumeItem, TodaySnapshot } from '../server/queries';

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

  return (
    <PageMain className="grid gap-4 pt-4 md:pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
      {/* Saudação + introdução — texto simples, sem faixa colorida no topo:
          o pedido foi explícito para tirar o peso visual daqui e devolvê-lo
          ao conteúdo abaixo. */}
      <div className="min-w-0 lg:col-span-2 lg:row-start-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {snapshot.greetingName ? `${greeting}, ${snapshot.greetingName}! 👋` : `${greeting}! 👋`}
        </h1>
        <p className="text-muted mt-1 text-sm">
          {longDate(snapshot.today)} · veja o que está acontecendo hoje
        </p>
      </div>

      {/* Sequência em destaque ---------------------------------------------- */}
      <div className="min-w-0 lg:col-span-2 lg:row-start-2">
        <StreakWeek
          weekDays={snapshot.weekDays}
          currentStreak={snapshot.streak}
          longestStreak={snapshot.longestStreak}
          weeklyGoalMinutes={snapshot.weeklyGoalMinutes}
          weekStudiedMinutes={snapshot.weekStudiedMinutes}
        />
      </div>

      {/* Foco do dia ------------------------------------------------------ */}
      <section aria-labelledby="foco" className="min-w-0 lg:col-start-1 lg:row-start-3">
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
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 lg:col-start-2 lg:row-span-7 lg:row-start-3 lg:grid-cols-1 lg:gap-4">
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
      <div className="min-w-0 lg:col-start-1 lg:row-start-4">
        <StudyNowCard
          runningSessionId={snapshot.runningSessionId}
          startedAt={snapshot.runningSessionStartedAt}
        />
      </div>

      {/* Desempenho ---------------------------------------------------------- */}
      <Link
        href="/desempenho"
        className="border-border bg-surface hover:bg-surface-2 flex min-w-0 items-center justify-between gap-3 rounded-[20px] border p-4 transition-colors lg:col-start-1 lg:row-start-5"
      >
        <div>
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">Seu desempenho</p>
          <p className="tabular text-2xl leading-tight font-semibold">
            {formatGrade(snapshot.overallScore, 1)}
          </p>
        </div>
        <span className="text-brand-text inline-flex items-center gap-1 text-sm font-medium">
          Ver detalhes
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </Link>

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
