'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, MailCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '../server/actions';
import type { AuthFormState } from '../schemas';

const INITIAL: AuthFormState = { status: 'idle' };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
      {pending ? 'Enviando…' : 'Enviar link de recuperação'}
    </Button>
  );
}

export function RecoverForm() {
  const [state, formAction] = useActionState(requestPasswordReset, INITIAL);

  if (state.status === 'sent') {
    return (
      <div className="text-center">
        <div className="bg-success-soft text-success mx-auto mb-4 grid size-14 place-items-center rounded-full">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Se essa conta existir, o link está a caminho</h2>
        <p className="text-muted mx-auto mt-2 max-w-xs text-sm leading-relaxed">
          Enviamos para <strong className="text-text">{state.email}</strong>. Abra o link neste
          mesmo aparelho para escolher uma senha nova.
        </p>
        {/* Não confirmamos se o e-mail tem conta: a tela viraria um verificador
            de cadastro, e qualquer pessoa descobriria quem usa o Nexa. */}
        <p className="text-subtle mt-4 text-xs leading-relaxed">
          Não chegou? Confira o spam. O link vale por uma hora.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail da conta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="voce@escola.com.br"
          required
          aria-describedby={state.status === 'error' ? 'recover-error' : undefined}
        />
      </div>

      {state.status === 'error' && (
        <p id="recover-error" role="alert" className="text-danger text-sm leading-relaxed">
          {state.message}
        </p>
      )}

      <Submit />
    </form>
  );
}
