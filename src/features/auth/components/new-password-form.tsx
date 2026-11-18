'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setNewPassword } from '../server/actions';
import type { AuthFormState } from '../schemas';

const INITIAL: AuthFormState = { status: 'idle' };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
      {pending ? 'Salvando…' : 'Salvar e entrar'}
    </Button>
  );
}

export function NewPasswordForm() {
  const [state, formAction] = useActionState(setNewPassword, INITIAL);
  const [visible, setVisible] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Nova senha</Label>
          <span className="text-subtle text-xs">mínimo 8 caracteres</span>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            placeholder="••••••••"
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="text-subtle hover:text-text absolute inset-y-0 right-0 grid w-12 place-items-center"
          >
            {visible ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirm">Repita a nova senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </div>

      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm leading-relaxed">
          {state.message}
        </p>
      )}

      <Submit />
    </form>
  );
}
