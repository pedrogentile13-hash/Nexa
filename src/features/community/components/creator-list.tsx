'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { BookOpen, GraduationCap, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PopEmptyState } from '@/components/ui/empty-state';
import { setCreatorVisibility, deleteCreatorContent } from '../server/creator-actions';
import type { MyCreatorResource } from '../server/creator-queries';
import type { ResourceVisibility } from '@/types/database.types';

const VISIBILITY_LABEL: Record<ResourceVisibility, string> = {
  private: 'Só eu',
  friends: 'Amigos',
  school: 'Minha escola',
  community: 'Uma comunidade',
  public: 'Todo mundo',
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : 'Salvar'}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Excluir"
      className="text-subtle hover:text-danger grid size-9 shrink-0 place-items-center rounded-full disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
    </button>
  );
}

function VisibilityForm({
  resource,
  communities,
}: {
  resource: MyCreatorResource;
  communities: { id: string; name: string }[];
}) {
  const [visibility, setVisibility] = useState<ResourceVisibility>(resource.visibility);

  return (
    <form action={setCreatorVisibility} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="resourceId" value={resource.id} />
      <select
        name="visibility"
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as ResourceVisibility)}
        aria-label="Quem pode ver"
        className="border-border bg-surface text-text h-9 rounded-md border px-2 text-xs outline-none"
      >
        {Object.entries(VISIBILITY_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {visibility === 'community' && (
        <select
          name="communityId"
          defaultValue={resource.communityId ?? ''}
          aria-label="Qual comunidade"
          className="border-border bg-surface text-text h-9 rounded-md border px-2 text-xs outline-none"
        >
          <option value="" disabled>
            Escolha a comunidade
          </option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <SaveButton />
    </form>
  );
}

export function CreatorList({
  resources,
  communities,
}: {
  resources: MyCreatorResource[];
  communities: { id: string; name: string }[];
}) {
  if (resources.length === 0) {
    return (
      <PopEmptyState
        icon={<GraduationCap className="size-6 text-white" aria-hidden />}
        title="Nada gerado ainda"
        description="Peça um quiz ou resumo ali em cima — o que você criar aparece aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((r) => {
        const href = r.kind === 'quiz' ? `/estudar/${r.id}` : `/estudar/${r.id}`;
        return (
          <div key={r.id} className="border-border bg-surface space-y-3 rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={href as never} className="hover:text-brand-text font-semibold underline-offset-2 hover:underline">
                  {r.title}
                </Link>
                <p className="text-muted mt-0.5 flex items-center gap-1.5 text-xs">
                  <BookOpen className="size-3.5" aria-hidden />
                  {r.subjectName}
                  {r.kind === 'quiz' && ` · ${r.questionCount} questões`}
                </p>
              </div>
              <form action={deleteCreatorContent}>
                <input type="hidden" name="resourceId" value={r.id} />
                <DeleteButton />
              </form>
            </div>
            <VisibilityForm resource={r} communities={communities} />
          </div>
        );
      })}
    </div>
  );
}
