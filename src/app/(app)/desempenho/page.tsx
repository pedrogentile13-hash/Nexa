import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Brain, NotebookPen, TrendingDown, TrendingUp } from 'lucide-react';
import { GradientHeader } from '@/components/layout/gradient-header';
import { PageMain } from '@/components/layout/page-main';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { formatGrade } from '@/features/grades';
import {
  StudyWeeksChart,
  SubjectAveragesChart,
  TermEvolutionChart,
} from '@/features/performance/components/charts';
import { levelProgressPercent } from '@/features/performance/lib/level';
import { getPerformance, type TopicMastery } from '@/features/performance/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

const STATUS_DOT: Record<TopicMastery['status'], string> = {
  dominado: 'bg-success',
  desenvolvimento: 'bg-warning',
  revisar: 'bg-danger',
};

/** Agrupa mantendo a ordem de chegada — como `topicMastery` já vem pior
 * primeiro, a matéria mais fraca também abre o mapa de domínio. */
function groupMasteryBySubject(topics: TopicMastery[]): [string, TopicMastery[]][] {
  const map = new Map<string, TopicMastery[]>();
  for (const topic of topics) {
    const list = map.get(topic.subjectName);
    if (list) list.push(topic);
    else map.set(topic.subjectName, [topic]);
  }
  return [...map.entries()];
}

export const metadata: Metadata = {
  title: 'Desempenho',
  description: 'Como você está e como está evoluindo.',
};

export const dynamic = 'force-dynamic';

/**
 * A média e a variação, na mesma peça.
 *
 * Existe uma versão para o degradê e outra para o fundo claro porque o verde e
 * o vermelho do tema não têm contraste suficiente sobre o azul — sobre a faixa
 * eles viram superfícies translúcidas, e sobre o claro voltam a ser os tokens.
 */
function AverageBadge({
  average,
  delta,
  onGradient = false,
}: {
  average: number | null;
  delta: number | null;
  onGradient?: boolean;
}) {
  const up = (delta ?? 0) > 0;

  return (
    <div className="flex shrink-0 items-center gap-2 text-right">
      <span
        className={cn(
          'tabular text-3xl leading-none font-semibold md:text-4xl',
          onGradient ? '' : 'text-brand-text',
        )}
      >
        {formatGrade(average, 1)}
      </span>

      {delta !== null && delta !== 0 && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums',
            !onGradient && (up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'),
          )}
          style={
            onGradient
              ? {
                  backgroundColor: up ? 'rgba(74, 222, 128, 0.22)' : 'rgba(248, 113, 113, 0.22)',
                }
              : undefined
          }
        >
          {up ? (
            <TrendingUp className="size-3.5" aria-hidden />
          ) : (
            <TrendingDown className="size-3.5" aria-hidden />
          )}
          {up ? '+' : '−'}
          {formatGrade(Math.abs(delta), 1)}
        </span>
      )}
    </div>
  );
}

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const data = await getPerformance(user.id);

  const below = data.subjectBars.filter((b) => b.isBelowPassing);
  const worst = [...data.subjectBars].sort((a, b) => (a.average ?? 99) - (b.average ?? 99));

  // "Nenhuma matéria abaixo da média" é uma frase de parabéns — mas quando o
  // motivo real é que NENHUMA nota foi lançada ainda, ela mente por omissão.
  // Sem nota nenhuma, as duas seções de nota (evolução, matérias) somem e dão
  // lugar a um único estado vazio: aqui não há dois recados incompletos, há
  // um recado completo ("comece lançando uma nota"), com um próximo passo.
  const hasGrades = data.subjectBars.length > 0;

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

  // A recomendação só aparece com pelo menos duas questões no assunto — uma
  // questão errada sozinha é ruído, não um padrão que vale interromper a tela
  // pra apontar.
  const worstTopic = data.topicMastery.find(
    (topic) => topic.status === 'revisar' && topic.totalCount >= 2,
  );
  const masteryBySubject = groupMasteryBySubject(data.topicMastery);

  return (
    <>
      {/* No celular o degradê; no desktop, um cabeçalho claro com o número em
          azul, como o guia mostra. Numa tela larga a faixa colorida ocuparia
          uma fatia de área que não carrega informação nenhuma. */}
      <div className="md:hidden">
        <GradientHeader
          title="Desempenho"
          subtitle={`Média geral do ${data.currentTermName ?? 'período atual'}`}
          right={
            <AverageBadge average={data.overallAverage} delta={data.averageDelta} onGradient />
          }
        />
      </div>

      <PageMain className="grid gap-4 pt-4 md:pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <div className="hidden items-start justify-between gap-4 md:flex lg:col-span-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Desempenho</h1>
            <p className="text-muted mt-0.5 text-sm">
              Média geral do {data.currentTermName ?? 'período atual'}
            </p>
          </div>
          <AverageBadge average={data.overallAverage} delta={data.averageDelta} />
        </div>

        {hasGrades ? (
          <>
            <Card className="min-w-0 lg:col-start-1 lg:row-start-2">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed font-medium">{evolutionSentence}</p>
                <div className="mt-3">
                  <TermEvolutionChart points={data.termPoints} />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 lg:col-start-1 lg:row-start-3">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed font-medium">{subjectsSentence}</p>
                <div className="mt-3">
                  <SubjectAveragesChart bars={data.subjectBars} />
                </div>
                {data.pendingActivities > 0 && (
                  <p className="text-subtle mt-3 text-xs">
                    {data.pendingActivities}{' '}
                    {data.pendingActivities === 1 ? 'avaliação ainda' : 'avaliações ainda'} por
                    lançar neste período.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-2">
            <PopEmptyState
              icon={<NotebookPen className="text-white" />}
              title="Seu desempenho começa aqui"
              description="Lance sua primeira nota para o Nexa acompanhar sua evolução por matéria e por período."
              action={
                <Button asChild variant="pop">
                  <Link href="/disciplinas">
                    <NotebookPen aria-hidden />
                    Lançar minha primeira nota
                  </Link>
                </Button>
              }
            />
          </div>
        )}

        <Card className="min-w-0 lg:col-start-2 lg:row-start-3">
          <CardHeader>
            <CardTitle>Estudo por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <StudyWeeksChart weeks={data.studyWeeks} />
          </CardContent>
        </Card>

        {/* Nível: sóbrio de propósito. O XP aparece menor que a nota do
            cabeçalho, porque a nota é o que importa e o XP é reconhecimento. */}
        <Card className="min-w-0 lg:col-start-2 lg:row-start-2">
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

        {/* A recomendação: o "e agora?" depois do mapa de domínio, pro assunto
            mais fraco de todos — não faz sentido apontar mais de um de cada
            vez. */}
        {worstTopic && (
          <Card className="border-brand/30 bg-brand-soft min-w-0 lg:col-span-2">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  aria-hidden
                  className="bg-brand grid size-10 shrink-0 place-items-center rounded-full"
                >
                  <Brain className="size-5 text-white" />
                </span>
                <p className="text-brand-text min-w-0 flex-1 text-sm leading-relaxed">
                  <span className="font-semibold">Oportunidade de melhoria: </span>
                  Você está com dificuldade em <strong>{worstTopic.topicName}</strong> (
                  {worstTopic.subjectName}) — {worstTopic.masteryPercent}% de acerto nas últimas
                  questões.
                </p>
              </div>
              <Button asChild variant="pop" size="sm" className="w-full shrink-0 sm:w-auto">
                <Link href="/erros">Começar revisão</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* O domínio por assunto: de onde a recomendação acima veio, e onde
            olhar mesmo sem nenhum assunto crítico o bastante pra virar
            recomendação. */}
        {masteryBySubject.length > 0 && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Mapa de domínio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {masteryBySubject.map(([subjectName, topics]) => (
                <div key={subjectName}>
                  <p className="text-muted mb-1.5 text-xs font-semibold tracking-wide uppercase">
                    {subjectName}
                  </p>
                  <ul className="divide-border divide-y">
                    {topics.map((topic) => (
                      <li key={topic.topicId ?? topic.topicName} className="flex items-center gap-3 py-2">
                        <span
                          aria-hidden
                          className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT[topic.status])}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {topic.topicName}
                        </span>
                        <span className="text-muted shrink-0 text-xs tabular-nums">
                          {topic.correctCount}/{topic.totalCount}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
