import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatGrade } from '@/features/grades';
import {
  StudyWeeksChart,
  SubjectAveragesChart,
  TermEvolutionChart,
} from '@/features/performance/components/charts';
import { getPerformance } from '@/features/performance/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Desempenho',
  description: 'Como você está e como está evoluindo.',
};

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const data = await getPerformance(user.id);

  return (
    <>
      <AppHeader title="Desempenho" subtitle={data.currentTermName ?? 'Período atual'} />

      <PageMain className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* Como estou agora ------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Média geral" value={formatGrade(data.overallAverage, 1)} tone="brand" />
          <Stat
            label="Disciplinas"
            value={`${data.subjectsGraded}/${data.subjectsTotal}`}
            hint="com nota lançada"
          />
          <Stat
            label="Abaixo da média"
            value={String(data.subjectsBelowPassing)}
            tone={data.subjectsBelowPassing > 0 ? 'danger' : 'success'}
          />
          <Stat label="Por lançar" value={String(data.pendingActivities)} hint="avaliações" />
        </div>

        {/* Estou evoluindo? ------------------------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da média</CardTitle>
            <CardDescription>Média geral em cada período do ano.</CardDescription>
          </CardHeader>
          <CardContent>
            <TermEvolutionChart points={data.termPoints} />
          </CardContent>
        </Card>

        {/* Onde eu preciso olhar? ------------------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Média por disciplina</CardTitle>
            <CardDescription>
              Da menor para a maior, no período atual. A linha tracejada marca a média de aprovação;
              barras em vermelho estão abaixo dela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectAveragesChart bars={data.subjectBars} />
          </CardContent>
        </Card>

        {/* Constância ------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Minutos estudados por semana</CardTitle>
            <CardDescription>Últimas 12 semanas com registro.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudyWeeksChart weeks={data.studyWeeks} />
          </CardContent>
        </Card>

        {/* Tabela: o gráfico não pode ser a única forma de ler os números. */}
        {data.subjectBars.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Todos os números</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Média por disciplina no período atual, com meta e situação
                </caption>
                <thead>
                  <tr className="text-subtle border-border border-b text-left text-xs">
                    <th scope="col" className="pb-2 font-medium">
                      Disciplina
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

function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'brand' | 'danger' | 'success';
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-subtle text-xs">{label}</p>
        <p
          className={cn(
            'tabular mt-1 text-2xl leading-none font-semibold',
            tone === 'brand' && 'text-brand-text',
            tone === 'danger' && 'text-danger',
            tone === 'success' && 'text-success',
          )}
        >
          {value}
        </p>
        {hint && <p className="text-subtle mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
