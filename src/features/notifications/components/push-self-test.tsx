'use client';

import { useState, useTransition } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendTestPush } from '../server/actions';

/**
 * Autoteste de push — sem HTTPS público no ambiente de desenvolvimento, não
 * dá pra confirmar entrega de dentro do próprio processo de build. Quem
 * confirma que VAPID + a service role key estão configurados certo é o
 * próprio usuário, mandando um push pra si mesmo e vendo se ele chega.
 */
export function PushSelfTest() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="border-border bg-surface-2/40 mt-4 space-y-2 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">Testar notificação neste aparelho</p>
        <p className="text-muted mt-0.5 text-xs leading-relaxed">
          Ative os avisos no sino (ícone no topo da tela) e use o botão abaixo pra confirmar que
          chegam mesmo com o app fechado.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await sendTestPush();
              setMessage(result.message);
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <BellRing aria-hidden />}
          Mandar notificação de teste
        </Button>
        {message && <span className="text-muted text-xs">{message}</span>}
      </div>
    </div>
  );
}
