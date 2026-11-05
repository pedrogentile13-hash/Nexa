'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, Check, Flag, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { answerPracticeQuestion, finishPracticeSession } from '../server/practice-actions';
import type { PracticeQuestion } from '../server/practice-queries';

/**
 * Player de questão avulsa.
 *
 * A diferença de fundo para o `QuizRunner` de prova: aqui o feedback é
 * IMEDIATO — errou, já vê qual era a certa e por quê. É treino, não
 * avaliação. E é exatamente por isso que a resposta não pode ser trocada
 * depois: a tela acabou de contar a resposta. A recusa vem do banco
 * (`answer_practice_question`); aqui a UI só reflete essa regra desabilitando
 * as alternativas.
 *
 * O estado de feedback vive no cliente por questão, mas nunca é a fonte da
 * verdade do placar: quem conta acerto é `finish_practice_session`, lendo
 * `practice_answers`.
 */

interface Feedback {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string | null;
}

export function PracticePlayer({
  sessionId,
  questions,
}: {
  sessionId: string;
  questions: PracticeQuestion[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(() => {
    const firstUnanswered = questions.findIndex((q) => q.myOptionId === null);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback>>({});
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      questions.filter((q) => q.myOptionId).map((q) => [q.questionId, q.myOptionId as string]),
    ),
  );
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, startFinishing] = useTransition();

  // Tempo por questão: zera toda vez que a questão na tela muda.
  const enteredAt = useRef(Date.now());
  const current = questions[index];
  useEffect(() => {
    enteredAt.current = Date.now();
  }, [index]);

  const answeredCount = useMemo(
    () => questions.filter((q) => selected[q.questionId]).length,
    [questions, selected],
  );

  const answer = useCallback(
    async (optionId: string) => {
      if (!current || selected[current.questionId]) return;
      setError(null);
      setPendingQuestionId(current.questionId);

      const seconds = Math.round((Date.now() - enteredAt.current) / 1000);
      const result = await answerPracticeQuestion({
        sessionId,
        questionId: current.questionId,
        optionId,
        timeSpentSeconds: seconds,
      });
      setPendingQuestionId(null);

      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      setSelected((prev) => ({ ...prev, [current.questionId]: optionId }));
      setFeedbacks((prev) => ({ ...prev, [current.questionId]: result.feedback }));
    },
    [current, selected, sessionId],
  );

  function finish() {
    startFinishing(async () => {
      const result = await finishPracticeSession(sessionId);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      router.push(`/vestibular/questoes/sessao/${sessionId}/revisao`);
    });
  }

  if (!current) return null;

  const chosen = selected[current.questionId] ?? null;
  const feedback = feedbacks[current.questionId] ?? null;
  const locked = chosen !== null;
  const isLast = index === questions.length - 1;
  const busy = pendingQuestionId === current.questionId;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-subtle flex items-center justify-between text-xs">
          <span>
            Questão {index + 1} de {questions.length}
          </span>
          <span>{answeredCount} respondidas</span>
        </div>
        <Progress
          label="Progresso do treino"
          value={(answeredCount / questions.length) * 100}
        />
      </div>

      <div className="border-border bg-surface space-y-4 rounded-[20px] border p-4">
        <div className="flex flex-wrap gap-1.5">
          {current.subjectName && <Badge variant="brand">{current.subjectName}</Badge>}
          {current.examName && (
            <Badge variant="outline">
              {current.examName}
              {current.editionYear ? ` ${current.editionYear}` : ''}
            </Badge>
          )}
          {current.topicName && <Badge variant="neutral">{current.topicName}</Badge>}
        </div>

        <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap">{current.statement}</p>

        <ul className="space-y-2">
          {current.options.map((option, i) => {
            const isChosen = chosen === option.id;
            const isRight = feedback?.correctOptionId === option.id;
            const showWrong = locked && isChosen && feedback && !feedback.isCorrect;

            return (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={locked || busy}
                  onClick={() => answer(option.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border p-3 text-left text-sm transition-colors',
                    'disabled:cursor-default',
                    locked && isRight && 'border-success bg-success-soft',
                    showWrong && 'border-danger bg-danger-soft',
                    !locked && 'border-border hover:bg-surface-2',
                    locked && !isRight && !showWrong && 'border-border opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                      locked && isRight
                        ? 'bg-success text-white'
                        : showWrong
                          ? 'bg-danger text-white'
                          : 'bg-surface-2 text-muted',
                    )}
                    aria-hidden
                  >
                    {locked && isRight ? (
                      <Check className="size-3.5" />
                    ) : showWrong ? (
                      <X className="size-3.5" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{option.body}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {busy && (
          <p className="text-subtle flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Registrando…
          </p>
        )}

        {feedback && (
          <div
            role="status"
            className={cn(
              'rounded-2xl p-3 text-sm',
              feedback.isCorrect ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
            )}
          >
            <p className="font-semibold">
              {feedback.isCorrect ? 'Acertou!' : 'Não foi dessa vez.'}
            </p>
            {feedback.explanation && (
              <p className="text-text mt-1 leading-snug whitespace-pre-wrap opacity-90">
                {feedback.explanation}
              </p>
            )}
          </div>
        )}

        {/*
          Uma questão já respondida em outra visita volta sem feedback (o
          gabarito só sai na hora da resposta, nunca numa leitura). Dizer isso
          é melhor que deixar a tela parecer travada sem explicação.
        */}
        {locked && !feedback && (
          <p className="text-subtle text-sm">
            Você já respondeu esta questão. A correção completa aparece na revisão, no fim do treino.
          </p>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Anterior
        </Button>

        {isLast ? (
          <Button variant="pop" className="flex-1" onClick={finish} disabled={finishing}>
            {finishing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Flag className="size-4" aria-hidden />
            )}
            Encerrar treino
          </Button>
        ) : (
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Próxima
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      {!isLast && (
        <button
          type="button"
          onClick={finish}
          disabled={finishing}
          className="text-subtle hover:text-muted w-full text-center text-sm underline underline-offset-4"
        >
          Encerrar agora e ver a revisão
        </button>
      )}
    </div>
  );
}
