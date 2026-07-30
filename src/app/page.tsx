import { Check, Target, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  computeSubjectTerm,
  formatGrade,
  requiredUniformScoreForPending,
  type GradeActivity,
  type GradingScheme,
} from '@/features/grades';
import { SUBJECT_COLORS, subjectColorVars } from '@/lib/design/subject-colors';

/**
 * Etapa 1 verification page.
 *
 * Not a product screen — it is the artifact that makes the foundation checkable
 * without a database: the design tokens rendered in both themes, and the grade
 * engine computing README Parte 2's worked example live on the server. It is
 * replaced by `/hoje` in Etapa 3.
 */

const scheme: GradingScheme = {
  id: 'demo',
  name: 'Padrão da escola',
  gradeMin: 0,
  gradeMax: 10,
  passingGrade: 6,
  decimals: 1,
  roundingMode: 'half_up',
  categories: [
    {
      id: 'pb',
      name: 'Prova Bimestral',
      shortCode: 'PB',
      weightPercent: 35,
      dropLowest: 0,
      sequence: 1,
    },
    {
      id: 'va',
      name: 'Verificação de Aprendizagem',
      shortCode: 'VA',
      weightPercent: 35,
      dropLowest: 0,
      sequence: 2,
    },
    {
      id: 'ql',
      name: 'Qualitativa',
      shortCode: 'QL',
      weightPercent: 30,
      dropLowest: 0,
      sequence: 3,
    },
  ],
};

const activities: GradeActivity[] = [
  {
    id: '1',
    categoryId: 'pb',
    title: 'Lista 1',
    score: 8,
    maxScore: null,
    weight: 2,
    isDropped: false,
    replacesActivityId: null,
  },
  {
    id: '2',
    categoryId: 'pb',
    title: 'Lista 2',
    score: 10,
    maxScore: null,
    weight: 1,
    isDropped: false,
    replacesActivityId: null,
  },
  {
    id: '3',
    categoryId: 'pb',
    title: 'Prova',
    score: 6,
    maxScore: null,
    weight: 7,
    isDropped: false,
    replacesActivityId: null,
  },
  {
    id: '4',
    categoryId: 'va',
    title: 'VA 1',
    score: null,
    maxScore: null,
    weight: 1,
    isDropped: false,
    replacesActivityId: null,
  },
  {
    id: '5',
    categoryId: 'ql',
    title: 'Participação',
    score: null,
    maxScore: null,
    weight: 1,
    isDropped: false,
    replacesActivityId: null,
  },
];

const TARGET = 8;

export default function FoundationPage() {
  const result = computeSubjectTerm({ scheme, activities, targetGrade: TARGET });
  const requirement = requiredUniformScoreForPending({ scheme, activities }, TARGET);

  return (
    <main className="pt-safe mx-auto w-full max-w-2xl px-4 pb-16">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="bg-brand text-brand-fg grid size-10 place-items-center rounded-xl text-lg font-bold"
          >
            N
          </span>
          <div>
            <h1 className="text-lg leading-tight font-semibold">Nexa</h1>
            <p className="text-subtle text-xs">Your Academic Operating System</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Badge variant="brand" className="mb-3">
        Etapa 1 · fundação, banco e motor de cálculo
      </Badge>
      <p className="text-muted mb-8 text-sm leading-relaxed">
        Esta página existe só para verificar a base. O banco tem 20 tabelas com RLS, 5 views de
        cálculo e 15 testes SQL; o motor de notas tem 31 testes. Ela é substituída pela tela{' '}
        <strong className="text-text font-medium">Hoje</strong> na Etapa 3.
      </p>

      {/* ── Grade engine, running the README example ─────────────────────── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-brand size-4" aria-hidden />
            Matemática · 1º Bimestre
          </CardTitle>
          <CardDescription>Exemplo do README Parte 2, calculado no servidor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-subtle text-xs">Média atual</p>
              <p className="tabular text-4xl leading-none font-semibold">
                {formatGrade(result.averageCurrent, scheme.decimals)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-subtle text-xs">Meta</p>
              <p className="tabular text-brand-text text-xl font-semibold">
                {formatGrade(TARGET, 1)}
              </p>
            </div>
          </div>

          <div>
            <div className="text-muted mb-1.5 flex items-center justify-between text-xs">
              <span>Bimestre lançado</span>
              <span className="tabular">{Math.round(result.coveragePercent)}%</span>
            </div>
            <Progress
              value={result.coveragePercent}
              label="Percentual do bimestre já lançado"
              tone="brand"
            />
          </div>

          <ul className="divide-border divide-y">
            {result.categories.map((c) => (
              <li key={c.category.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {c.category.shortCode ?? c.category.name}
                    <span className="text-subtle ml-1.5 text-xs font-normal">
                      {c.category.weightPercent}%
                    </span>
                  </p>
                  <p className="text-subtle text-xs">
                    {c.countedCount > 0
                      ? `${c.countedCount} nota${c.countedCount > 1 ? 's' : ''} · peso ${c.countedWeight}`
                      : 'nada lançado'}
                  </p>
                </div>
                <span
                  className={
                    c.average === null
                      ? 'text-subtle tabular text-sm'
                      : 'tabular text-lg font-semibold'
                  }
                >
                  {formatGrade(c.average, scheme.decimals)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ── The solver: the question the README asks and nothing answered ── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-brand size-4" aria-hidden />
            Quanto falta para a média {formatGrade(TARGET, 0)}?
          </CardTitle>
          <CardDescription>
            Resolvido a partir das notas que já existem e do que ainda está pendente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requirement.status === 'possible' && (
            <p className="text-sm leading-relaxed">
              Você precisa de{' '}
              <strong className="tabular text-brand-text text-lg">
                {formatGrade(requirement.requiredScore, 1)}
              </strong>{' '}
              em cada uma das {requirement.pendingCount} avaliações que faltam. Melhor cenário
              possível hoje:{' '}
              <span className="tabular font-medium">
                {formatGrade(requirement.bestPossibleFinal, 1)}
              </span>
              .
            </p>
          )}
          {requirement.status === 'reached' && (
            <p className="text-success flex items-center gap-2 text-sm">
              <Check className="size-4" aria-hidden />
              Meta já garantida, independentemente do que vier.
            </p>
          )}
          {requirement.status === 'impossible' && (
            <p className="text-sm leading-relaxed">
              A meta não é mais alcançável neste bimestre. O máximo possível é{' '}
              <span className="tabular font-medium">
                {formatGrade(requirement.bestPossibleFinal, 1)}
              </span>
              .
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Palette ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta de disciplinas</CardTitle>
          <CardDescription>
            Tokens com valor para tema claro e escuro. Disciplinas guardam o token, nunca um hex.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-1.5">
            {Object.values(SUBJECT_COLORS).map((color) => (
              <li
                key={color.token}
                style={{
                  ...subjectColorVars(color.token),
                  backgroundColor: 'var(--subject-soft)',
                  color: 'var(--subject-on-soft)',
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: 'var(--subject-base)' }}
                />
                {color.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
