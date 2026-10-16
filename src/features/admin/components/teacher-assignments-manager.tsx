'use client';

import { useActionState, useState } from 'react';
import { GraduationCap, Plus, Trash2, X } from 'lucide-react';
import { Field, FormFeedback, Select, SubmitButton } from './form-parts';
import {
  deleteTeacherAssignment,
  saveTeacherAssignment,
  type AdminState,
} from '../server/actions';
import type { AdminClassOption, AdminPerson, AdminTeacherAssignment } from '../server/queries';

/**
 * Atribuição de professor a matéria+turma.
 *
 * Promover alguém a "Professor" em `/admin/usuarios` só troca o papel — sem
 * uma linha aqui, ele não enxerga nem edita nada em `/professor`: escopo é
 * matéria+turma, e só existe nesta tabela.
 */

const INITIAL: AdminState = { status: 'idle' };

export function TeacherAssignmentsManager({
  assignments,
  teachers,
  subjects,
  schools,
  classes,
  isGlobal,
}: {
  assignments: AdminTeacherAssignment[];
  teachers: AdminPerson[];
  subjects: { id: string; name: string }[];
  schools: { id: string; name: string }[];
  classes: AdminClassOption[];
  isGlobal: boolean;
}) {
  const [state, formAction] = useActionState(saveTeacherAssignment, INITIAL);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="order-2 lg:order-1">
        {assignments.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <GraduationCap className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum professor atribuído ainda</p>
            <p className="text-muted mt-1 text-sm">
              Promova alguém a &quot;Professor&quot; em Usuários e atribua matéria+turma aqui — sem
              isso, a conta de professor não enxerga nem edita nada.
            </p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.teacherName ?? 'Sem nome'}</p>
                  <p className="text-muted text-xs">
                    {a.subjectName} · Turma {a.className}
                    {a.schoolName ? ` · ${a.schoolName}` : ''}
                  </p>
                </div>
                <form action={deleteTeacherAssignment}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    aria-label={`Remover atribuição de ${a.teacherName ?? 'professor'}`}
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
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="border-border bg-surface hover:bg-surface-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm font-medium"
          >
            <Plus className="size-4" aria-hidden />
            Nova atribuição
          </button>
        ) : (
          <form
            action={formAction}
            className="border-border bg-surface space-y-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Nova atribuição</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted hover:text-text grid size-11 place-items-center rounded-md"
                aria-label="Cancelar"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            {teachers.length === 0 ? (
              <p className="text-muted text-sm">
                Nenhum professor cadastrado ainda — promova alguém a &quot;Professor&quot; em
                Usuários primeiro.
              </p>
            ) : (
              <>
                <Field label="Professor">
                  <Select name="teacherId" required>
                    <option value="">Escolha…</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName ?? t.id}
                      </option>
                    ))}
                  </Select>
                </Field>

                {isGlobal && (
                  <Field label="Escola">
                    <Select name="schoolId" required>
                      <option value="">Escolha…</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                <Field label="Matéria">
                  <Select name="subjectCatalogId" required>
                    <option value="">Escolha…</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Turma"
                  hint={classes.length === 0 ? 'nenhuma turma cadastrada ainda' : undefined}
                >
                  <Select name="classId" required disabled={classes.length === 0}>
                    <option value="">Escolha…</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.schoolName ? `${c.name} — ${c.schoolName}` : c.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <FormFeedback state={state} />

                <SubmitButton>
                  <Plus aria-hidden />
                  Atribuir
                </SubmitButton>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
