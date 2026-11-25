'use client';

import { Trash2 } from 'lucide-react';
import { deleteMyCreation } from '../server/material-actions';

/** Apagar um conteúdo criado: pede confirmação antes, porque não tem volta. */
export function DeleteCreationButton({ resourceId, title }: { resourceId: string; title: string }) {
  return (
    <form
      action={deleteMyCreation}
      onSubmit={(e) => {
        if (!window.confirm(`Apagar "${title}"? Isso não pode ser desfeito.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="resourceId" value={resourceId} />
      <button
        type="submit"
        aria-label={`Apagar ${title}`}
        title="Apagar"
        className="text-muted hover:bg-danger-soft hover:text-danger grid size-9 shrink-0 place-items-center rounded-full"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </form>
  );
}
