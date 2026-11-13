'use client';

import { useActionState, useState } from 'react';
import { Loader2, School, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createGrande2, publishGrande2 } from '../server/grande2-actions';
import { createGrande3, publishGrande3 } from '../server/grande3-actions';
import { createPb4, publishPb4 } from '../server/pb4-actions';
import type { StudySeedState } from '../server/study-seed-actions';

const INITIAL: StudySeedState = { status: 'idle' };

/**
 * "Conteúdo da escola": o admin geral escolhe uma escola e carrega ali os conteúdos (Grande criação 2 e 3 e
 * Português do 4º bimestre). Cada botão é separado, para não estourar o tempo do servidor numa carga só.
 * O que entra aqui aparece só na biblioteca daquela escola.
 */
export function EscolaContentCard({ schools }: { schools: { id: string; name: string }[] }) {
  const [schoolId, setSchoolId] = useState('');
  const [g2, runG2, busyG2] = useActionState(
    async (_p: StudySeedState, fd: FormData) => createGrande2(fd),
    INITIAL,
  );
  const [g3, runG3, busyG3] = useActionState(
    async (_p: StudySeedState, fd: FormData) => createGrande3(fd),
    INITIAL,
  );
  const [pb4, runPb4, busyPb4] = useActionState(
    async (_p: StudySeedState, fd: FormData) => createPb4(fd),
    INITIAL,
  );
  const [pub, runPub, busyPub] = useActionState(
    async (_p: StudySeedState, fd: FormData) => publishPb4(fd),
    INITIAL,
  );
  const [pubG2, runPubG2, busyPubG2] = useActionState(
    async (_p: StudySeedState, fd: FormData) => publishGrande2(fd),
    INITIAL,
  );
  const [pubG3, runPubG3, busyPubG3] = useActionState(
    async (_p: StudySeedState, fd: FormData) => publishGrande3(fd),
    INITIAL,
  );
  const busy = busyG2 || busyG3 || busyPb4 || busyPub || busyPubG2 || busyPubG3;
  const sem = !schoolId;

  return (
    <section className="border-brand/40 bg-surface rounded-2xl border-2 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <School className="text-brand size-5" aria-hidden /> Conteúdo da escola
      </h2>
      <p className="text-muted mt-1 text-sm">
        Escolha a escola e carregue ali os conteúdos. Eles aparecem só na biblioteca dessa escola,
        não na biblioteca geral do Nexa.
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

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { run: runG2, busy: busyG2, label: 'Carregar Grande criação 2 na escola' },
          { run: runG3, busy: busyG3, label: 'Carregar Grande criação 3 na escola' },
          { run: runPb4, busy: busyPb4, label: 'Carregar Português 4º bim. na escola' },
        ].map((b) => (
          <form key={b.label} action={b.run}>
            <input type="hidden" name="schoolId" value={schoolId} />
            <Button type="submit" disabled={busy || sem}>
              {b.busy ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}{' '}
              {b.label}
            </Button>
          </form>
        ))}
        {[
          { run: runPubG2, label: 'Publicar Grande criação 2 desta escola' },
          { run: runPubG3, label: 'Publicar Grande criação 3 desta escola' },
          { run: runPub, label: 'Publicar Português 4º bim. desta escola' },
        ].map((b) => (
          <form key={b.label} action={b.run}>
            <input type="hidden" name="schoolId" value={schoolId} />
            <Button type="submit" variant="secondary" disabled={busy || sem}>
              {b.label}
            </Button>
          </form>
        ))}
      </div>

      {[g2, g3, pb4, pub, pubG2, pubG3].map((s, i) =>
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
