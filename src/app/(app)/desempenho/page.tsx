import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
// Renomeado para `loadChart`: o próprio arquivo já exporta um `dynamic`
// (config de rota do Next, `force-dynamic` abaixo) — mesmo nome, coisas
// diferentes, e o import perderia para essa declaração de módulo.
import loadChart from 'next/dynamic';
import {
  AlertOctagon,
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
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { StatTile } from '@/components/ui/stat-tile';
import { formatGrade } from '@/lib/format/grade';
import { levelProgressPercent } from '@/features/performance/lib/level';
import {
  getPerformance,
  type ScoreEvolutionPoint,
} from '@/features/performance/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';
import { MasteryPanel } from '@/features/performance/components/mastery-panel';
import { cn } from '@/lib/utils';

// `recharts` é pesado e só entra no bundle desta página — `dynamic()` corta o
// código dos gráficos num chunk à parte em vez de somá-lo ao JS inicial de
// `/desempenho`. Sem `ssr: false` (não é permitido em Server Component): o
// HTML ainda vem pronto no primeiro request, só o carregamento do bundle é
// que fica separado do resto da página.
const AssessmentVsEmpenhoChart = loadChart(() =>
  import('@/features/performance/components/charts').then((m) => m.AssessmentVsEmpenhoChart),
);
const ScoreEvolutionChart = loadChart(() =>
  import('@/features/performance/components/charts').then((m) => m.ScoreEvolutionChart),
);
const StudyWeeksChart = loadChart(() =>
  import('@/features/performance/components/charts').then((m) => m.StudyWeeksChart),
);
const SubjectScoresChart = loadChart(() =>
  import('@/features/performance/components/charts').then((m) => m.SubjectScoresChart),
);

const PASSING_GRADE = 6;

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

/** A nota e a variação, na mesma peça. */
function AverageBadge({ average, delta }: { average: number | null; delta: number | null }) {
  const up = (delta ?? 0) > 0;

  return (
    <div className="flex shrink-0 items-center gap-2 text-right">
      <span className="tabular text-brand-text text-2xl leading-none font-semibold">
        {formatGrade(average, 1)}
      </span>

      {delta !== null && delta !== 0 && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums',
            up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
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

  const totalQuizzes = data.subjectScores.reduce((sum, s) => sum + s.quizzesDone, 0);
  const totalSimulados = data.subjectScores.reduce((sum, s) => sum + s.simuladosDone, 0);
  const totalContent = data.subjectScores.reduce((sum, s) => sum + s.contentCompleted, 0);
  const studyHours = Math.round((data.totalStudySeconds / 3600) * 10) / 10;

  return (
    <>
      <AppHeader
        title="Seu progresso em foco."
        subtitle="Notas e evolução, automáticas."
        action={<AverageBadge average={data.overallScore} delta={delta} />}
      />

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

        {/* Boletim automático: todas as matérias numa tabela só, como o boletim
            da escola — a nota vem dos quizzes e simulados, ninguém digita. */}
        {data.subjectScores.length > 0 && (
          <Card className="min-w-0 overflow-hidden lg:col-span-2 lg:row-start-2">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Boletim</CardTitle>
              <span className="text-muted text-xs">Média geral {formatGrade(data.overallScore, 1)}</span>
            </CardHeader>
            <table className="w-full text-sm">
              <caption className="sr-only">Nota automática por matéria, com avaliações feitas e empenho</caption>
              <thead>
                <tr className="text-muted border-border border-y text-xs">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold">
                    Disciplinas
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                    Provas
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                    Empenho
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...data.subjectScores]
                  .sort((a, b) => a.subjectName.localeCompare(b.subjectName, 'pt-BR'))
                  .map((subject) => {
                    const grade = subject.blendedScore;
                    const failing = grade !== null && grade < PASSING_GRADE;
                    return (
                      <tr key={subject.subjectId} className="even:bg-surface-2/60">
                        <th scope="row" className="px-4 py-3 text-left leading-tight font-medium">
                          {subject.subjectName}
                          {subject.targetGrade !== null && grade !== null && grade < subject.targetGrade && !failing && (
                            <span className="text-subtle block text-xs font-normal">meta {formatGrade(subject.targetGrade, 1)}</span>
                          )}
                        </th>
                        <td className="tabular text-muted px-2 py-3 text-center">{subject.quizzesDone + subject.simuladosDone}</td>
                        <td className="tabular text-muted px-2 py-3 text-center">{Math.round(subject.empenhoIndex * 100)}%</td>
                        <td
                          className={cn(
                            'tabular px-4 py-3 text-right text-base font-semibold',
                            grade === null ? 'text-subtle' : failing ? 'text-danger' : 'text-brand-text',
                          )}
                        >
                          {formatGrade(grade, 1)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </Card>
        )}

        {hasScores ? (
          <>
            <Card className="min-w-0 lg:col-start-1 lg:row-start-3">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed font-medium">{evolutionSentence}</p>
                <div className="mt-3">
                  <ScoreEvolutionChart points={data.scoreEvolution} />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 lg:col-start-1 lg:row-start-4">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed font-medium">{subjectsSentence}</p>
                <div className="mt-3">
                  <SubjectScoresChart scores={data.subjectScores} />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-3">
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

        <Card className="min-w-0 lg:col-start-2 lg:row-start-4">
          <CardHeader>
            <CardTitle>Estudo por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <StudyWeeksChart weeks={data.studyWeeks} />
          </CardContent>
        </Card>

        {/* Nível: sóbrio de propósito. O XP aparece menor que a nota do
            cabeçalho, porque a nota é o que importa e o XP é reconhecimento. */}
        <Card className="min-w-0 lg:col-start-2 lg:row-start-3">
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
        {data.topicMastery.length > 0 && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Mapa de domínio</CardTitle>
            </CardHeader>
            <CardContent>
              <MasteryPanel
                grouped
                rows={data.topicMastery.map((t) => ({
                  name: t.topicName,
                  group: t.subjectName,
                  correct: t.correctCount,
                  total: t.totalCount,
                  percent: t.masteryPercent,
                  status: t.status,
                }))}
              />
            </CardContent>
          </Card>
        )}

        {/* Habilidade é mais granular que assunto — só aparece pra quem tem
            questões com `skills` cadastrado (simulados v2), o que hoje é uma
            fração do acervo. Sem isso, a seção simplesmente não existe. */}
        {data.skillMastery.length > 0 && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Domínio por habilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MasteryPanel
                grouped={false}
                rows={data.skillMastery.map((k) => ({
                  name: k.skill,
                  group: 'Habilidades',
                  correct: k.correctCount,
                  total: k.totalCount,
                  percent: k.masteryPercent,
                  status: k.status,
                }))}
              />

              {data.commonErrorTypes.length > 0 && (
                <div className="border-border border-t pt-3">
                  <p className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
                    Erros mais comuns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.commonErrorTypes.slice(0, 5).map((error) => (
                      <span
                        key={error.errorType}
                        className="bg-danger-soft text-danger flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                      >
                        <AlertOctagon className="size-3.5" aria-hidden />
                        {error.errorType}
                        <span className="tabular-nums opacity-70">{error.occurrences}×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

      </PageMain>
    </>
  );
}
