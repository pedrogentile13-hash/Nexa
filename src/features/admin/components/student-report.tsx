import { Flame, NotebookPen, Target, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PopEmptyState } from '@/components/ui/empty-state';
import { formatGrade } from '@/lib/format/grade';
import { levelForXp, levelProgressPercent, xpToNextLevel } from '@/features/performance/lib/level';
import {
  ScoreEvolutionChart,
  StudyWeeksChart,
  SubjectScoresChart,
} from '@/features/performance/components/charts';
import type { AdminStudentReport } from '../server/queries';

const ROLE_LABEL: Record<string, string> = {
  student: 'Aluno',
  school_admin: 'Admin da escola',
  admin: 'Admin geral',
};

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

export function StudentReport({ report }: { report: AdminStudentReport }) {
  const { person, stats, subjectScores, scoreEvolution, simuladoHistory, studyWeeks } = report;

  const gradedSubjects = subjectScores.filter((s) => s.blendedScore !== null);
  const hasScores = gradedSubjects.length > 0;
  const overallScore = hasScores
    ? gradedSubjects.reduce((sum, s) => sum + (s.blendedScore ?? 0), 0) / gradedSubjects.length
    : null;
  const studyHours = stats ? Math.round((stats.totalStudySeconds / 3600) * 10) / 10 : 0;
  const level = stats ? levelForXp(stats.xp) : 1;

  return (
    <div className="space-y-4 p-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{person.fullName ?? 'Sem nome'}</h1>
        <p className="text-muted text-sm">
          {ROLE_LABEL[person.role] ?? person.role}
          {person.schoolName ? ` · ${person.schoolName}` : ''}
        </p>
      </div>

      {!stats ? (
        <PopEmptyState
          icon={<NotebookPen className="text-white" />}
          title="Este aluno ainda não estudou nada"
          description="Assim que ele fizer um quiz, um simulado, ou ler um resumo, o desempenho aparece aqui."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              icon={Target}
              value={formatGrade(overallScore, 1)}
              label="Nota geral"
            />
            <StatTile icon={Flame} value={String(stats.currentStreak)} label="Sequência atual" />
            <StatTile icon={Trophy} value={String(stats.longestStreak)} label="Maior sequência" />
            <StatTile
              icon={NotebookPen}
              value={studyHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              label="Horas de estudo"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nível</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="bg-brand-soft text-brand-text grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-semibold tabular-nums"
                >
                  {level}
                </span>
                <div className="min-w-0">
                  <p className="tabular text-lg leading-none font-semibold">
                    {stats.xp.toLocaleString('pt-BR')} XP
                  </p>
                  <p className="text-muted mt-1 text-xs leading-relaxed">
                    {xpToNextLevel(stats.xp).toLocaleString('pt-BR')} XP para o nível {level + 1}
                  </p>
                </div>
              </div>
              <Progress
                value={levelProgressPercent(stats.xp)}
                label={`Progresso para o nível ${level + 1}`}
                size="sm"
              />
            </CardContent>
          </Card>

          {hasScores ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed font-medium">Evolução da nota</p>
                  <div className="mt-3">
                    <ScoreEvolutionChart points={scoreEvolution} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed font-medium">Nota por matéria</p>
                  <div className="mt-3">
                    <SubjectScoresChart scores={subjectScores} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Todos os números</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <caption className="sr-only">Nota automática por matéria</caption>
                    <thead>
                      <tr className="text-subtle border-border border-b text-left text-xs">
                        <th scope="col" className="pb-2 font-medium">
                          Matéria
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Nota
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Quizzes
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Simulados
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Conteúdo concluído
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {gradedSubjects.map((subject) => (
                        <tr key={subject.subjectId}>
                          <th scope="row" className="py-2 text-left font-medium">
                            {subject.subjectName}
                          </th>
                          <td className="tabular py-2 text-right font-semibold">
                            {formatGrade(subject.blendedScore, 1)}
                          </td>
                          <td className="tabular text-muted py-2 text-right">
                            {subject.quizzesDone}
                          </td>
                          <td className="tabular text-muted py-2 text-right">
                            {subject.simuladosDone}
                          </td>
                          <td className="tabular text-muted py-2 text-right">
                            {subject.contentCompleted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          ) : (
            <PopEmptyState
              icon={<NotebookPen className="text-white" />}
              title="Nenhuma matéria com nota ainda"
              description="A nota aparece automaticamente depois do primeiro quiz ou simulado feito."
            />
          )}

          {studyWeeks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estudo por semana</CardTitle>
              </CardHeader>
              <CardContent>
                <StudyWeeksChart weeks={studyWeeks} />
              </CardContent>
            </Card>
          )}

          {simuladoHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de simulados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-border divide-y">
                  {simuladoHistory.map((attempt) => (
                    <li key={attempt.attemptId} className="flex items-center gap-3 p-3">
                      <span className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-lg">
                        <Trophy className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attempt.resourceTitle}</p>
                        <p className="text-muted text-xs">
                          {attempt.subjectName ?? '—'} · {attempt.correctCount}/{attempt.totalCount}{' '}
                          ({Math.round(attempt.percent)}%)
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
