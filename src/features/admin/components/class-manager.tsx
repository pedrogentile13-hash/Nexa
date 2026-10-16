'use client';

import { useActionState, useState } from 'react';
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field, FormFeedback, Select, SubmitButton } from './form-parts';
import { deleteClass, saveClass, type AdminState } from '../server/actions';
import type { AdminClass } from '../server/queries';

/**
 * Cadastro de turmas.
 *
 * Mesmo padrão de `SchoolManager`/`SubjectManager` (lista + formulário ao
 * lado) — a diferença é que turma é sempre de UMA escola: o admin geral
 * escolhe qual no formulário, o admin de escola nem vê esse campo (a dele já
 * está fixa). Apagar uma turma também apaga qualquer atribuição de
 * professor a ela (`teacher_assignments.class_id on delete cascade`) —
 * alunos só perdem o vínculo (`profiles.class_id` vira `null`).
 */

const INITIAL: AdminState = { status: 'idle' };

export function ClassManager({
  classes,
  schools,
  isGlobal,
}: {
  classes: AdminClass[];
  schools: { id: string; name: string }[];
  isGlobal: boolean;
}) {
  const [state, formAction] = useActionState(saveClass, INITIAL);
  const [editing, setEditing] = useState<AdminClass | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="order-2 lg:order-1">
        {classes.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <Users className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhuma turma cadastrada</p>
            <p className="text-muted mt-1 text-sm">
              Cadastre as turmas da escola — é dessa lista que o aluno escolhe a própria no Perfil,
              e que você atribui professores em Professores.
            </p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-muted text-xs">
                    {c.schoolName ?? 'sem escola'} · {c.studentCount}{' '}
                    {c.studentCount === 1 ? 'aluno' : 'alunos'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  aria-label={`Editar ${c.name}`}
                  className="text-muted hover:bg-surface-2 hover:text-text grid size-11 shrink-0 place-items-center rounded-md"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>

                <form action={deleteClass}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    aria-label={`Excluir ${c.name}`}
                    className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 shrink-0 place-items-center rounded-md"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <form
          action={formAction}
          key={editing?.id ?? 'nova'}
          className="border-border bg-surface space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editing ? 'Editar turma' : 'Nova turma'}</h2>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-muted hover:text-text grid size-11 place-items-center rounded-md"
                aria-label="Cancelar edição"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          {editing && <input type="hidden" name="id" value={editing.id} />}

          {isGlobal && (
            <Field label="Escola">
              <Select name="schoolId" defaultValue={editing?.schoolId ?? ''} required>
                <option value="">Escolha…</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Nome">
            <Input name="name" defaultValue={editing?.name ?? ''} required placeholder="9A" />
          </Field>

          <FormFeedback state={state} />

          <SubmitButton>
            {editing ? (
              'Salvar alterações'
            ) : (
              <>
                <Plus aria-hidden />
                Cadastrar
              </>
            )}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
