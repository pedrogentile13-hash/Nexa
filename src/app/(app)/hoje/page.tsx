import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CalendarClock, Clock, Target } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCurrentUser } from '@/lib/supabase/server';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { Checklist } from '@/features/today/components/checklist';
import { FocusList } from '@/features/today/components/focus-list';
import { StudyTimer } from '@/features/today/components/study-timer';
import { greetingFor, longDate, relativeDay, shortDate } from '@/features/today/lib/greeting';
import { daysBetween, rankFocus } from '@/features/today/lib/ranking';
import { getTodaySnapshot } from '@/features/today/server/queries';

export const metadata: Metadata = {
  title: 'Hoje',
  description: 'O que você precisa fazer hoje.',
};

// Cada carregamento reflete o que acabou de ser marcado; sem isso a tela mais
// aberta do app mostraria o estado de ontem.
export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const snapshot = await getTodaySnapshot(user.id);
  const focus = rankFocus(snapshot.candidates, snapshot.today, 3);

  const routinesDone = snapshot.routines.filter((r) => r.doneCount >= r.targetCount).length;
  const routinesTotal = snapshot.routines.length;
  const studyPercent =
    snapshot.dailyGoalMinutes > 0
      ? (snapshot.studiedTodayMinutes / snapshot.dailyGoalMinutes) * 100
      : 0;

  // Progresso do dia: metade checklist, metade meta de estudo. Duas coisas que o
  // aluno controla — nada de barra que sobe por conta própria.
  const dailyPercent =
    (routinesTotal > 0 ? (routinesDone / routinesTotal) * 50 : 50) +
    Math.min(50, (studyPercent / 100) * 50);

  const greeting = greetingFor(new Date(), 'America/Sao_Paulo');

  return (
    <>
      <AppHeader
        title={snapshot.greetingName ? `${greeting}, ${snapshot.greetingName}` : greeting}
        subtitle={longDate(snapshot.today)}
        streak={snapshot.streak}
        avatarUrl={snapshot.avatarUrl}
        name={snapshot.greetingName}
      />

      {/* No desktop os cartões viram duas colunas: eles são independentes
          entre si, então a coluna extra vira mais conteúdo visível em vez de
          linha mais longa. `items-start` impede que um cartão curto estique
          para acompanhar a altura do vizinho. */}
      <PageMain className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* Progresso do dia ------------------------------------------------ */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-subtle text-xs">Progresso de hoje</p>
                <p className="tabular text-3xl leading-none font-semibold">
                  {Math.round(dailyPercent)}%
                </p>
              </div>
              <StudyTimer
                runningSessionId={snapshot.runningSessionId}
                startedAt={snapshot.runningSessionStartedAt}
              />
            </div>

            <Progress value={dailyPercent} label="Progresso do dia" />

            <div className="text-muted flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <Target className="size-3.5" aria-hidden />
                {routinesTotal > 0
                  ? `${routinesDone}/${routinesTotal} do checklist`
                  : 'sem checklist hoje'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {snapshot.studiedTodayMinutes} de {snapshot.dailyGoalMinutes} min
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Foco do dia ------------------------------------------------------ */}
        <section aria-labelledby="foco" className="lg:col-span-2">
          <h2 id="foco" className="mb-2 px-1 text-base font-semibold">
            Foco de hoje
          </h2>
          <FocusList items={focus} />
        </section>

        {/* Checklist -------------------------------------------------------- */}
        {snapshot.routines.length > 0 && (
          <section aria-labelledby="checklist">
            <h2 id="checklist" className="mb-2 px-1 text-base font-semibold">
              Checklist diário
            </h2>
            <Checklist routines={snapshot.routines} />
          </section>
        )}

        {/* Aulas de hoje ---------------------------------------------------- */}
        {snapshot.classesToday.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="text-brand size-4" aria-hidden />
                Aulas de hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-border divide-y">
                {snapshot.classesToday.map((slot, index) => (
                  <li
                    key={`${slot.subjectId}-${index}`}
                    style={subjectColorVars(slot.subjectColor)}
                    className="flex items-center gap-3 py-2"
                  >
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: 'var(--subject-base)' }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {slot.subjectName}
                    </span>
                    <span className="text-muted tabular shrink-0 text-xs">
                      {slot.startsAt.slice(0, 5)}
                      {slot.room ? ` · ${slot.room}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* O que vem por aí -------------------------------------------------- */}
        {snapshot.upcoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Próximos dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-border divide-y">
                {snapshot.upcoming.map((item) => {
                  const days = daysBetween(snapshot.today, item.dueDate);
                  return (
                    <li
                      key={item.id}
                      style={subjectColorVars(item.subjectColor)}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: 'var(--subject-base)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.categoryCode && (
                            <span className="text-subtle mr-1.5 text-xs font-semibold">
                              {item.categoryCode}
                            </span>
                          )}
                          {item.title}
                        </p>
                        {item.subjectName && (
                          <p className="text-subtle truncate text-xs">{item.subjectName}</p>
                        )}
                      </div>
                      <span className="text-muted shrink-0 text-xs" title={shortDate(item.dueDate)}>
                        {relativeDay(days)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </PageMain>
    </>
  );
}
