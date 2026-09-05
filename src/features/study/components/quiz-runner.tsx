'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, CircleHelp, Clock, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import { clockTime, humanDuration } from '../lib/format';
import { answerQuestion, finishAttempt, startAttempt } from '../server/actions';
import type { ResourceDetail } from '../server/queries';
import type { QuizQuestion } from './resource-viewer';

/**
 * Execução de quiz e simulado.
 *
 * São produtos diferentes na mesma máquina:
 *   • QUIZ — feedback na hora, com a explicação. Serve para aprender.
 *   • SIMULADO — cronômetro, sem feedback, revisão só no fim. Serve para medir.
 *
 * Misturar os dois destruiria os dois: um simulado que corrige na hora vira
 * quiz longo, e um quiz que só corrige no fim perde a razão de existir.
 *
 * Nenhuma resposta é conferida aqui. `answerQuestion` chama a função do banco,
 * que corrige e devolve o veredito — o gabarito nunca chega a este componente,
 * então não há o que inspecionar no DevTools.
 */

type Phase = 'intro' | 'running' | 'done';

export function QuizRunner({
  resource,
  questions,
}: {
  resource: ResourceDetail;
  questions: QuizQuestion[];
}) {
  const router = useRouter();
  const isQuiz = resource.kind === 'quiz';

  const [phase, setPhase] = useState<Phase>('intro');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{
    isCorrect: boolean;
    correctOptionId: string | null;
    explanation: string | null;
  } | null>(null);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<{
    correctCount: number;
    totalCount: number;
    durationSeconds: number;
    xpAwarded: number;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const question = questions[index];
  const total = questions.length;

  // Cronômetro só do simulado. No quiz ele viraria pressão sem propósito —
  // e pressão é exatamente o que atrapalha quem está tentando entender.
  useEffect(() => {
    if (phase !== 'running' || isQuiz) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase, isQuiz]);

  const limit = resource.timeLimitSeconds ?? 0;
  const remaining = limit > 0 ? Math.max(0, limit - elapsed) : null;

  function begin() {
    setError(null);
    startTransition(async () => {
      const result = await startAttempt(resource.id);
      if (result.status === 'error') {
        setError(result.message);
        return;
      }
      setAttemptId(result.attemptId);
      setPhase('running');
    });
  }

  function submitAnswer(optionId: string) {
    if (!attemptId || !question || verdict) return;
    setChosen(optionId);

    startTransition(async () => {
      const result = await answerQuestion(attemptId, question.question_id, optionId);
      setAnswered((current) => ({
        ...current,
        [question.question_id]: result?.isCorrect ?? false,
      }));
      // O simulado registra e segue; só o quiz revela na hora.
      if (isQuiz && result) setVerdict(result);
      else advance();
    });
  }

  function advance() {
    setVerdict(null);
    setChosen(null);
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      return;
    }
    finish();
  }

  function finish() {
    if (!attemptId) return;
    startTransition(async () => {
      const result = await finishAttempt(attemptId);
      if (result) setSummary(result);
      setPhase('done');
    });
  }

  // ------------------------------------------------------------- intro --
  if (phase === 'intro') {
    return (
      <div style={subjectColorVars(resource.subjectColor)}>
        <StudyTopBar title={resource.subjectName} subtitle={resource.topicName} />

        <div className="mx-auto max-w-2xl px-5 pb-8">
          <div className="border-border bg-surface rounded-2xl border p-6 text-center">
            <span
              aria-hidden
              className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl"
              style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
            >
              <CircleHelp className="size-7" />
            </span>

            <h1 className="text-xl font-semibold tracking-tight">{resource.title}</h1>
            {resource.description && (
              <p className="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
                {resource.description}
              </p>
            )}

            <dl className="text-muted mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
              <div>
                <dt className="sr-only">Questões</dt>
                <dd className="tabular-nums">
                  <strong className="text-text font-semibold">{total}</strong>{' '}
                  {total === 1 ? 'questão' : 'questões'}
                </dd>
              </div>
              {limit > 0 && (
                <div>
                  <dt className="sr-only">Tempo</dt>
                  <dd className="tabular-nums">{humanDuration(limit)}</dd>
                </div>
              )}
              {resource.xpReward > 0 && (
                <div>
                  <dt className="sr-only">XP</dt>
                  <dd className="tabular-nums">até {resource.xpReward} XP</dd>
                </div>
              )}
            </dl>

            <p className="text-subtle mt-4 text-xs leading-relaxed">
              {isQuiz
                ? 'Você vê se acertou logo depois de responder, com a explicação.'
                : 'A correção aparece no fim, como numa prova. O tempo fica no topo.'}
            </p>

            {error && <p className="text-danger mt-4 text-sm">{error}</p>}

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={begin}
              disabled={pending || total === 0}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {total === 0
                ? 'Ainda sem questões'
                : isQuiz
                  ? 'Começar o quiz'
                  : 'Começar o simulado'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ termina --
  if (phase === 'done' && summary) {
    const percent = summary.totalCount > 0 ? (summary.correctCount / summary.totalCount) * 100 : 0;

    return (
      <div style={subjectColorVars(resource.subjectColor)}>
        <StudyTopBar title={resource.subjectName} subtitle={resource.title} />

        <div className="mx-auto max-w-2xl space-y-4 px-5 pb-8">
          <div className="border-border bg-surface rounded-2xl border p-6 text-center">
            <p className="text-5xl leading-none font-semibold tabular-nums">
              {summary.correctCount}
              <span className="text-muted text-2xl">/{summary.totalCount}</span>
            </p>
            <p className="text-muted mt-2 text-sm">
              {Math.round(percent)}% de acerto
              {summary.durationSeconds > 0 && ` · ${humanDuration(summary.durationSeconds)}`}
            </p>

            {summary.xpAwarded > 0 && (
              <p className="bg-brand-soft text-brand-text mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold">
                <Sparkles className="size-4" aria-hidden />+{summary.xpAwarded} XP
              </p>
            )}

            {/* A frase que interpreta o número. Sem ela, 13/20 é só um número —
                e um número sozinho não diz o que fazer amanhã. */}
            <p className="text-muted mx-auto mt-4 max-w-sm text-sm leading-relaxed">
              {percent >= 80
                ? 'Domínio bom deste assunto. Vale partir para o próximo.'
                : percent >= 50
                  ? 'A base está de pé. Revisar o que errou fecha a diferença rápido.'
                  : 'Este assunto ainda não está firme — e agora você sabe exatamente onde.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push('/estudar')}>
              Voltar ao material
            </Button>
            <Button
              className="flex-1"
              onClick={() =>
                router.push(`/estudar/${resource.id}/resultado?tentativa=${attemptId}`)
              }
            >
              Ver gabarito
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <Loader2 className="text-muted size-5 animate-spin" aria-hidden />
      </div>
    );
  }

  // ------------------------------------------------------------ rodando --
  return (
    <div style={subjectColorVars(resource.subjectColor)} className="pb-28">
      <StudyTopBar
        title={`Questão ${index + 1} de ${total}`}
        subtitle={question.topic_name ?? resource.subjectName}
        right={
          remaining !== null ? (
            <span
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums',
                remaining < 60 ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-muted',
              )}
            >
              <Clock className="size-4" aria-hidden />
              {clockTime(remaining)}
            </span>
          ) : null
        }
      />

      <div className="bg-surface-2 h-1">
        <div
          className="h-full transition-[width]"
          style={{
            width: `${((index + 1) / total) * 100}%`,
            backgroundColor: 'var(--subject-base)',
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-5 pt-5">
        <h1 className="text-lg leading-snug font-semibold">{question.statement}</h1>

        <ul className="mt-5 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const isChosen = chosen === option.id;
            const isRight = verdict?.correctOptionId === option.id;
            const showRight = Boolean(verdict) && isRight;
            const showWrong = Boolean(verdict) && isChosen && !verdict?.isCorrect;

            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => submitAnswer(option.id)}
                  disabled={Boolean(verdict) || pending}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors',
                    'min-h-[56px]',
                    showRight
                      ? 'border-success bg-success-soft'
                      : showWrong
                        ? 'border-danger bg-danger-soft'
                        : isChosen
                          ? 'border-brand bg-brand-soft'
                          : 'border-border bg-surface hover:bg-surface-2',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold',
                      showRight
                        ? 'border-success bg-success text-white'
                        : showWrong
                          ? 'border-danger bg-danger text-white'
                          : 'border-border-strong text-subtle',
                    )}
                  >
                    {showRight ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : showWrong ? (
                      <X className="size-4" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + optionIndex)
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{option.body}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {verdict && (
          <div
            className={cn(
              'mt-5 rounded-lg p-4',
              verdict.isCorrect ? 'bg-success-soft' : 'bg-warning-soft',
            )}
          >
            <p
              className={cn(
                'text-sm font-semibold',
                verdict.isCorrect ? 'text-success' : 'text-warning',
              )}
            >
              {verdict.isCorrect ? 'Certa.' : 'Não é essa.'}
            </p>
            {verdict.explanation && (
              <p className="text-text/80 mt-1.5 text-sm leading-relaxed">{verdict.explanation}</p>
            )}
          </div>
        )}

        {/* Trilha de posição: mostra onde está sem virar um menu de navegação
            que convida a pular questão. */}
        <ol className="mt-6 flex flex-wrap gap-1.5" aria-label="Progresso nas questões">
          {questions.map((q, i) => (
            <li
              key={q.question_id}
              aria-current={i === index ? 'step' : undefined}
              className={cn(
                'grid size-7 place-items-center rounded-md text-xs font-semibold tabular-nums',
                i === index
                  ? 'bg-brand text-brand-fg'
                  : q.question_id in answered
                    ? 'bg-surface-2 text-muted'
                    : 'border-border text-subtle border',
              )}
            >
              {i + 1}
            </li>
          ))}
        </ol>
      </div>

      {/* No simulado a resposta já avança sozinha, então o rodapé serve para
          pular sem responder. No quiz ele é o "continuar" depois de ler a
          explicação — e por isso só aparece quando há explicação para ler. */}
      <div className="pb-safe border-border bg-bg/90 fixed inset-x-0 bottom-0 z-40 border-t px-5 py-3 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl">
          {isQuiz ? (
            <Button size="lg" className="w-full" onClick={advance} disabled={!verdict || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {index + 1 === total ? 'Ver resultado' : 'Continuar'}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={advance}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {index + 1 === total ? 'Entregar simulado' : 'Pular esta questão'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
