'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Target } from 'lucide-react';
import { startErrorPractice } from '../server/practice-actions';

/**
 * "Refazer meus erros": transforma as questões de vestibular que o aluno ainda
 * erra (resposta mais recente errada) numa sessão de treino de 10 questões.
 * Mora em Erros e revisões, ao lado da fila de revisão.
 */
export function RedoErrors() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function redo() {
    setMessage(null);
    startTransition(async () => {
      const result = await startErrorPractice({ subjectId: null, questionCount: 10 });
      if (result.status === 'error') {
        setMessage(result.message);
        return;
      }
      router.push(`/vestibular/questoes/sessao/${result.sessionId}`);
    });
  }

  return (
    <section className="border-brand/30 bg-brand-soft flex flex-wrap items-center gap-4 rounded-2xl border p-4">
      <span aria-hidden className="bg-brand text-brand-fg grid size-11 shrink-0 place-items-center rounded-2xl">
        <Target className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-brand-text text-sm font-semibold">Refazer meus erros</p>
        <p className="text-muted text-xs leading-snug">Monta um treino de até 10 questões de vestibular que você ainda erra.</p>
        {message && (
          <p role="alert" className="text-danger mt-1 text-xs">
            {message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={redo}
        disabled={pending}
        className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Refazer agora
      </button>
    </section>
  );
}
