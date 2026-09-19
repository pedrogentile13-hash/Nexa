'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Play, Shuffle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PopEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { createPracticeSession } from '../server/practice-actions';
import type { PracticeFilters, PracticeSessionSummary } from '../server/practice-queries';

/**
 * Montagem de uma sessão de prática: "me dá N questões de X, dificuldade Y".
 *
 * Só aparecem no seletor os vestibulares/matérias que REALMENTE têm questão
 * (`practice_filters` conta antes de listar) — um filtro que devolve zero é
 * pior que um filtro que não existe, porque parece que o app quebrou.
 *
 * A contagem ao lado de cada opção não é enfeite: ela é o que faz o aluno
 * entender por que pedir 20 questões de um recorte com 6 devolve 6.
 */

const COUNTS = [5, 10, 20] as const;

const DIFFICULTIES = [
  { value: '', label: 'Qualquer' },
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Média' },
  { value: 'dificil', label: 'Difícil' },
] as const;

export function PracticeSetup({
  filters,
  sessions,
}: {
  filters: PracticeFilters;
  sessions: PracticeSessionSummary[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [count, setCount] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  const hasQuestions = filters.subjects.length > 0 || filters.exams.length > 0;

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await createPracticeSession({
        examId: examId || null,
        subjectId: subjectId || null,
        difficulty: difficulty || null,
        questionCount: count,
      });
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      router.push(`/vestibular/questoes/sessao/${result.sessionId}`);
    });
  }

  if (!hasQuestions) {
    return (
      <PopEmptyState
        icon={<Shuffle className="size-6 text-white" aria-hidden />}
        title="O banco de questões ainda está vazio"
        description="Assim que houver provas de vestibular publicadas, você vai poder montar sessões de treino por matéria e dificuldade aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Montar treino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Vestibular">
            <PillGroup
              value={examId}
              onChange={setExamId}
              options={[
                { value: '', label: 'Todos' },
                ...filters.exams.map((e) => ({
                  value: e.id,
                  label: e.name,
                  hint: String(e.questionCount),
                })),
              ]}
            />
          </Field>

          <Field label="Matéria">
            <PillGroup
              value={subjectId}
              onChange={setSubjectId}
              options={[
                { value: '', label: 'Todas' },
                ...filters.subjects.map((s) => ({
                  value: s.id,
                  label: s.name,
                  hint: String(s.questionCount),
                })),
              ]}
            />
          </Field>

          <Field label="Dificuldade">
            <PillGroup
              value={difficulty}
              onChange={setDifficulty}
              options={DIFFICULTIES.map((d) => ({ value: d.value, label: d.label }))}
            />
          </Field>

          <Field label="Quantas questões">
            <PillGroup
              value={String(count)}
              onChange={(v) => setCount(Number(v))}
              options={COUNTS.map((c) => ({ value: String(c), label: String(c) }))}
            />
          </Field>

          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}

          <Button variant="pop" size="lg" className="w-full" onClick={start} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            {pending ? 'Montando…' : 'Começar treino'}
          </Button>
          <p className="text-subtle text-center text-xs">
            Prioriza o que você ainda não respondeu e o que você errou antes.
          </p>
        </CardContent>
      </Card>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Treinos recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((s) => {
              const done = Boolean(s.finishedAt);
              const label = [s.subjectName, s.examName].filter(Boolean).join(' · ') || 'Treino misto';
              return (
                <Link
                  key={s.id}
                  href={
                    done
                      ? `/vestibular/questoes/sessao/${s.id}/revisao`
                      : `/vestibular/questoes/sessao/${s.id}`
                  }
                  className="border-border hover:bg-surface-2 flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="text-subtle text-xs">
                      {done
                        ? `${s.correctCount} de ${s.totalCount} certas`
                        : `${s.totalCount} questões — em andamento`}
                    </p>
                  </div>
                  {done ? (
                    <Badge variant="neutral">
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Concluído
                    </Badge>
                  ) : (
                    <Badge variant="brand">Continuar</Badge>
                  )}
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-subtle text-xs font-semibold tracking-wide uppercase">{label}</p>
      {children}
    </div>
  );
}

function PillGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value || 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors',
              active
                ? 'border-brand bg-brand-soft text-brand-text font-semibold'
                : 'border-border text-muted hover:bg-surface-2',
            )}
          >
            {option.label}
            {option.hint && (
              <span className={cn('text-xs', active ? 'text-brand-text/70' : 'text-subtle')}>
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
