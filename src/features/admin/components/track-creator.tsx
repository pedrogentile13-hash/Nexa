'use client';

import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field, FormFeedback, Select, SubmitButton, Textarea, Toggle } from './form-parts';
import { saveTrack, type AdminState } from '../server/actions';

const INITIAL: AdminState = { status: 'idle' };

export function TrackCreator({
  subjects,
  schools,
  canChooseSchool,
}: {
  subjects: { id: string; name: string }[];
  schools: { id: string; name: string }[];
  canChooseSchool: boolean;
}) {
  const [state, formAction] = useActionState(saveTrack, INITIAL);

  return (
    <form action={formAction} className="border-border bg-surface space-y-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Nova trilha</h2>

      <Field label="Matéria">
        <Select name="subjectId" required>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Título">
        <Input name="title" required placeholder="Trilha de Física" />
      </Field>

      <Field label="Descrição" hint="opcional">
        <Textarea
          name="description"
          rows={2}
          placeholder="Do movimento uniforme às Leis de Newton, uma lição por vez."
        />
      </Field>

      {canChooseSchool && (
        <Field label="Quem enxerga">
          <Select name="schoolId" defaultValue="global">
            <option value="global">Todas as escolas</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                Só {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Toggle
        name="isPublished"
        label="Publicada"
        description="Uma trilha vazia publicada é pior que nenhuma: abre e não tem o que fazer."
      />

      <FormFeedback state={state} />
      <SubmitButton>
        <Plus aria-hidden />
        Criar trilha
      </SubmitButton>
    </form>
  );
}
