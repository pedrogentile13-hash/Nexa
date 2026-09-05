import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatGrade, subjectRisk } from '@/features/grades';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Disciplinas',
  description: 'Suas disciplinas, médias e o que falta lançar.',
};

export const dynamic = 'force-dynamic';

const RISK_BADGE = {
  critical: { variant: 'danger' as const, label: 'Abaixo da média' },
  watch: { variant: 'warning' as const, label: 'Atenção' },
  ok: { variant: 'success' as const, label: 'Em dia' },
  unknown: { variant: 'neutral' as const, label: 'Sem notas' },
};

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  const { data: currentTermId } = await supabase.rpc('current_term_id', { p_user_id: user.id });

  const { data: rows } = await supabase
    .from('v_subject_term_averages')
    .select('*')
    .eq('term_id', (currentTermId as string) ?? '')
    .order('subject_name');

  const subjects = rows ?? [];
  const termName = subjects[0]?.term_name ?? 'Período atual';

  // Ordena por urgência: o que precisa de atenção primeiro. Uma lista alfabética
  // faz o aluno procurar; esta responde "onde eu preciso olhar".
  const ordered = [...subjects].sort((a, b) => {
    const order = { critical: 0, watch: 1, unknown: 2, ok: 3 };
    return (
      order[subjectRisk(a)] - order[subjectRisk(b)] ||
      a.subject_name.localeCompare(b.subject_name, 'pt-BR')
    );
  });

  return (
    <>
      <AppHeader title="Disciplinas" subtitle={termName} />

      <PageMain className="space-y-2">
        {ordered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="bg-surface-2 text-subtle mx-auto mb-3 grid size-12 place-items-center rounded-full">
                <BookOpen className="size-6" aria-hidden />
              </div>
              <p className="text-sm font-medium">Nenhuma disciplina neste período.</p>
              <p className="text-muted mt-1 text-sm">
                Você pode adicionar disciplinas pelo seu perfil.
              </p>
            </CardContent>
          </Card>
        ) : (
          ordered.map((subject) => {
            const risk = subjectRisk(subject);
            const badge = RISK_BADGE[risk];

            return (
              <Link
                key={subject.subject_term_id}
                href={`/disciplinas/${subject.subject_id}?st=${subject.subject_term_id}`}
                className="block"
              >
                <Card
                  style={subjectColorVars(subject.subject_color)}
                  className="hover:border-border-strong transition-colors"
                >
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: 'var(--subject-base)' }}
                        />
                        <h2 className="truncate text-sm font-semibold">{subject.subject_name}</h2>
                        <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
                      </div>

                      <div className="flex shrink-0 items-baseline gap-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <span className="tabular text-2xl leading-none font-semibold">
                          {formatGrade(
                            subject.final_grade,
                            subject.decimals,
                            subject.rounding_mode,
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-subtle mb-1 flex items-center justify-between text-xs">
                        <span>
                          {subject.pending_count > 0
                            ? `${subject.pending_count} avaliação${subject.pending_count === 1 ? '' : 'ões'} por lançar`
                            : 'tudo lançado'}
                        </span>
                        <span className="tabular">{Math.round(subject.coverage_percent)}%</span>
                      </div>
                      <Progress
                        value={subject.coverage_percent}
                        label={`Percentual do período lançado em ${subject.subject_name}`}
                        size="sm"
                        tone={
                          risk === 'critical' ? 'danger' : risk === 'watch' ? 'warning' : 'brand'
                        }
                      />
                    </div>

                    {subject.target_grade !== null && (
                      <p className="text-subtle text-xs">
                        Meta {formatGrade(subject.target_grade, 1)} · aprovação{' '}
                        {formatGrade(subject.passing_grade, 1)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </PageMain>
    </>
  );
}
