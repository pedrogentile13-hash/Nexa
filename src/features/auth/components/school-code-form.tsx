'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, School, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithSchoolCode } from '../server/login-actions';
import type { AuthFormState } from '../schemas';

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

/** Código da escola, login e senha na mesma tela: nada de abrir outro endereço. */
export function SchoolCodeForm() {
  const [state, action] = useActionState(signInWithSchoolCode, INITIAL);
  const [visible, setVisible] = useState(false);
  const error = state.status === 'error' ? state.message : undefined;

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="code">Código da escola</Label>
        <div className="relative">
          <School className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <Input id="code" name="code" placeholder="anglomorumbi" autoCapitalize="none" autoCorrect="off" spellCheck={false} required className="pl-10" aria-invalid={error ? true : undefined} />
        </div>
        <p className="text-subtle mt-1 text-xs">A coordenação informa. Ex.: <b>anglomorumbi</b></p>
      </div>
      <div>
        <Label htmlFor="login">Login</Label>
        <div className="relative">
          <User className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <Input id="login" name="login" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="seu.login" required className="pl-10" aria-invalid={error ? true : undefined} />
        </div>
      </div>
      <div>
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
          <Input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="••••-••••" required className="pr-12 pl-10" aria-invalid={error ? true : undefined} />
          <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} className="text-subtle hover:text-text absolute inset-y-0 right-0 grid w-12 place-items-center">
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
      <Submit />
    </form>
  );
}
