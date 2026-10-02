'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { SocialVisibility } from '@/types/database.types';
import { saveSocialProfile, type SocialProfileState } from '../server/actions';

const INITIAL: SocialProfileState = { status: 'idle' };

const VISIBILITY_OPTIONS: { value: SocialVisibility; label: string; hint: string }[] = [
  { value: 'private', label: 'Só eu', hint: 'ninguém mais vê seu perfil social' },
  { value: 'friends', label: 'Amigos', hint: 'só quem é seu amigo aceito' },
  { value: 'school', label: 'Minha escola', hint: 'qualquer colega da mesma escola' },
  { value: 'public', label: 'Público', hint: 'qualquer pessoa no Nexa' },
];

/**
 * Perfil social do Nexa Community (Fase 1) — username/bio/visibilidade,
 * separado dos dados acadêmicos que `ProfileForm` já edita. Mesmo padrão de
 * `useActionState`/`SaveButton` de `ProfileForm`, pra não inventar uma
 * segunda convenção de formulário na mesma tela.
 */
export function SocialProfileForm({
  username,
  bio,
  visibility,
}: {
  username: string | null;
  bio: string | null;
  visibility: SocialVisibility;
}) {
  const [state, formAction] = useActionState(saveSocialProfile, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <h3 className="text-muted text-xs font-semibold tracking-wide uppercase">Perfil social</h3>

      <div>
        <Label htmlFor="username">Nome de usuário</Label>
        <Input
          id="username"
          name="username"
          defaultValue={username ?? ''}
          placeholder="ex: joao_silva"
          autoComplete="off"
          maxLength={24}
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ''}
          rows={3}
          maxLength={280}
          className={cn(
            'border-border bg-surface text-text w-full rounded-md border px-3 py-2.5 text-base',
            'placeholder:text-subtle transition-colors outline-none',
            'focus-visible:border-brand focus-visible:ring-brand/25 focus-visible:ring-2',
            'sm:text-sm',
          )}
        />
      </div>

      <div>
        <Label htmlFor="visibility">Quem pode ver seu perfil social</Label>
        <select
          id="visibility"
          name="visibility"
          defaultValue={visibility}
          className={cn(
            'border-border bg-surface text-text h-12 w-full rounded-md border px-3 text-base',
            'focus-visible:border-brand focus-visible:ring-brand/25 outline-none focus-visible:ring-2',
            'sm:h-11 sm:text-sm',
          )}
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} — {o.hint}
            </option>
          ))}
        </select>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SaveButton />
        {state.status === 'saved' && (
          <span className="text-success flex items-center gap-1.5 text-sm" aria-live="polite">
            <Check className="size-4" aria-hidden />
            salvo
          </span>
        )}
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      Salvar
    </Button>
  );
}
