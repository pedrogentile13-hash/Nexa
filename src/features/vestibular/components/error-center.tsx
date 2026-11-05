'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, RotateCcw, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PopEmptyState } from '@/components/ui/empty-state';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { cn } from '@/lib/utils';
import { startErrorPractice } from '../server/practice-actions';
import type { SubjectPerformance, VestibularError } from '../server/performance-queries';

/**
 * Central de erros: o que o aluno erra HOJE, e o botão que transforma isso
 * numa sessão de treino.
 *
 * "Hoje" é literal: uma questão errada em março e refeita com acerto em
 * setembro sai da lista sozinha, porque o critério no banco é a resposta
 * mais recente. Uma lista que nunca esvazia é uma lista que ninguém abre.
 *
 * O filtro por matéria é do cliente porque a lista já vem limitada (30) —
 * voltar ao servidor a cada clique seria um round-trip sem ganho.
 */
export function ErrorCenter({
  errors,
  subjects,
}: {
  errors: VestibularError[];
  subjects: SubjectPerformance[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subjectId, setSubjectId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const visible = subjectId ? errors.filter((e) => e.subjectId === subjectId) : errors;

  function redo() {
    setMessage(null);
    startTransition(async () => {
      const result = await startErrorPractice({ subjectId: subjectId || null, questionCount: 10 });
      if (result.status === 'error') {
        setMessage(result.message);
        return;
      }
      router.push(`/vestibular/questoes/sessao/${result.sessionId}`);
    });
  }

  if (errors.length === 0) {
    return (
      <PopEmptyState
        icon={<Target className="size-6 text-white" aria-hidden />}
        title="Nenhum erro pendente"
        description="Tudo que você respondeu de vestibular até agora está certo na última tentativa. Responda mais questões pra esta lista ter o que mostrar."
      />
    );
  }

  // Só as matérias que aparecem nos erros — um filtro que devolve zero é pior
  // que um filtro que não existe.
  const filterable = subjects.filter((s) => errors.some((e) => e.subjectId === s.subjectId));

  return (
    <div className="space-y-4">
      {filterable.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterPill active={!subjectId} onClick={() => setSubjectId('')}>
            Todas ({errors.length})
          </FilterPill>
          {filterable.map((s) => (
            <FilterPill
              key={s.subjectId}
              active={subjectId === s.subjectId}
              onClick={() => setSubjectId(s.subjectId)}
            >
              {s.subjectName} ({errors.filter((e) => e.subjectId === s.subjectId).length})
            </FilterPill>
          ))}
        </div>
      )}

      <Button variant="pop" size="lg" className="w-full" onClick={redo} disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <RotateCcw className="size-4" aria-hidden />
        )}
        Refazer estes erros
      </Button>

      {message && (
        <p role="alert" className="text-danger text-center text-sm">
          {message}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((error) => (
          <li
            key={error.questionId}
            style={subjectColorVars(error.subjectColor)}
            className="border-border bg-surface rounded-[20px] border p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[var(--subject-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--subject-on-soft)]">
                {error.subjectName}
              </span>
              {error.topicName && <Badge variant="neutral">{error.topicName}</Badge>}
              {error.examName && (
                <Badge variant="outline">
                  {error.examName}
                  {error.editionYear ? ` ${error.editionYear}` : ''}
                </Badge>
              )}
              <Badge variant="neutral">{error.source === 'prova' ? 'Prova' : 'Treino'}</Badge>
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-wrap">{error.statement}</p>

            {error.correctOptionBody && (
              <p className="mt-3 text-sm">
                <span className="text-subtle">Resposta certa: </span>
                <span className="text-success font-medium">{error.correctOptionBody}</span>
              </p>
            )}

            {error.explanation && (
              <p className="bg-surface-2 text-muted mt-2 rounded-2xl p-3 text-sm leading-snug whitespace-pre-wrap">
                {error.explanation}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center rounded-full border px-3.5 text-sm transition-colors',
        active
          ? 'border-brand bg-brand-soft text-brand-text font-semibold'
          : 'border-border text-muted hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}
