'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, MailCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { authenticate, signInWithGoogle } from '../server/actions';
import type { AuthFormState, AuthMode } from '../schemas';

/** A marca do Google. Inline porque a CSP bloqueia asset externo. */
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

const LABELS: Record<AuthMode, { cta: string; pending: string; icon: typeof LogIn }> = {
  signin: { cta: 'Entrar', pending: 'Entrando…', icon: LogIn },
  signup: { cta: 'Criar minha conta', pending: 'Criando…', icon: UserPlus },
  magic: { cta: 'Enviar link de acesso', pending: 'Enviando…', icon: Mail },
};

function SubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus();
  const { cta, pending: pendingLabel, icon: Icon } = LABELS[mode];
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
      {pending ? pendingLabel : cta}
    </Button>
  );
}

/**
 * Precisa ser filho do form, não do componente que o renderiza —
 * `useFormStatus` lê o form *acima* dele, então chamar no wrapper reportaria o
 * estado de outro form (ou de nenhum).
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

/** Alternador Entrar / Criar conta. Um toque, sem trocar de tela. */
function ModeTabs({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  const tabs: Array<{ value: AuthMode; label: string }> = [
    { value: 'signin', label: 'Entrar' },
    { value: 'signup', label: 'Criar conta' },
  ];
  const active = mode === 'signup' ? 'signup' : 'signin';

  return (
    <div
      role="tablist"
      aria-label="Entrar ou criar conta"
      className="bg-surface-2 flex rounded-md p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'h-11 flex-1 rounded-sm text-sm font-medium transition-colors',
            active === tab.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function PasswordField({
  mode,
  invalid,
  describedBy,
}: {
  mode: AuthMode;
  invalid: boolean;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor="password">Senha</Label>
        {mode === 'signup' && <span className="text-subtle text-xs">mínimo 8 caracteres</span>}
      </div>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={mode === 'signup' ? 8 : undefined}
          placeholder="••••••••"
          required
          className="pr-12"
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
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
  );
}

const INITIAL: AuthFormState = { status: 'idle' };

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, formAction] = useActionState(authenticate, INITIAL);
  const [mode, setMode] = useState<AuthMode>('signin');

  // Se a ação falhou em outro modo (voltar do servidor demora), o formulário
  // volta para aquele modo — senão o erro apareceria embaixo do form errado.
  useEffect(() => {
    if (state.status === 'error' && state.mode && state.mode !== mode) setMode(state.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state.status === 'sent') {
    return (
      <Confirmation
        title="Link enviado"
        email={state.email}
        body="Abra o e-mail neste mesmo aparelho e você já entra."
        hint="Não chegou? Confira o spam — ou crie a conta com e-mail e senha, que funciona na hora."
      />
    );
  }

  if (state.status === 'confirm') {
    return (
      <Confirmation
        title="Conta criada"
        email={state.email}
        body="Falta só confirmar o e-mail: abra o link que enviamos e depois volte para entrar."
        hint="Não chegou? Confira o spam — o link vale por uma hora."
      />
    );
  }

  const error = state.status === 'error' ? state.message : initialError;
  const errorId = error ? 'login-error' : undefined;
  const fieldWithError = state.status === 'error' ? state.field : undefined;

  return (
    <div className="space-y-5">
      <GoogleButton next={next} />

      <div className="flex items-center gap-3" aria-hidden>
        <span className="bg-border h-px flex-1" />
        <span className="text-subtle text-xs">ou</span>
        <span className="bg-border h-px flex-1" />
      </div>

      {mode !== 'magic' && <ModeTabs mode={mode} onChange={setMode} />}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />

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
            aria-describedby={errorId}
            aria-invalid={fieldWithError === 'email' ? true : undefined}
          />
        </div>

        {mode !== 'magic' && (
          <PasswordField
            mode={mode}
            invalid={fieldWithError === 'password'}
            describedBy={errorId}
          />
        )}

        {error && (
          <p id="login-error" role="alert" className="text-danger text-sm leading-relaxed">
            {error}
          </p>
        )}

        <SubmitButton mode={mode} />
      </form>

      <div className="text-center">
        {mode === 'magic' ? (
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="text-muted hover:text-text inline-flex h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
          >
            <Lock className="size-4" aria-hidden />
            Entrar com e-mail e senha
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode('magic')}
            className="text-muted hover:text-text inline-flex h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
          >
            <Mail className="size-4" aria-hidden />
            Prefiro receber um link por e-mail
          </button>
        )}
      </div>

      <p className="text-subtle text-center text-xs leading-relaxed">
        {mode === 'signup'
          ? 'Sua conta guarda notas, rotina e agenda — só você enxerga.'
          : 'Uma conta, todos os aparelhos. Seus dados ficam sincronizados.'}
      </p>
    </div>
  );
}

/** Tela de "pronto, olha o e-mail". Substitui o form inteiro para não convidar a um segundo envio. */
function Confirmation({
  title,
  email,
  body,
  hint,
}: {
  title: string;
  email: string;
  body: string;
  hint: string;
}) {
  return (
    <div className="text-center">
      <div className="bg-success-soft text-success mx-auto mb-4 grid size-14 place-items-center rounded-full">
        <MailCheck className="size-6" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted mx-auto mt-2 max-w-xs text-sm leading-relaxed">
        {body} Enviado para <strong className="text-text">{email}</strong>.
      </p>
      <p className="text-subtle mt-4 text-xs leading-relaxed">{hint}</p>
    </div>
  );
}
