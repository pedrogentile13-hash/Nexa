'use client';

import { useActionState } from 'react';
import { Loader2, Rocket, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createGrande3, publishGrande3 } from '../server/grande3-actions';
import type { StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/** "Grande criação 3": resumos, trilhas e planos de estudo do vestibular. Um clique cria (rascunho), outro publica. */
export function Grande3Card({
  drafts,
  published,
  resumos,
  vestibular,
  planos,
  trilhas,
  tracksPublished,
}: {
  drafts: number;
  published: number;
  resumos: number;
  vestibular: number;
  planos: number;
  trilhas: number;
  tracksPublished: number;
}) {
  const [createState, create, creating] = useActionState(async () => createGrande3(), INITIAL);
  const [publishState, publish, publishing] = useActionState(async () => publishGrande3(), INITIAL);
  const busy = creating || publishing;

  return (
    <section className="border-brand/40 bg-surface rounded-2xl border-2 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Route className="text-brand size-5" aria-hidden /> Grande criação 3: resumos, trilhas e
        planos
      </h2>
      <p className="text-muted mt-1 text-sm">
        <b>{resumos} resumos</b> (do 6º ano ao 3º EM e {vestibular} na Biblioteca do Vestibular, com{' '}
        {planos} planos de estudo) e <b>{trilhas} trilhas</b> que juntam resumo, quiz e simulado em
        etapas. As trilhas usam os quizzes e simulados da Grande criação 2: crie a 2 antes (ou
        clique aqui de novo depois para completar).
      </p>
      <p className="text-subtle mt-2 text-xs">
        Já no painel: {drafts} resumos em rascunho, {published} publicados e {tracksPublished}{' '}
        trilhas publicadas. Tudo entra como rascunho; clicar de novo não duplica.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={create}>
          <Button type="submit" disabled={busy}>
            {creating ? <Loader2 className="animate-spin" aria-hidden /> : <Route aria-hidden />}{' '}
            {creating ? 'Criando… (pode levar 1 minuto)' : 'Criar Grande criação 3'}
          </Button>
        </form>
        <form action={publish}>
          <Button type="submit" variant="secondary" disabled={busy}>
            {publishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}{' '}
            Publicar Grande criação 3
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
