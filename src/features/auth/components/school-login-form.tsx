'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithLogin } from '../server/login-actions';
import type { AuthFormState } from '../schemas';

/**
 * Entrada do endereço de uma escola: LOGIN e SENHA, nada além.
 *
 * Sem e-mail, Google, link mágico, "esqueci a senha" nem cadastro — a conta é
 * criada pela coordenação, que também entrega uma nova senha se for preciso.
 */

const INITIAL: AuthFormState = { status: 'idle' };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending ? 'Entrando…' : 'Entrar'}
      {!pending && <ArrowRight aria-hidden />}
    </Button>
  );
}

export function SchoolLoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, formAction] = useActionState(signInWithLogin, INITIAL);
  const [visible, setVisible] = useState(false);
  const error = state.status === 'error' ? state.message : initialError;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <Label htmlFor="login">Login</Label>
        <div className="relative">
          <User className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            id="login"
            name="login"
            type="text"
            inputMode="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="seu.login"
            required
            className="pl-10"
            aria-invalid={error ? true : undefined}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="••••-••••"
            required
            className="pr-12 pl-10"
            aria-invalid={error ? true : undefined}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="text-subtle hover:text-text absolute inset-y-0 right-0 grid w-12 place-items-center"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      <Submit />

      <p className="text-muted text-center text-sm">
        Perdeu a senha ou o login? Fale com a coordenação da escola.
      </p>
    </form>
  );
}
