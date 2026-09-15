'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authenticate, signInWithGoogle, verifyMagicCode } from '../server/actions';
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

const LABELS: Record<
  AuthMode,
  { cta: string; pending: string; icon: typeof ArrowRight; trailing?: boolean }
> = {
  signin: { cta: 'Entrar', pending: 'Entrando…', icon: ArrowRight, trailing: true },
  signup: { cta: 'Criar minha conta', pending: 'Criando…', icon: UserPlus },
  magic: { cta: 'Enviar link de acesso', pending: 'Enviando…', icon: Mail },
};

function SubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus();
  const { cta, pending: pendingLabel, icon: Icon, trailing } = LABELS[mode];

  // No "Entrar" a seta vem DEPOIS do texto, como no kit: ela aponta para
  // frente, e um ícone à esquerda apontando para a direita empurra a leitura
  // para trás.
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : trailing ? (
        <>
          {cta}
          <Icon aria-hidden />
        </>
      ) : (
        <>
          <Icon aria-hidden />
          {cta}
        </>
      )}
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

/**
 * Alternador Entrar / Criar conta — um link, não abas.
 *
 * Uma pergunta e resposta ("Ainda não tem conta? Cadastre-se") em vez de duas
 * abas competindo por atenção: quem chegou aqui quase sempre já sabe se tem
 * conta ou não, então o link é a pergunta certa a responder, não uma escolha
 * entre dois botões do mesmo tamanho.
 */
function ModeSwitchLink({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  const isSignup = mode === 'signup';
  return (
    <p className="text-muted text-right text-sm">
      {isSignup ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
      <button
        type="button"
        onClick={() => onChange(isSignup ? 'signin' : 'signup')}
        className="text-brand-text font-semibold underline-offset-4 hover:underline"
      >
        {isSignup ? 'Entrar' : 'Cadastre-se'}
      </button>
    </p>
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
        <Lock
          className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id="password"
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={mode === 'signup' ? 8 : undefined}
          placeholder="••••••••"
          required
          className="pr-12 pl-10"
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

  if (state.status === 'code') {
    return <CodeForm email={state.email} next={next} resendAction={formAction} />;
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
      {mode !== 'magic' && <ModeSwitchLink mode={mode} onChange={setMode} />}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />

        <div>
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail
              className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
              aria-hidden
            />
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
              className="pl-10"
              aria-describedby={errorId}
              aria-invalid={fieldWithError === 'email' ? true : undefined}
            />
          </div>
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

        {mode === 'signup' && (
          <p className="text-subtle text-center text-xs leading-relaxed">
            Ao criar conta, você concorda com os{' '}
            <Link href="/termos-de-uso" className="underline underline-offset-2" target="_blank">
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              href="/politica-de-privacidade"
              className="underline underline-offset-2"
              target="_blank"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        )}
      </form>

      <div className="flex items-center justify-between gap-3">
        {mode === 'signin' ? (
          <Link
            href="/recuperar-senha"
            className="text-brand-text inline-flex h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
          >
            Esqueci minha senha
          </Link>
        ) : (
          <span />
        )}

        {mode === 'magic' ? (
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="text-muted hover:text-text inline-flex h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
          >
            <Lock className="size-4" aria-hidden />
            E-mail e senha
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode('magic')}
            className="text-muted hover:text-text inline-flex h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline"
          >
            <Mail className="size-4" aria-hidden />
            Link por e-mail
          </button>
        )}
      </div>

      {mode !== 'magic' && (
        <>
          <div className="flex items-center gap-3" aria-hidden>
            <span className="bg-border h-px flex-1" />
            <span className="text-subtle text-xs">ou continue com</span>
            <span className="bg-border h-px flex-1" />
          </div>

          <GoogleButton next={next} />
        </>
      )}
    </div>
  );
}

function CodeSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          Confirmando…
        </>
      ) : (
        <>
          <KeyRound aria-hidden />
          Confirmar código
        </>
      )}
    </Button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-muted hover:text-text mx-auto block text-sm underline-offset-4 hover:underline disabled:opacity-60"
    >
      {pending ? 'Reenviando…' : 'Reenviar código'}
    </button>
  );
}

/**
 * Digitar o código de 6 dígitos que veio junto do link mágico no e-mail.
 *
 * `resendAction` reaproveita a MESMA Server Action (`authenticate`) do
 * formulário principal — reenviar é literalmente pedir o link mágico de novo
 * para o mesmo e-mail, então não precisa de um segundo estado para acompanhar.
 */
function CodeForm({
  email,
  next,
  resendAction,
}: {
  email: string;
  next: string;
  resendAction: (formData: FormData) => void;
}) {
  const [state, formAction] = useActionState(verifyMagicCode, INITIAL);
  const error = state.status === 'error' ? state.message : undefined;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="bg-success-soft text-success mx-auto mb-4 grid size-14 place-items-center rounded-full">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Digite o código</h2>
        <p className="text-muted mx-auto mt-2 max-w-xs text-sm leading-relaxed">
          Enviamos um código de 6 dígitos para <strong className="text-text">{email}</strong>.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            required
            autoFocus
            className="text-center text-lg tracking-[0.5em]"
            aria-describedby={error ? 'code-error' : undefined}
            aria-invalid={error ? true : undefined}
          />
        </div>

        {error && (
          <p id="code-error" role="alert" className="text-danger text-sm leading-relaxed">
            {error}
          </p>
        )}

        <CodeSubmit />
      </form>

      <form action={resendAction}>
        <input type="hidden" name="mode" value="magic" />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <ResendButton />
      </form>

      <p className="text-subtle text-center text-xs leading-relaxed">
        Não chegou? Confira o spam. O código vale por alguns minutos.
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
