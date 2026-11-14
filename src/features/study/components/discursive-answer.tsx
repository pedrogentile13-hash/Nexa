'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { prettifyBareTex } from '../lib/bare-tex';
import { CheckCircle2, Loader2, PenLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COIN_COSTS } from '@/lib/ai/coins';
import {
  answerProblem,
  BAND_LABEL,
  formatScore,
  gradeBand,
  MAX_ANSWER_CHARS,
  PASS_RATIO,
} from '../lib/discursive';
import {
  gradeDiscursiveAnswer,
  saveDiscursiveAnswer,
  type DiscursiveGrade,
} from '../server/discursive-actions';

const AUTOSAVE_MS = 1200;

/** Cartão com a nota, a devolutiva e os pontos que a IA apontou. */
export function GradeCard({ grade }: { grade: DiscursiveGrade }) {
  const band = gradeBand(grade.score);
  const passed = grade.score >= PASS_RATIO;
  return (
    <div
      className={cn('rounded-lg p-4', passed ? 'bg-success-soft' : 'bg-warning-soft')}
      role="status"
    >
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={cn('text-sm font-semibold', passed ? 'text-success' : 'text-warning')}>
          {BAND_LABEL[band]}
        </span>
        <span className="text-lg font-semibold tabular-nums">{formatScore(grade.score)}</span>
      </p>
      <p className="text-text/80 mt-1.5 text-sm leading-relaxed whitespace-pre-line">
        {prettifyBareTex(grade.feedback)}
      </p>
      {((grade.hits?.length ?? 0) > 0 || (grade.missing?.length ?? 0) > 0) && (
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {(grade.hits?.length ?? 0) > 0 && (
            <div>
              <p className="text-success text-xs font-semibold tracking-wide uppercase">
                Você acertou
              </p>
              <ul className="text-muted mt-1 list-disc space-y-0.5 pl-4">
                {grade.hits!.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {(grade.missing?.length ?? 0) > 0 && (
            <div>
              <p className="text-warning text-xs font-semibold tracking-wide uppercase">Faltou</p>
              <ul className="text-muted mt-1 list-disc space-y-0.5 pl-4">
                {grade.missing!.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Resposta de uma questão discursiva durante o quiz/simulado.
 *
 *   · O texto é salvo sozinho (some o medo de perder). Nada é conferido aqui: a nota vem do servidor.
 *   · QUIZ — "Corrigir com IA" na hora, com a devolutiva (custa moedas; se a IA falha, voltam).
 *   · SIMULADO — só guarda: a correção é pedida no gabarito, depois de finalizar (como numa prova de verdade).
 */
export function DiscursiveAnswer({
  attemptId,
  questionId,
  immediate,
  initialText,
  initialGrade,
  getSpentSeconds,
  onSaved,
  onGraded,
}: {
  attemptId: string;
  questionId: string;
  /** true = quiz (corrige na hora); false = simulado (corrige depois). */
  immediate: boolean;
  initialText: string;
  initialGrade: DiscursiveGrade | null;
  getSpentSeconds: () => number;
  onSaved: (text: string) => void;
  onGraded: (grade: DiscursiveGrade) => void;
}) {
  const [text, setText] = useState(initialText);
  const [grade, setGrade] = useState<DiscursiveGrade | null>(initialGrade);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    initialText ? 'saved' : 'idle',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [grading, startGrade] = useTransition();
  const saved = useRef(initialText);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = grade !== null;
  const problem = answerProblem(text);

  async function persist(value: string): Promise<boolean> {
    const clean = value.trim();
    if (!clean) return false;
    if (clean === saved.current.trim()) return true;
    setStatus('saving');
    const r = await saveDiscursiveAnswer(attemptId, questionId, clean, getSpentSeconds());
    if (!r.ok) {
      setStatus('error');
      setMessage(r.message);
      return false;
    }
    saved.current = clean;
    setStatus('saved');
    setMessage(null);
    onSaved(clean);
    return true;
  }

  // Salva sozinho um instante depois de parar de digitar.
  useEffect(() => {
    if (locked || text.trim() === saved.current.trim() || !text.trim()) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(text), AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, locked]);

  function correct() {
    setMessage(null);
    startGrade(async () => {
      if (!(await persist(text))) return;
      const r = await gradeDiscursiveAnswer(attemptId, questionId);
      if (!r.ok) {
        setMessage(r.message);
        return;
      }
      setGrade(r.grade);
      onGraded(r.grade);
    });
  }

  return (
    <div className="mt-5 space-y-3">
      <label className="block">
        <span className="sr-only">Sua resposta</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_ANSWER_CHARS))}
          onBlur={() => void persist(text)}
          readOnly={locked}
          rows={8}
          placeholder="Escreva sua resposta com suas palavras. Explique o raciocínio, não só o resultado."
          className={cn(
            'border-border bg-surface focus-visible:ring-brand min-h-48 w-full resize-y rounded-lg border p-3.5 text-[0.9375rem] leading-relaxed outline-none focus-visible:ring-2',
            locked && 'bg-surface-2 text-muted',
          )}
        />
      </label>

      <div className="text-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          {status === 'saving' && (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Salvando…
            </>
          )}
          {status === 'saved' && (
            <>
              <CheckCircle2 className="text-success size-3.5" aria-hidden /> Resposta salva
            </>
          )}
          {status === 'idle' && (
            <>
              <PenLine className="size-3.5" aria-hidden /> Salva sozinha enquanto você escreve
            </>
          )}
        </span>
        <span className="tabular-nums">
          {text.trim().length}/{MAX_ANSWER_CHARS}
        </span>
      </div>

      {message && (
        <p role="alert" className="text-danger text-sm">
          {message}
        </p>
      )}

      {grade ? (
        <GradeCard grade={grade} />
      ) : immediate ? (
        <>
          <Button
            type="button"
            onClick={correct}
            disabled={grading || Boolean(problem)}
            className="w-full sm:w-auto"
          >
            {grading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {grading ? 'Corrigindo…' : `Corrigir com IA (${COIN_COSTS.discursive} moedas)`}
          </Button>
          {text.trim() && problem && <p className="text-muted text-xs">{problem}</p>}
        </>
      ) : (
        <p className="text-muted text-xs leading-relaxed">
          Você pede a correção por IA no gabarito, depois de finalizar o simulado (
          {COIN_COSTS.discursive} moedas por questão).
        </p>
      )}
    </div>
  );
}

/** No gabarito: a resposta do aluno, a correção (ou o botão para pedir) e a resposta esperada. */
export function DiscursiveReview({
  attemptId,
  questionId,
  answerText,
  grade,
  modelAnswer,
  onGraded,
}: {
  attemptId: string;
  questionId: string;
  answerText: string | null;
  grade: DiscursiveGrade | null;
  modelAnswer: string | null;
  onGraded: (grade: DiscursiveGrade) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canGrade = !grade && Boolean(answerText?.trim()) && !answerProblem(answerText ?? '');

  function ask() {
    setMessage(null);
    start(async () => {
      const r = await gradeDiscursiveAnswer(attemptId, questionId);
      if (!r.ok) return setMessage(r.message);
      onGraded(r.grade);
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <p className="text-subtle text-xs font-semibold tracking-wide uppercase">Sua resposta</p>
        {answerText?.trim() ? (
          <p className="bg-surface-2 text-muted mt-1 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {answerText}
          </p>
        ) : (
          <p className="text-muted mt-1 text-sm">Não respondida.</p>
        )}
      </div>

      {grade ? (
        <GradeCard grade={grade} />
      ) : canGrade ? (
        <div>
          <Button type="button" size="sm" onClick={ask} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {pending ? 'Corrigindo…' : `Corrigir com IA (${COIN_COSTS.discursive} moedas)`}
          </Button>
          {message && (
            <p role="alert" className="text-danger mt-2 text-sm">
              {message}
            </p>
          )}
        </div>
      ) : null}

      {modelAnswer && (
        <div>
          <p className="text-subtle text-xs font-semibold tracking-wide uppercase">
            Resposta esperada
          </p>
          <p className="text-muted mt-1 border-l-2 border-current/20 pl-3 text-sm leading-relaxed whitespace-pre-line">
            {prettifyBareTex(modelAnswer)}
          </p>
        </div>
      )}
    </div>
  );
}
