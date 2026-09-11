'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, FormFeedback, Select, SubmitButton, Textarea } from '@/features/admin/components/form-parts';
import { notifyMyClass, type AdminState } from '../server/actions';

const INITIAL: AdminState = { status: 'idle' };

export function TeacherNoticeForm({
  subjects,
  classNames,
}: {
  subjects: { id: string; name: string }[];
  classNames: string[];
}) {
  const [state, formAction] = useActionState(notifyMyClass, INITIAL);

  return (
    <form action={formAction} className="border-border bg-surface max-w-xl space-y-4 rounded-2xl border p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Turma">
          <Select name="className" required>
            <option value="">Escolha…</option>
            {classNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
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
      </div>

      <Field label="Título">
        <Input name="title" required maxLength={160} placeholder="Prova na próxima aula" />
      </Field>

      <Field label="Mensagem" hint="opcional">
        <Textarea name="body" rows={3} maxLength={500} />
      </Field>

      <Field label="Link" hint="opcional — leva pro conteúdo relacionado, por exemplo">
        <Input name="link" placeholder="/estudar/…" />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton>Enviar aviso</SubmitButton>
    </form>
  );
}
