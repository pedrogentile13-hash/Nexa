'use client';

import { useActionState, useState } from 'react';
import { Loader2, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPb4 } from '../server/pb4-actions';
import { publicarImagensApoio } from '../server/imagens-actions';
import type { StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/**
 * "Conteúdo da escola": escolhe a escola e publica nela a trilha de Português do 4º bimestre.
 * Resumos ficam públicos para todas as escolas; simulados e trilha ficam só na escola escolhida.
 * (Os resumos e quizzes da Grande criação 2 e 3 já são públicos pela biblioteca geral: não se copiam por escola.)
 */
export function EscolaContentCard({ schools }: { schools: { id: string; name: string }[] }) {
  const [schoolId, setSchoolId] = useState('');
  const [state, run, busy] = useActionState(
    async (_p: StudySeedState, fd: FormData) => createPb4(fd),
    INITIAL,
  );

  const [img, runImg, busyImg] = useActionState(async () => publicarImagensApoio(), INITIAL);

  return (
    <section className="border-brand/40 bg-surface rounded-2xl border-2 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <School className="text-brand size-5" aria-hidden /> Conteúdo da escola
      </h2>
      <p className="text-muted mt-1 text-sm">
        Português do 4º bimestre (9º ano C, Anglo Morumbi): os resumos ficam públicos para todas as
        escolas; os simulados e a trilha PB4 ficam só na escola escolhida.
      </p>
      <label className="mt-3 block text-sm">
        <span className="text-muted mb-1 block text-xs">Escola</span>
        <select
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="border-border bg-surface-2 w-full rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Escolha uma escola…</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <form action={run} className="mt-3">
        <input type="hidden" name="schoolId" value={schoolId} />
        <Button type="submit" disabled={busy || !schoolId}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : null} Publicar Português 4º
          bim. nesta escola
        </Button>
      </form>
      <div className="border-border mt-5 border-t pt-4">
        <p className="text-muted text-sm">
          Imagens de apoio (mapa mental de modos verbais e espinha de peixe de genética): publicadas
          para todas as escolas, uma vez só. Não ocupam o banco, porque os arquivos ficam no site.
        </p>
        <form action={runImg} className="mt-2">
          <Button type="submit" variant="secondary" disabled={busyImg}>
            {busyImg ? <Loader2 className="animate-spin" aria-hidden /> : null} Publicar imagens de
            apoio para todas
          </Button>
        </form>
        {img.status !== 'idle' && (
          <p
            role={img.status === 'error' ? 'alert' : 'status'}
            className={
              img.status === 'error' ? 'text-danger mt-2 text-sm' : 'text-success mt-2 text-sm'
            }
          >
            {img.message}
          </p>
        )}
      </div>

      {state.status !== 'idle' && (
        <p
          role={state.status === 'error' ? 'alert' : 'status'}
          className={
            state.status === 'error' ? 'text-danger mt-3 text-sm' : 'text-success mt-3 text-sm'
          }
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
