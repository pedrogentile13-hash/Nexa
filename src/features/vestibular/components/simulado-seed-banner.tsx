'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadAndPublishVestibularSimulados } from '@/features/admin/server/study-seed-actions';

/** Só para administrador: mostra por que não há simulados na Biblioteca e carrega + publica com um toque. */
export function SimuladoSeedBanner({ published, drafts, expected }: { published: number; drafts: number; expected: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="border-warning/40 bg-warning-soft rounded-2xl border p-4 text-sm">
      <p className="font-semibold">Aviso para o administrador (o aluno não vê isto)</p>
      <p className="text-muted mt-1">
        Simulados do Nexa publicados: <b>{published}</b> de {expected}.{drafts > 0 ? ` Há ${drafts} em rascunho.` : ''} Toque abaixo para carregar e publicar os que faltam.
      </p>
      <Button
        type="button"
        className="mt-3"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await loadAndPublishVestibularSimulados();
            setMessage(r.status === 'idle' ? null : r.message);
            if (r.status === 'done') router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />} Carregar e publicar simulados
      </Button>
      {message && (
        <p role="status" className="mt-2">
          {message}
        </p>
      )}
    </div>
  );
}
