'use client';

import { useActionState } from 'react';
import { Loader2, PenLine, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadMixedPackages, publishMixedPackages } from '../server/mixed-seed-actions';
import type { StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/** Pacotes mistos (objetivas + discursivas com correção por IA): carrega como rascunho e, depois da revisão, publica. */
export function MixedSeedCard({
  drafts,
  published,
  packages,
  questions,
  discursive,
}: {
  drafts: number;
  published: number;
  packages: number;
  questions: number;
  discursive: number;
}) {
  const [loadState, load, loading] = useActionState(async () => loadMixedPackages(), INITIAL);
  const [publishState, publish, publishing] = useActionState(
    async () => publishMixedPackages(),
    INITIAL,
  );

  return (
    <section className="border-border bg-surface rounded-2xl border p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <PenLine className="text-brand size-5" aria-hidden /> Simulados e quizzes mistos (objetivas
        + discursivas)
      </h2>
      <p className="text-muted mt-1 text-sm">
        {packages} pacotes e {questions} questões ({discursive} discursivas, corrigidas por IA):
        Matemática, Física, Química, Biologia, História, Geografia e Português no Nexa Study, mais
        simulados de 2ª fase da Fuvest, Unicamp e Unesp. O ENEM continua só com simulados objetivos.
        Tudo entra como <b>rascunho</b>: revise e depois publique.
      </p>
      <p className="text-subtle mt-2 text-xs">
        Já no painel: {drafts} rascunhos e {published} publicados. Exige o SQL das discursivas
        (migration 20261111000200) rodado no Supabase.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={load}>
          <Button type="submit" disabled={loading || publishing}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <PenLine aria-hidden />}{' '}
            Carregar pacotes mistos
          </Button>
        </form>
        <form action={publish}>
          <Button
            type="submit"
            variant="secondary"
            disabled={loading || publishing || drafts === 0}
          >
            {publishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}{' '}
            Publicar pacotes mistos
          </Button>
        </form>
      </div>
      {[loadState, publishState].map((s, i) =>
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
