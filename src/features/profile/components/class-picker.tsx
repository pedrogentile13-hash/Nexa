'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users } from 'lucide-react';
import { updateClass } from '../server/actions';
import type { ClassOption } from '@/features/classes/server/queries';

/**
 * Turma — diferente da escola, aqui não existe "cadastrar a minha": só o
 * admin/school_admin da escola cadastra (`/admin/turmas`), o aluno escolhe
 * de uma lista fechada. Sem escola vinculada, nem faz sentido perguntar.
 */
export function ClassPicker({
  currentSchoolId,
  currentClassId,
  currentClassName,
  classes,
}: {
  currentSchoolId: string | null;
  currentClassId: string | null;
  currentClassName: string | null;
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onChange(value: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateClass(value || null);
      if (!result.ok) {
        setMessage(result.message ?? 'Não consegui salvar a turma.');
        return;
      }
      router.refresh();
    });
  }

  if (!currentSchoolId) {
    return (
      <div className="flex items-center gap-3">
        <span className="bg-surface-2 text-muted grid size-10 shrink-0 place-items-center rounded-full">
          <Users className="size-4" aria-hidden />
        </span>
        <p className="text-muted text-xs">Vincule uma escola primeiro pra escolher a turma.</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="bg-surface-2 text-muted grid size-10 shrink-0 place-items-center rounded-full">
          <Users className="size-4" aria-hidden />
        </span>
        <p className="text-muted text-xs">Sua escola ainda não cadastrou nenhuma turma.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
        <Users className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <select
          value={currentClassId ?? ''}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Turma"
          className="border-border bg-surface text-text h-11 w-full rounded-md border px-3 text-sm outline-none disabled:opacity-60"
        >
          <option value="">Sem turma</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {message && <p className="text-danger mt-1 text-xs">{message}</p>}
        {!message && currentClassName && (
          <p className="text-muted mt-1 text-xs">Turma atual: {currentClassName}</p>
        )}
      </div>
      {pending && <Loader2 className="text-subtle size-4 shrink-0 animate-spin" aria-hidden />}
    </div>
  );
}
