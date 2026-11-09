'use client';

import { useActionState } from 'react';
import { BookCheck, Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStudyStarter, publishStudyStarter, type StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/** Conteúdo inicial do Nexa Study: carrega os tópicos e pacotes como rascunho e, depois da revisão, publica. */
export function StudySeedCard({ drafts, published, topics, packages }: { drafts: number; published: number; topics: number; packages: number }) {
  const [loadState, load, loading] = useActionState(async () => loadStudyStarter(), INITIAL);
  const [publishState, publish, publishing] = useActionState(async () => publishStudyStarter(), INITIAL);

  return (
    <section className="border-border bg-surface rounded-2xl border p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <BookCheck className="text-brand size-5" aria-hidden /> Conteúdo inicial do Nexa Study
      </h2>
      <p className="text-muted mt-1 text-sm">
        {topics} tópicos do 6º ano ao 3º ano do EM (Matemática, Ciências, Biologia, Física e Química) e {packages} pacotes prontos (resumo + quiz de 8 questões).
        Tudo entra como <b>rascunho</b>: revise e depois publique.
      </p>
      <p className="text-subtle mt-2 text-xs">Já no painel: {drafts} rascunhos e {published} publicados do pacote inicial.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={load}>
          <Button type="submit" disabled={loading || publishing}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <BookCheck aria-hidden />} Carregar tópicos e pacotes
          </Button>
        </form>
        <form action={publish}>
          <Button type="submit" variant="secondary" disabled={loading || publishing || drafts === 0}>
            {publishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />} Publicar pacote inicial
          </Button>
        </form>
      </div>

      {[loadState, publishState].map((s, i) =>
        s.status === 'idle' ? null : (
          <p key={i} role={s.status === 'error' ? 'alert' : 'status'} className={s.status === 'error' ? 'text-danger mt-3 text-sm' : 'text-success mt-3 text-sm'}>
            {s.message}
          </p>
        ),
      )}
    </section>
  );
}
