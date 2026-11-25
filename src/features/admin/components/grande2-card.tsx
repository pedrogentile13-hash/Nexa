'use client';

import { useActionState } from 'react';
import { Loader2, Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createGrande2, publishGrande2 } from '../server/grande2-actions';
import type { StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/** "Grande criação 2": um clique cria (como rascunho) o pacote grande de quizzes e simulados; outro publica. */
export function Grande2Card({
  drafts,
  published,
  quizzes,
  simulados,
  vestibular,
  questions,
  discursive,
  withDiscursive,
}: {
  drafts: number;
  published: number;
  quizzes: number;
  simulados: number;
  vestibular: number;
  questions: number;
  discursive: number;
  withDiscursive: number;
}) {
  const [createState, create, creating] = useActionState(async () => createGrande2(), INITIAL);
  const [publishState, publish, publishing] = useActionState(async () => publishGrande2(), INITIAL);
  const busy = creating || publishing;

  return (
    <section className="border-brand/40 bg-surface rounded-2xl border-2 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Sparkles className="text-brand size-5" aria-hidden /> Grande criação 2
      </h2>
      <p className="text-muted mt-1 text-sm">
        <b>{quizzes} quizzes</b> e <b>{simulados} simulados</b> do Nexa Study (6º ano ao 3º EM, 16
        matérias) e <b>{vestibular} simulados de vestibular</b> (ENEM, Fuvest, Unicamp, Unesp, ITA e
        IME). São {questions} questões, {discursive} discursivas corrigidas por IA, presentes em{' '}
        {withDiscursive} pacotes. As contas de Matemática e Exatas são calculadas pelo sistema.
      </p>
      <p className="text-subtle mt-2 text-xs">
        Já no painel: {drafts} rascunhos e {published} publicados. Tudo entra como rascunho; clicar
        de novo não duplica. Exige o SQL das discursivas (migration 20261111000200).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={create}>
          <Button type="submit" disabled={busy}>
            {creating ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}{' '}
            {creating ? 'Criando… (pode levar 1 minuto)' : 'Criar Grande criação 2'}
          </Button>
        </form>
        <form action={publish}>
          <Button type="submit" variant="secondary" disabled={busy || drafts === 0}>
            {publishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}{' '}
            Publicar Grande criação 2
          </Button>
        </form>
      </div>
      {[createState, publishState].map((s, i) =>
        s.status === 'idle' ? null : (
          <p
            key={i}
            role={s.status === 'error' ? 'alert' : 'status'}
            className={
              s.status === 'error' ? 'text-danger mt-3 text-sm' : 'text-success mt-3 text-sm'
            }
          >
            {s.message}
          </p>
        ),
      )}
    </section>
  );
}
