'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Check, GraduationCap, Layers, Loader2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Journey } from '@/types/database.types';
import { changeJourney } from '../server/actions';

/**
 * Trocar de jornada depois da criação da conta.
 *
 * A troca é reversível e não apaga nada — quem foi aluno de escola e vira
 * vestibulando mantém ano letivo, notas e histórico. O que muda é o que a
 * pessoa VÊ: qual tela abre, qual navegação aparece, qual plataforma o menu
 * do logo marca como atual. É essa reversibilidade que justifica isto ser um
 * clique no Perfil em vez de uma decisão travada no cadastro.
 */

const OPTIONS: {
  value: Journey;
  title: string;
  description: string;
  Icon: typeof GraduationCap;
}[] = [
  {
    value: 'school',
    title: 'Nexa Escolas',
    description: 'Matérias, lições, provas e notas da escola.',
    Icon: GraduationCap,
  },
  {
    value: 'vestibular',
    title: 'Nexa Vestibular',
    description: 'Plano de estudo, banco de questões, central de erros e redação.',
    Icon: Target,
  },
  {
    value: 'both',
    title: 'As duas',
    description: 'Abro na escola e troco pro vestibular pelo menu do logo.',
    Icon: Layers,
  },
];

export function JourneyPicker({ current }: { current: Journey }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<Journey>(current);
  const [error, setError] = useState<string | null>(null);

  function pick(next: Journey) {
    if (next === value || pending) return;
    setError(null);
    const previous = value;
    // Marca na hora e desfaz se der errado: a troca é instantânea no servidor
    // e esperar o round-trip pra pintar o selecionado faz o clique parecer
    // ignorado.
    setValue(next);

    startTransition(async () => {
      const result = await changeJourney(next);
      if (result.status === 'error') {
        setValue(previous);
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Minha jornada</h3>
        <p className="text-muted text-sm leading-snug">
          Define qual Nexa abre quando você entra. Nada é apagado ao trocar.
        </p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map(({ value: option, title, description, Icon }) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              disabled={pending}
              onClick={() => pick(option)}
              className={cn(
                'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                'disabled:opacity-60',
                active ? 'border-brand bg-brand-soft' : 'border-border hover:bg-surface-2',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-xl',
                  active ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted',
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-semibold',
                    active && 'text-brand-text',
                  )}
                >
                  {title}
                  {active && !pending && <Check className="size-3.5 shrink-0" aria-hidden />}
                  {active && pending && (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                  )}
                </span>
                <span className="text-muted block text-xs leading-snug">{description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
