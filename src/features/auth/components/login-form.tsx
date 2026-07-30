'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Mail, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithGoogle, signInWithMagicLink } from '../server/actions';
import type { AuthFormState } from '../schemas';

/** Google's mark. Inline because the CSP blocks external assets. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.86Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
      {pending ? 'Enviando…' : 'Enviar link de acesso'}
    </Button>
  );
}

/**
 * Must be a child of the form, not the component that renders it —
 * `useFormStatus` reads the nearest form *above* it, so calling it in the
 * wrapper would report the status of some other form (or none at all).
 */
function GoogleSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <GoogleIcon />}
      Continuar com Google
    </Button>
  );
}

function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <GoogleSubmit />
    </form>
  );
}

const INITIAL: AuthFormState = { status: 'idle' };

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, formAction] = useActionState(signInWithMagicLink, INITIAL);

  // The e-mail was sent: replace the form entirely. Leaving it on screen invites
  // a second submit, which only trips Supabase's rate limit.
  if (state.status === 'sent') {
    return (
      <div className="text-center">
        <div className="bg-success-soft text-success mx-auto mb-4 grid size-14 place-items-center rounded-full">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Link enviado</h2>
        <p className="text-muted mx-auto mt-2 max-w-xs text-sm leading-relaxed">
          Enviei um link de acesso para <strong className="text-text">{state.email}</strong>. Abra o
          e-mail neste mesmo aparelho e você já entra.
        </p>
        <p className="text-subtle mt-4 text-xs">
          Não chegou? Confira o spam — ou espere um minuto e peça outro.
        </p>
      </div>
    );
  }

  const error = state.status === 'error' ? state.message : initialError;

  return (
    <div className="space-y-5">
      <GoogleButton next={next} />

      <div className="flex items-center gap-3" aria-hidden>
        <span className="bg-border h-px flex-1" />
        <span className="text-subtle text-xs">ou</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">E-mail</Label>
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
            aria-describedby={error ? 'login-error' : undefined}
            aria-invalid={error ? true : undefined}
          />
        </div>

        {error && (
          <p id="login-error" role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="text-subtle text-center text-xs leading-relaxed">
        Sem senha para lembrar. Enviamos um link e você entra com um toque.
      </p>
    </div>
  );
}
