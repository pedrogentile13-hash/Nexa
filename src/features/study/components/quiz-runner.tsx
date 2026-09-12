'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronRight,
  CircleHelp,
  Clock,
  Flag,
  Grid3x3,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { StudyTopBar } from './study-top-bar';
import { QuestionAssets } from './question-assets';
import { WritingTaskRunner } from './writing-task-runner';
import { clockTime, humanDuration } from '../lib/format';
import {
  answerQuestion,
  finishAttempt,
  getAttemptState,
  getEssayDrafts,
  startAttempt,
  toggleQuestionFlag,
  type EssayDraft,
} from '../server/actions';
import type { ResourceDetail, StudyWritingTask } from '../server/queries';
import type { QuizQuestion } from './resource-viewer';

/**
 * Execução de quiz e simulado — agora também seções por matéria, textos-base
 * e recursos por questão, navegador com marcação, retomada de tentativa e
 * redação.
 *
 * São produtos diferentes na mesma máquina:
 *   • QUIZ — feedback na hora, com a explicação. Serve para aprender.
 *   • SIMULADO — cronômetro, sem feedback, revisão só no fim. Serve para medir.
 *
 * Misturar os dois destruiria os dois: um simulado que corrige na hora vira
 * quiz longo, e um quiz que só corrige no fim perde a razão de existir.
 * `resource.examMode` pode sobrescrever isso explicitamente (JSON v2); sem
 * ele, deriva de `kind` — comportamento idêntico ao de sempre.
 *
 * Nenhuma resposta é conferida aqui. `answerQuestion` chama a função do banco,
 * que corrige e devolve o veredito — o gabarito nunca chega a este componente.
 */

type Phase = 'intro' | 'running' | 'writing' | 'done';

export function QuizRunner({
  resource,
  questions,
  writingTasks,
}: {
  resource: ResourceDetail;
  questions: QuizQuestion[];
  writingTasks: StudyWritingTask[];
}) {
  const router = useRouter();
  const examMode = resource.examMode ?? (resource.kind === 'quiz' ? 'practice' : 'exam');
  const isQuiz = examMode === 'practice';

  // Seções por matéria (v2) reordenam a lista; sem seção, a ordem é a mesma
  // de cadastro de sempre. Questões que nenhuma seção referencia (ou quando
  // não há seções) ficam no fim, na ordem original — nada some.
  const orderedQuestions = orderBySections(questions, resource.sections);

  const [phase, setPhase] = useState<Phase>('intro');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [writingIndex, setWritingIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{
    isCorrect: boolean;
    correctOptionId: string | null;
    explanation: string | null;
  } | null>(null);
  const [answeredMap, setAnsweredMap] = useState<Record<string, string | null>>({});
  const [flaggedMap, setFlaggedMap] = useState<Record<string, boolean>>({});
  const [essayDrafts, setEssayDrafts] = useState<EssayDraft[]>([]);
  const [showNavigator, setShowNavigator] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [summary, setSummary] = useState<{
    correctCount: number;
    totalCount: number;
    durationSeconds: number;
    xpAwarded: number;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const question = orderedQuestions[index];
  const total = orderedQuestions.length;

  // Tempo por questão: acumula em segundo plano, some junto da resposta.
  const timeAccumRef = useRef<Record<string, number>>({});
  const enteredAtRef = useRef<number>(Date.now());
  useEffect(() => {
    enteredAtRef.current = Date.now();
  }, [index]);
  function flushTime(questionId: string | undefined) {
    if (!questionId) return;
    const spent = (Date.now() - enteredAtRef.current) / 1000;
    timeAccumRef.current[questionId] = (timeAccumRef.current[questionId] ?? 0) + spent;
    enteredAtRef.current = Date.now();
  }

  // Cronômetro só do simulado. No quiz ele viraria pressão sem propósito —
  // e pressão é exatamente o que atrapalha quem está tentando entender.
  useEffect(() => {
    if ((phase !== 'running' && phase !== 'writing') || isQuiz) return;
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
      const [state, drafts] = await Promise.all([
        getAttemptState(result.attemptId),
        writingTasks.length > 0 ? getEssayDrafts(result.attemptId) : Promise.resolve([]),
      ]);

      const answered: Record<string, string | null> = {};
      const flagged: Record<string, boolean> = {};
      for (const row of state) {
        answered[row.questionId] = row.optionId;
        flagged[row.questionId] = row.flagged;
      }

      setAttemptId(result.attemptId);
      setAnsweredMap(answered);
      setFlaggedMap(flagged);
      setEssayDrafts(drafts);

      // Retoma na primeira questão sem resposta — quem já respondeu tudo cai
      // na última, pronto para revisar/finalizar.
      const firstUnanswered = orderedQuestions.findIndex((q) => !(q.question_id in answered));
      setIndex(total === 0 ? 0 : firstUnanswered === -1 ? total - 1 : firstUnanswered);
      setPhase(total > 0 ? 'running' : 'writing');
    });
  }

  function submitAnswer(optionId: string) {
    if (!attemptId || !question) return;
    if (chosen === optionId) return;
    if (isQuiz && chosen) return;
    setChosen(optionId);

    const spent = timeAccumRef.current[question.question_id] ?? 0;
    timeAccumRef.current[question.question_id] = 0;
    const enteredNow = (Date.now() - enteredAtRef.current) / 1000;

    startTransition(async () => {
      const result = await answerQuestion(attemptId, question.question_id, optionId, spent + enteredNow);
      enteredAtRef.current = Date.now();
      setAnsweredMap((current) => ({ ...current, [question.question_id]: optionId }));
      if (result) {
        if (isQuiz) setVerdict(result);
      }
    });
  }

  function toggleFlag() {
    if (!attemptId || !question) return;
    const questionId = question.question_id;
    setFlaggedMap((current) => ({ ...current, [questionId]: !current[questionId] }));
    startTransition(async () => {
      const next = await toggleQuestionFlag(attemptId, questionId);
      if (next !== null) setFlaggedMap((current) => ({ ...current, [questionId]: next }));
    });
  }

  function goTo(nextIndex: number) {
    flushTime(question?.question_id);
    setVerdict(null);
    setChosen(null);
    setIndex(nextIndex);
    setShowNavigator(false);
  }

  function advance() {
    if (index + 1 < total) {
      goTo(index + 1);
      return;
    }
    tryFinishOrWrite();
  }

  function goBack() {
    if (index > 0) goTo(index - 1);
  }

  const unansweredCount = orderedQuestions.filter((q) => !(q.question_id in answeredMap)).length;
  const flaggedCount = orderedQuestions.filter((q) => flaggedMap[q.question_id]).length;

  function tryFinishOrWrite() {
    if (unansweredCount > 0 || flaggedCount > 0) {
      setConfirmFinish(true);
      return;
    }
    proceedPastQuestions();
  }

  function proceedPastQuestions() {
    setConfirmFinish(false);
    flushTime(question?.question_id);
    if (writingTasks.length > 0) {
      setPhase('writing');
      setWritingIndex(0);
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

  function onWritingDone() {
    if (writingIndex + 1 < writingTasks.length) {
      setWritingIndex((i) => i + 1);
      return;
    }
    finish();
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
              {total > 0 && (
                <div>
                  <dt className="sr-only">Questões</dt>
                  <dd className="tabular-nums">
                    <strong className="text-text font-semibold">{total}</strong>{' '}
                    {total === 1 ? 'questão' : 'questões'}
                  </dd>
                </div>
              )}
              {writingTasks.length > 0 && (
                <div>
                  <dt className="sr-only">Redação</dt>
                  <dd className="tabular-nums">
                    +{writingTasks.length} {writingTasks.length === 1 ? 'redação' : 'redações'}
                  </dd>
                </div>
              )}
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
              disabled={pending || (total === 0 && writingTasks.length === 0)}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {total === 0 && writingTasks.length === 0
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
            {summary.totalCount > 0 ? (
              <>
                <p className="text-5xl leading-none font-semibold tabular-nums">
                  {summary.correctCount}
                  <span className="text-muted text-2xl">/{summary.totalCount}</span>
                </p>
                <p className="text-muted mt-2 text-sm">
                  {Math.round(percent)}% de acerto
                  {summary.durationSeconds > 0 && ` · ${humanDuration(summary.durationSeconds)}`}
                </p>
              </>
            ) : (
              <p className="text-muted text-sm">Redação entregue.</p>
            )}

            {summary.xpAwarded > 0 && (
              <p className="bg-brand-soft text-brand-text mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold">
                <Sparkles className="size-4" aria-hidden />+{summary.xpAwarded} XP
              </p>
            )}

            {summary.totalCount > 0 && (
              <p className="text-muted mx-auto mt-4 max-w-sm text-sm leading-relaxed">
                {percent >= 80
                  ? 'Domínio bom deste assunto. Vale partir para o próximo.'
                  : percent >= 50
                    ? 'A base está de pé. Revisar o que errou fecha a diferença rápido.'
                    : 'Este assunto ainda não está firme — e agora você sabe exatamente onde.'}
              </p>
            )}
            {writingTasks.length > 0 && (
              <p className="text-subtle mt-3 text-xs">
                A redação é corrigida pelo professor — a nota aparece aqui depois.
              </p>
            )}
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

  // ---------------------------------------------------------- redação --
  if (phase === 'writing') {
    const task = writingTasks[writingIndex];
    if (!task || !attemptId) {
      return (
        <div className="grid min-h-dvh place-items-center px-6">
          <Loader2 className="text-muted size-5 animate-spin" aria-hidden />
        </div>
      );
    }
    return (
      <div style={subjectColorVars(resource.subjectColor)}>
        <StudyTopBar
          title={`Redação ${writingIndex + 1} de ${writingTasks.length}`}
          subtitle={resource.subjectName}
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
        <WritingTaskRunner
          attemptId={attemptId}
          task={task}
          draft={essayDrafts.find((d) => d.writingTaskId === task.id)}
          assets={resource.assets}
          onDone={onWritingDone}
        />
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

  const currentSection = resource.sections.find((s) => s.questionIds?.includes(question.question_id));
  const previousQuestion = orderedQuestions[index - 1];
  const previousSection = previousQuestion
    ? resource.sections.find((s) => s.questionIds?.includes(previousQuestion.question_id))
    : undefined;
  const showSectionDivider = currentSection && currentSection.id !== previousSection?.id;

  const isFlagged = Boolean(flaggedMap[question.question_id]);
  const correctSoFar = orderedQuestions.filter((q) => {
    const opt = answeredMap[q.question_id];
    return opt && q.options.some((o) => o.id === opt) && q.question_id in answeredMap && isQuiz;
  }).length;

  // ------------------------------------------------------------ rodando --
  return (
    <div style={subjectColorVars(resource.subjectColor)} className="pb-28">
      <StudyTopBar
        title={`Questão ${index + 1} de ${total}`}
        subtitle={question.topic_name ?? resource.subjectName}
        right={
          <div className="flex items-center gap-2">
            {remaining !== null && (
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums',
                  remaining < 60 ? 'bg-danger-soft text-danger' : 'bg-surface-2 text-muted',
                )}
              >
                <Clock className="size-4" aria-hidden />
                {clockTime(remaining)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowNavigator(true)}
              aria-label="Ver todas as questões"
              className="text-muted hover:bg-surface-2 grid size-9 shrink-0 place-items-center rounded-full"
            >
              <Grid3x3 className="size-4" aria-hidden />
            </button>
          </div>
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

      <div className="mx-auto max-w-[1100px] px-5 pt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      <div className="min-w-0">
        {showSectionDivider && currentSection && (
          <div className="border-border bg-surface-2/60 mb-4 rounded-lg border px-3 py-2">
            <p className="text-subtle text-xs font-semibold tracking-wide uppercase">
              {currentSection.title}
            </p>
            {currentSection.subject && currentSection.subject !== resource.subjectName && (
              <p className="text-muted text-xs">{currentSection.subject}</p>
            )}
          </div>
        )}

        <QuestionAssets refs={question.resource_refs} assets={resource.assets} />

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg leading-snug font-semibold">{question.statement}</h1>
          <button
            type="button"
            onClick={toggleFlag}
            aria-pressed={isFlagged}
            aria-label={isFlagged ? 'Desmarcar revisão' : 'Marcar para revisar'}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full',
              isFlagged ? 'bg-warning-soft text-warning' : 'text-subtle hover:bg-surface-2',
            )}
          >
            <Flag className={cn('size-4', isFlagged && 'fill-current')} aria-hidden />
          </button>
        </div>

        <ul className="mt-5 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const isChosen = chosen === option.id || (!chosen && answeredMap[question.question_id] === option.id);
            const isRight = verdict?.correctOptionId === option.id;
            const showRight = Boolean(verdict) && isRight;
            const showWrong = Boolean(verdict) && isChosen && !verdict?.isCorrect;

            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => submitAnswer(option.id)}
                  disabled={isQuiz && Boolean(chosen)}
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
      </div>

      {/* Sidebar: só desktop. No simulado não mostra corretas/incorretas —
          revelar isso durante a prova quebraria a proposta de "sem feedback
          até o fim" que o simulado tem por definição. */}
      <aside className="mt-6 hidden min-w-0 space-y-4 lg:mt-0 lg:block">
        <div className="border-border bg-surface rounded-2xl border p-4">
          <h2 className="text-sm font-semibold">Seu progresso</h2>
          {isQuiz ? (
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted flex items-center gap-1.5">
                  <span aria-hidden className="bg-success size-2 rounded-full" />
                  Corretas
                </dt>
                <dd className="tabular font-semibold">{correctSoFar}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted flex items-center gap-1.5">
                  <span aria-hidden className="border-border-strong size-2 rounded-full border" />
                  Restantes
                </dt>
                <dd className="tabular font-semibold">{unansweredCount}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted mt-2 text-sm">
              <span className="text-text tabular font-semibold">{total - unansweredCount}</span> de{' '}
              {total} questões respondidas
              {flaggedCount > 0 && (
                <span className="text-warning block">
                  {flaggedCount} marcada{flaggedCount === 1 ? '' : 's'} para revisão
                </span>
              )}
            </p>
          )}
        </div>

        <QuestionNavigatorGrid
          questions={orderedQuestions}
          currentId={question.question_id}
          answered={answeredMap}
          flagged={flaggedMap}
          onSelect={(i) => goTo(i)}
        />
      </aside>
      </div>

      {/* O avanço nunca fica preso a uma resposta de servidor: depende só de
          `chosen`/`answeredMap` (estado local, sempre confiável). */}
      <div className="pb-safe border-border bg-bg/90 fixed inset-x-0 bottom-[calc(4.25rem_+_env(safe-area-inset-bottom))] z-40 border-t px-5 py-3 backdrop-blur-lg md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {index > 0 && (
            <Button size="lg" variant="secondary" onClick={goBack} className="shrink-0">
              Anterior
            </Button>
          )}
          {isQuiz ? (
            <Button size="lg" className="flex-1" onClick={advance} disabled={!chosen && !answeredMap[question.question_id]}>
              {index + 1 === total ? 'Ver resultado' : 'Continuar'}
            </Button>
          ) : (
            <Button
              size="lg"
              variant={answeredMap[question.question_id] ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={advance}
            >
              {index + 1 === total
                ? 'Finalizar'
                : answeredMap[question.question_id]
                  ? 'Avançar'
                  : 'Pular esta questão'}
            </Button>
          )}
        </div>
      </div>

      {/* Navegador de questões — mobile abre em painel; desktop já tem a
          grade fixa na sidebar, mas o botão continua funcionando igual. */}
      <Dialog open={showNavigator} onClose={() => setShowNavigator(false)} title="Questões">
        <QuestionNavigatorGrid
          questions={orderedQuestions}
          currentId={question.question_id}
          answered={answeredMap}
          flagged={flaggedMap}
          onSelect={(i) => goTo(i)}
        />
      </Dialog>

      <Dialog open={confirmFinish} onClose={() => setConfirmFinish(false)} title="Finalizar?">
        <div className="space-y-3 text-sm">
          {unansweredCount > 0 && (
            <p className="text-muted">
              Você ainda tem <strong className="text-text">{unansweredCount}</strong>{' '}
              {unansweredCount === 1 ? 'questão sem resposta' : 'questões sem resposta'}.
            </p>
          )}
          {flaggedCount > 0 && (
            <p className="text-muted">
              Você possui <strong className="text-text">{flaggedCount}</strong>{' '}
              {flaggedCount === 1 ? 'questão marcada' : 'questões marcadas'} para revisão.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmFinish(false)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={proceedPastQuestions}>
              {writingTasks.length > 0 ? 'Ir para a redação' : 'Finalizar mesmo assim'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/** Reordena pela ordem das seções; questões fora de qualquer seção vão pro fim, na ordem original. */
function orderBySections(questions: QuizQuestion[], sections: ResourceDetail['sections']): QuizQuestion[] {
  if (sections.length === 0) return questions;

  const byId = new Map(questions.map((q) => [q.question_id, q]));
  const used = new Set<string>();
  const ordered: QuizQuestion[] = [];

  for (const section of sections) {
    for (const id of section.questionIds ?? []) {
      const q = byId.get(id);
      if (q && !used.has(id)) {
        ordered.push(q);
        used.add(id);
      }
    }
  }
  for (const q of questions) {
    if (!used.has(q.question_id)) ordered.push(q);
  }
  return ordered;
}

function QuestionNavigatorGrid({
  questions,
  currentId,
  answered,
  flagged,
  onSelect,
}: {
  questions: QuizQuestion[];
  currentId: string;
  answered: Record<string, string | null>;
  flagged: Record<string, boolean>;
  onSelect: (index: number) => void;
}) {
  return (
    <div>
      <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5" aria-label="Navegador de questões">
        {questions.map((q, i) => {
          const isCurrent = q.question_id === currentId;
          const isAnswered = q.question_id in answered;
          const isFlagged = flagged[q.question_id];
          return (
            <li key={q.question_id}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'relative grid size-9 place-items-center rounded-md text-xs font-semibold tabular-nums',
                  isCurrent
                    ? 'bg-brand text-brand-fg'
                    : isAnswered
                      ? 'bg-surface-2 text-muted'
                      : 'border-border text-subtle border',
                )}
              >
                {i + 1}
                {isFlagged && (
                  <Flag className="text-warning absolute -top-1 -right-1 size-3 fill-current" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="text-subtle mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-surface-2 inline-block size-2.5 rounded-sm" /> Respondida
        </span>
        <span className="flex items-center gap-1.5">
          <span className="border-border inline-block size-2.5 rounded-sm border" /> Não respondida
        </span>
        <span className="flex items-center gap-1.5">
          <Flag className="text-warning size-3 fill-current" aria-hidden /> Marcada
        </span>
      </div>
    </div>
  );
}
