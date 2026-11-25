'use client';

import { useActionState } from 'react';
import { BookCheck, Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStudyStarter, loadVestibularSimulados, publishStudyStarter, publishVestibularSimulados, type StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/** Conteúdo inicial do Nexa Study: carrega os tópicos e pacotes como rascunho e, depois da revisão, publica. */
export function StudySeedCard({ drafts, published, topics, packages, vestDrafts = 0, vestPublished = 0 }: { drafts: number; published: number; topics: number; packages: number; vestDrafts?: number; vestPublished?: number }) {
  const [loadState, load, loading] = useActionState(async () => loadStudyStarter(), INITIAL);
  const [publishState, publish, publishing] = useActionState(async () => publishStudyStarter(), INITIAL);
  const [vLoadState, vLoad, vLoading] = useActionState(async () => loadVestibularSimulados(), INITIAL);
  const [vPublishState, vPublish, vPublishing] = useActionState(async () => publishVestibularSimulados(), INITIAL);

  return (
    <section className="border-border bg-surface rounded-2xl border p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <BookCheck className="text-brand size-5" aria-hidden /> Conteúdo inicial do Nexa Study
      </h2>
      <p className="text-muted mt-1 text-sm">
        {topics} tópicos do 6º ano ao 3º ano do EM (Matemática, Ciências, Biologia, Física, Química, Português, História e Geografia) e {packages} pacotes prontos (resumo + quiz de 8 questões).
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

      <div className="border-border mt-5 border-t pt-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <BookCheck className="text-brand size-4" aria-hidden /> Simulados de vestibular
        </h3>
        <p className="text-muted mt-1 text-sm">
          8 simulados de 10 questões no estilo ENEM (4 áreas), Fuvest (2), Unicamp e Unesp, com explicação em cada questão. Entram como <b>rascunho</b>.
        </p>
        <p className="text-subtle mt-1 text-xs">Já no painel: {vestDrafts} rascunhos e {vestPublished} publicados.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={vLoad}>
            <Button type="submit" disabled={vLoading || vPublishing}>
              {vLoading ? <Loader2 className="animate-spin" aria-hidden /> : <BookCheck aria-hidden />} Carregar simulados de vestibular
            </Button>
          </form>
          <form action={vPublish}>
            <Button type="submit" variant="secondary" disabled={vLoading || vPublishing || vestDrafts === 0}>
              {vPublishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />} Publicar simulados
            </Button>
          </form>
        </div>
      </div>

      {[loadState, publishState, vLoadState, vPublishState].map((s, i) =>
        s.status === 'idle' ? null : (
          <p key={i} role={s.status === 'error' ? 'alert' : 'status'} className={s.status === 'error' ? 'text-danger mt-3 text-sm' : 'text-success mt-3 text-sm'}>
            {s.message}
          </p>
        ),
      )}
    </section>
  );
}
