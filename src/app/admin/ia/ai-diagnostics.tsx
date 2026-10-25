'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, CircleSlash, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProviderDiagnosis } from '@/lib/ai/diagnose';
import { runAIDiagnosis } from './actions';

/**
 * Botão com estado de espera de verdade.
 *
 * A versão anterior era um link para `?testar=1`: o teste leva até 15s, a
 * navegação não mostra nada nesse intervalo, e parecia que o botão não fazia
 * nada. Aqui o botão vira "Testando…" na hora.
 */
export function AIDiagnostics({ initial }: { initial: ProviderDiagnosis[] }) {
  const [providers, setProviders] = useState(initial);
  const [pending, start] = useTransition();
  const [ran, setRan] = useState(false);

  function run() {
    start(async () => {
      setProviders(await runAIDiagnosis());
      setRan(true);
    });
  }

  return (
    <div className="space-y-4">
      {providers.map((p) => (
        <section key={p.name} className="border-border bg-surface rounded-[20px] border p-4">
          <div className="flex items-center gap-2">
            {p.ok === true ? (
              <CheckCircle2 className="text-success size-5" aria-hidden />
            ) : p.ok === false ? (
              <XCircle className="text-danger size-5" aria-hidden />
            ) : (
              <CircleSlash className="text-subtle size-5" aria-hidden />
            )}
            <h2 className="text-base font-semibold">{p.name}</h2>
            <span className="text-subtle ml-auto text-xs">
              {p.configured ? `chave ${p.keyShape}` : 'sem chave'}
            </span>
          </div>
          <p className="mt-2 text-sm">{pending ? 'Testando…' : p.summary}</p>
          {!pending && p.detail && (
            <pre className="bg-surface-2 text-muted mt-2 overflow-x-auto rounded-xl p-3 text-[11px] whitespace-pre-wrap">
              {p.detail}
            </pre>
          )}
        </section>
      ))}

      <Button onClick={run} disabled={pending} variant={ran ? 'outline' : 'primary'}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? 'Testando… (até 15s)' : ran ? 'Testar de novo' : 'Testar agora'}
      </Button>
    </div>
  );
}
