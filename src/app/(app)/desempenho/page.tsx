import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { GradientHeader } from '@/components/layout/gradient-header';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatGrade } from '@/features/grades';
import {
  StudyWeeksChart,
  SubjectAveragesChart,
  TermEvolutionChart,
} from '@/features/performance/components/charts';
import { levelProgressPercent } from '@/features/performance/lib/level';
import { getPerformance } from '@/features/performance/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Desempenho',
  description: 'Como você está e como está evoluindo.',
};

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const data = await getPerformance(user.id);

  const below = data.subjectBars.filter((b) => b.isBelowPassing);
  const worst = [...data.subjectBars].sort((a, b) => (a.average ?? 99) - (b.average ?? 99));

  // Cada gráfico ganha a frase que ele prova. O aluno lê a frase; o gráfico
  // existe para quem quiser conferir. Um eixo Y sem legenda é decoração.
  const evolutionSentence =
    data.averageDelta === null
      ? 'Ainda não há dois períodos com nota para comparar.'
      : data.averageDelta > 0
        ? `Sua média subiu ${formatGrade(Math.abs(data.averageDelta), 1)} desde o período anterior.`
        : data.averageDelta < 0
          ? `Sua média caiu ${formatGrade(Math.abs(data.averageDelta), 1)} desde o período anterior.`
          : 'Sua média está igual à do período anterior.';

  const subjectsSentence =
    below.length === 0
      ? 'Nenhuma matéria abaixo da média de aprovação neste período.'
      : below.length === 1
        ? `${below[0]?.subjectName} é a única abaixo da média de aprovação.`
        : `${worst[0]?.subjectName} e ${worst[1]?.subjectName} são as que puxam a média para baixo.`;

  return (
    <>
      <GradientHeader
        title="Desempenho"
        subtitle={`Média geral do ${data.currentTermName ?? 'período atual'}`}
        right={
          <div className="shrink-0 text-right">
            <span className="tabular block text-3xl leading-none font-semibold">
              {formatGrade(data.overallAverage, 1)}
            </span>
            {data.averageDelta !== null && data.averageDelta !== 0 && (
              <span
                className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                style={{
                  backgroundColor:
                    data.averageDelta > 0
                      ? 'rgba(74, 222, 128, 0.22)'
                      : 'rgba(248, 113, 113, 0.22)',
                }}
              >
                {data.averageDelta > 0 ? (
                  <TrendingUp className="size-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="size-3.5" aria-hidden />
                )}
                {data.averageDelta > 0 ? '+' : '−'}
                {formatGrade(Math.abs(data.averageDelta), 1)}
              </span>
            )}
          </div>
        }
      />

      <PageMain className="grid gap-4 pt-4 lg:grid-cols-2 lg:items-start">
        <Card className="min-w-0">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed font-medium">{evolutionSentence}</p>
            <div className="mt-3">
              <TermEvolutionChart points={data.termPoints} />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed font-medium">{subjectsSentence}</p>
            <div className="mt-3">
              <SubjectAveragesChart bars={data.subjectBars} />
            </div>
            {data.pendingActivities > 0 && (
              <p className="text-subtle mt-3 text-xs">
                {data.pendingActivities}{' '}
                {data.pendingActivities === 1 ? 'avaliação ainda' : 'avaliações ainda'} por lançar
                neste período.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Estudo por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <StudyWeeksChart weeks={data.studyWeeks} />
          </CardContent>
        </Card>

        {/* Nível: sóbrio de propósito. O XP aparece menor que a nota do
            cabeçalho, porque a nota é o que importa e o XP é reconhecimento. */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Nível</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="bg-brand-soft text-brand-text grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-semibold tabular-nums"
              >
                {data.level}
              </span>
              <div className="min-w-0">
                <p className="tabular text-lg leading-none font-semibold">
                  {data.xp.toLocaleString('pt-BR')} XP
                </p>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  {data.xpToNextLevel.toLocaleString('pt-BR')} XP para o nível {data.level + 1}
                </p>
              </div>
            </div>

            <Progress
              value={levelProgressPercent(data.xp)}
              label={`Progresso para o nível ${data.level + 1}`}
              size="sm"
            />

            <p className="text-subtle text-xs leading-relaxed">
              XP vem de lições, quizzes e minutos de estudo. O que conta de verdade é a média:{' '}
              {formatGrade(data.overallAverage, 1)} no período.
            </p>
          </CardContent>
        </Card>

        {/* O gráfico não pode ser a única forma de ler os números. */}
        {data.subjectBars.length > 0 && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Todos os números</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Média por matéria no período atual, com meta e situação
                </caption>
                <thead>
                  <tr className="text-subtle border-border border-b text-left text-xs">
                    <th scope="col" className="pb-2 font-medium">
                      Matéria
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Média
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Meta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {data.subjectBars.map((bar) => (
                    <tr key={bar.subjectId}>
                      <th scope="row" className="py-2 text-left font-medium">
                        {bar.subjectName}
                        {bar.isBelowPassing && (
                          <span className="text-danger ml-1.5 text-xs font-normal">
                            abaixo da média
                          </span>
                        )}
                        {!bar.isBelowPassing && bar.isBelowTarget && (
                          <span className="text-muted ml-1.5 text-xs font-normal">
                            abaixo da meta
                          </span>
                        )}
                      </th>
                      <td className="tabular py-2 text-right font-semibold">
                        {formatGrade(bar.average, 1)}
                      </td>
                      <td className="tabular text-muted py-2 text-right">
                        {bar.targetGrade !== null ? formatGrade(bar.targetGrade, 1) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </PageMain>
    </>
  );
}
