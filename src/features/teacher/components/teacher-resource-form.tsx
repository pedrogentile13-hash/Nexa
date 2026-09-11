'use client';

import { useActionState, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, FormFeedback, Select, SubmitButton, Textarea, Toggle } from '@/features/admin/components/form-parts';
import { DIFFICULTIES } from '@/features/admin/lib/labels';
import { saveTeacherResource, type AdminState } from '../server/actions';

const INITIAL: AdminState = { status: 'idle' };

const KINDS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'video', label: 'Vídeo' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'musica', label: 'Música' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'simulado', label: 'Simulado' },
] as const;

interface EditableResource {
  id: string;
  kind: string;
  subject_catalog_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  body: string | null;
  external_url: string | null;
  duration_seconds: number | null;
  difficulty: string;
  xp_reward: number;
  is_published: boolean;
}

export function TeacherResourceForm({
  subjects,
  resource,
}: {
  subjects: { id: string; name: string }[];
  resource?: EditableResource;
}) {
  const [state, formAction] = useActionState(saveTeacherResource, INITIAL);
  const [kind, setKind] = useState(resource?.kind ?? 'resumo');
  const needsPayload = kind !== 'quiz' && kind !== 'simulado';

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {resource && <input type="hidden" name="id" value={resource.id} />}

      <Field label="Formato">
        <Select
          name="kind"
          defaultValue={resource?.kind ?? 'resumo'}
          onChange={(e) => setKind(e.target.value)}
          disabled={Boolean(resource)}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Matéria">
        <Select name="subjectId" defaultValue={resource?.subject_catalog_id ?? ''} required>
          <option value="">Escolha…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Título">
        <Input name="title" defaultValue={resource?.title ?? ''} required maxLength={200} />
      </Field>

      <Field label="Subtítulo" hint="opcional">
        <Input name="subtitle" defaultValue={resource?.subtitle ?? ''} maxLength={160} />
      </Field>

      <Field label="Descrição" hint="opcional">
        <Textarea name="description" rows={2} defaultValue={resource?.description ?? ''} />
      </Field>

      {needsPayload && (
        <>
          <Field label="Texto" hint="markdown — deixe em branco se for usar um link">
            <Textarea name="body" rows={8} defaultValue={resource?.body ?? ''} />
          </Field>
          <Field label="Link" hint="vídeo, áudio ou imagem externa — opcional se já escreveu o texto">
            <Input
              name="externalUrl"
              type="url"
              defaultValue={resource?.external_url ?? ''}
              placeholder="https://…"
            />
          </Field>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dificuldade">
          <Select name="difficulty" defaultValue={resource?.difficulty ?? 'medio'}>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="XP ao concluir">
          <Input
            name="xpReward"
            type="number"
            min={0}
            max={1000}
            defaultValue={resource?.xp_reward ?? 20}
          />
        </Field>
      </div>

      <Toggle name="isPublished" defaultChecked={resource?.is_published ?? false} label="Publicado" />

      <FormFeedback state={state} />
      <SubmitButton>{resource ? 'Salvar alterações' : 'Criar conteúdo'}</SubmitButton>
    </form>
  );
}
