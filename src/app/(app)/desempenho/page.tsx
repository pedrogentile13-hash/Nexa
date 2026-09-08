import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Brain,
  CheckCircle2,
  Flame,
  NotebookPen,
  RotateCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { PageMain } from '@/components/layout/page-main';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { formatGrade } from '@/lib/format/grade';
import {
  AssessmentVsEmpenhoChart,
  ScoreEvolutionChart,
  StudyWeeksChart,
  SubjectScoresChart,
} from '@/features/performance/components/charts';
import { levelProgressPercent } from '@/features/performance/lib/level';
import {
  getPerformance,
  type ScoreEvolutionPoint,
  type TopicMastery,
} from '@/features/performance/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

const PASSING_GRADE = 6;

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

/** Diferença entre as duas últimas semanas com nota avaliativa — não entre
 * bimestres, que não existem mais para efeito de nota. */
function weeklyDelta(points: ScoreEvolutionPoint[]): number | null {
  const graded = points.filter((p) => p.blendedScore !== null);
  if (graded.length < 2) return null;
  const last = graded[graded.length - 1]?.blendedScore ?? null;
  const prev = graded[graded.length - 2]?.blendedScore ?? null;
  if (last === null || prev === null) return null;
  return Number((last - prev).toFixed(2));
}

export const metadata: Metadata = {
  title: 'Desempenho',
  description: 'Como você está e como está evoluindo — tudo automático.',
};

export const dynamic = 'force-dynamic';

/**
 * A nota e a variação, na mesma peça.
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

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Flame;
  value: string;
  label: string;
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-3">
      <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="tabular text-lg leading-none font-semibold">{value}</p>
        <p className="text-muted mt-1 text-xs leading-tight">{label}</p>
      </div>
    </div>
  );
}

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const data = await getPerformance(user.id);

  const gradedSubjects = data.subjectScores.filter((s) => s.blendedScore !== null);
  const hasScores = gradedSubjects.length > 0;
  const below = gradedSubjects.filter((s) => (s.blendedScore ?? 0) < PASSING_GRADE);
  const worst = [...gradedSubjects].sort((a, b) => (a.blendedScore ?? 99) - (b.blendedScore ?? 99));
  const delta = weeklyDelta(data.scoreEvolution);

  // Cada gráfico ganha a frase que ele prova. O aluno lê a frase; o gráfico
  // existe para quem quiser conferir. Um eixo Y sem legenda é decoração.
  const evolutionSentence =
    delta === null
      ? 'A evolução aparece depois de duas semanas com quiz ou simulado feito.'
      : delta > 0
        ? `Sua nota subiu ${formatGrade(Math.abs(delta), 1)} desde a semana passada.`
        : delta < 0
          ? `Sua nota caiu ${formatGrade(Math.abs(delta), 1)} desde a semana passada.`
          : 'Sua nota está igual à da semana passada.';

  const subjectsSentence =
    below.length === 0
      ? 'Nenhuma matéria abaixo da média de aprovação.'
      : below.length === 1
        ? `${below[0]?.subjectName} é a única abaixo da média de aprovação.`
        : `${worst[0]?.subjectName} e ${worst[1]?.subjectName} são as que puxam a nota para baixo.`;

  // A recomendação só aparece com pelo menos duas questões no assunto — uma
  // questão errada sozinha é ruído, não um padrão que vale interromper a tela
  // pra apontar.
  const worstTopic = data.topicMastery.find(
    (topic) => topic.status === 'revisar' && topic.totalCount >= 2,
  );
  const masteryBySubject = groupMasteryBySubject(data.topicMastery);

  const totalQuizzes = data.subjectScores.reduce((sum, s) => sum + s.quizzesDone, 0);
  const totalSimulados = data.subjectScores.reduce((sum, s) => sum + s.simuladosDone, 0);
  const totalContent = data.subjectScores.reduce((sum, s) => sum + s.contentCompleted, 0);
  const studyHours = Math.round((data.totalStudySeconds / 3600) * 10) / 10;

  return (
    <>
      <div
        className="relative overflow-hidden rounded-b-[20px] p-5 text-white md:mx-4 md:mt-4 md:rounded-[20px] lg:mx-6 lg:mt-6"
        style={{ background: 'var(--gradient-header)' }}
      >
        <div className="relative mx-auto flex w-full max-w-[1440px] items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight font-bold tracking-tight md:text-[28px]">
              Seu progresso em foco.
            </h1>
            <p className="mt-1.5 text-sm opacity-90">
              Acompanhe seu desempenho, identifique pontos de melhoria e evolua sempre.
            </p>
          </div>
          <AverageBadge average={data.overallScore} delta={delta} onGradient />
        </div>
      </div>

      <PageMain className="grid gap-4 pt-4 md:pt-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        {/* Números diretos em vez de uma "taxa de conclusão" sem denominador
            claro — o que existe pra contar é isto: quanto foi feito. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:col-span-2 lg:row-start-1">
          <StatTile icon={CheckCircle2} value={String(totalQuizzes)} label="Quizzes feitos" />
          <StatTile icon={Trophy} value={String(totalSimulados)} label="Simulados feitos" />
          <StatTile icon={NotebookPen} value={String(totalContent)} label="Conteúdos concluídos" />
          <StatTile icon={Flame} value={String(data.currentStreak)} label="Sequência atual" />
          <StatTile
            icon={Target}
            value={studyHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
            label="Horas de estudo"
          />
        </div>

        {hasScores ? (
          <>
            <Card className="min-w-0 lg:col-start-1 lg:row-start-2">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed font-medium">{evolutionSentence}</p>
                <div className="mt-3">
                  <ScoreEvolutionChart points={data.scoreEvolution} />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 lg:col-start-1 lg:row-start-3">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed font-medium">{subjectsSentence}</p>
                <div className="mt-3">
                  <SubjectScoresChart scores={data.subjectScores} />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-2">
            <PopEmptyState
              icon={<NotebookPen className="text-white" />}
              title="Seu desempenho começa aqui"
              description="Faça um quiz ou um simulado e o Nexa calcula sua nota automaticamente — nenhuma nota pra digitar."
              action={
                <Button asChild variant="pop">
                  <Link href="/estudar">
                    <NotebookPen aria-hidden />
                    Ir estudar
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
              XP vem de lições, quizzes e minutos de estudo. O que conta de verdade é a nota:{' '}
              {formatGrade(data.overallScore, 1)}.
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
                <Link href="/revisoes">Começar revisão</Link>
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

        {/* Avaliativo × empenho: os dois lados da nota, lado a lado — pra ficar
            claro que estudar sem fazer quiz nenhum não é o caminho, e vice-versa. */}
        {hasScores && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Avaliativo × empenho</CardTitle>
            </CardHeader>
            <CardContent>
              <AssessmentVsEmpenhoChart scores={data.subjectScores} />
            </CardContent>
          </Card>
        )}

        {/* A lista completa de tentativas mora em Simulados agora — antes
            vivia aqui inteira, duplicando o que aquela seção também mostra. */}
        {data.simuladoHistory.length > 0 && (
          <Link
            href="/simulados"
            className="border-border bg-surface hover:bg-surface-2 flex min-w-0 items-center gap-3 rounded-lg border p-4 transition-colors lg:col-span-2"
          >
            <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
              <Trophy className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Ver histórico de simulados</p>
              <p className="text-muted text-xs">
                {data.simuladoHistory.length}{' '}
                {data.simuladoHistory.length === 1 ? 'tentativa registrada' : 'tentativas registradas'}
              </p>
            </div>
            <RotateCcw className="text-subtle size-4 shrink-0" aria-hidden />
          </Link>
        )}

        {/* O gráfico não pode ser a única forma de ler os números. */}
        {gradedSubjects.length > 0 && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Todos os números</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <caption className="sr-only">Nota automática por matéria, com meta e situação</caption>
                <thead>
                  <tr className="text-subtle border-border border-b text-left text-xs">
                    <th scope="col" className="pb-2 font-medium">
                      Matéria
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Nota
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Meta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {gradedSubjects.map((subject) => {
                    const grade = subject.blendedScore ?? 0;
                    const isBelowPassing = grade < PASSING_GRADE;
                    const isBelowTarget =
                      !isBelowPassing && subject.targetGrade !== null && grade < subject.targetGrade;
                    return (
                      <tr key={subject.subjectId}>
                        <th scope="row" className="py-2 text-left font-medium">
                          {subject.subjectName}
                          {isBelowPassing && (
                            <span className="text-danger ml-1.5 text-xs font-normal">
                              abaixo da média
                            </span>
                          )}
                          {isBelowTarget && (
                            <span className="text-muted ml-1.5 text-xs font-normal">
                              abaixo da meta
                            </span>
                          )}
                        </th>
                        <td className="tabular py-2 text-right font-semibold">
                          {formatGrade(subject.blendedScore, 1)}
                        </td>
                        <td className="tabular text-muted py-2 text-right">
                          {subject.targetGrade !== null ? (
                            formatGrade(subject.targetGrade, 1)
                          ) : (
                            <Target className="ml-auto size-3.5 opacity-40" aria-hidden />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </PageMain>
    </>
  );
}
