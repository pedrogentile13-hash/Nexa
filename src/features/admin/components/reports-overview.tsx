import Link from 'next/link';
import { BarChart3, BookOpen, Flame, GraduationCap, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import type { AdminReportsOverview } from '../server/queries';
import { kindLabel } from '../lib/labels';
import { PrintButton } from './print-button';

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

function studyHoursOf(seconds: number): string {
  return (Math.round((seconds / 3600) * 10) / 10).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  });
}

export function ReportsOverview({ data }: { data: AdminReportsOverview }) {
  const { bySchool, contentOverview } = data;

  return (
    <div className="space-y-4 p-5">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>

      {bySchool.length === 0 ? (
        <PopEmptyState
          icon={<BarChart3 className="text-white" />}
          title="Nenhum aluno ainda"
          description="Assim que houver alunos matriculados, o engajamento deles aparece aqui."
        />
      ) : (
        bySchool.map((school) => (
          <Card key={school.schoolId ?? 'todas'}>
            <CardHeader>
              <CardTitle>
                {school.schoolId ? (
                  <Link href={`/admin/usuarios?school=${school.schoolId}`} className="hover:underline">
                    {school.schoolName}
                  </Link>
                ) : (
                  school.schoolName
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <StatTile icon={GraduationCap} value={String(school.studentCount)} label="Alunos" />
                <StatTile
                  icon={Flame}
                  value={String(school.activeLast7dCount)}
                  label="Ativos em 7 dias"
                />
                <StatTile
                  icon={BookOpen}
                  value={studyHoursOf(school.totalStudySeconds)}
                  label="Horas de estudo (total)"
                />
                <StatTile
                  icon={Flame}
                  value={school.avgCurrentStreak.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })}
                  label="Sequência média"
                />
                <StatTile
                  icon={Trophy}
                  value={String(school.quizzesDone30d)}
                  label="Quizzes em 30 dias"
                />
                <StatTile
                  icon={Trophy}
                  value={String(school.simuladosDone30d)}
                  label="Simulados em 30 dias"
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Card>
        <CardHeader>
          <CardTitle>Acervo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile icon={BookOpen} value={String(contentOverview.schoolCount)} label="Escolas" />
            <StatTile
              icon={BookOpen}
              value={String(contentOverview.subjectCount)}
              label="Matérias"
            />
            <StatTile icon={BookOpen} value={String(contentOverview.trackCount)} label="Trilhas" />
            <StatTile
              icon={BookOpen}
              value={String(contentOverview.draftCount)}
              label="Rascunhos"
            />
          </div>

          {contentOverview.publishedByKind.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {contentOverview.publishedByKind.map(({ kind, count }) => (
                <li
                  key={kind}
                  className="border-border bg-surface rounded-lg border p-3 text-center"
                >
                  <p className="tabular text-lg font-semibold">{count}</p>
                  <p className="text-muted text-xs">{kindLabel(kind)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
