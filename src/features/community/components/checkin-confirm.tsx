'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkInByCode } from '../server/event-actions';

/**
 * Tela que abre quando quem organiza escaneia o QR do ingresso (com a câmera
 * nativa do celular, sem scanner dentro do app). Confirmação explícita em vez
 * de check-in automático ao abrir o link — um GET não deveria ter efeito
 * colateral (preview de link, bot, recarregar a página não deveria repetir).
 */
export function CheckinConfirm({ code }: { code: string }) {
  const [result, setResult] = useState<{ ok: true; fullName: string; eventTitle: string } | { ok: false; message: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      setResult(await checkInByCode(code));
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5 text-center">
        {result === null ? (
          <>
            <p className="text-sm">Confirmar presença desta pessoa no evento?</p>
            <Button type="button" disabled={pending} onClick={handleConfirm} className="w-full">
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Confirmar check-in
            </Button>
          </>
        ) : result.ok ? (
          <>
            <CheckCircle2 className="text-success mx-auto size-10" aria-hidden />
            <p className="text-sm font-medium">
              {result.fullName} confirmado(a) em &quot;{result.eventTitle}&quot;.
            </p>
          </>
        ) : (
          <>
            <XCircle className="text-danger mx-auto size-10" aria-hidden />
            <p className="text-danger text-sm">{result.message}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
