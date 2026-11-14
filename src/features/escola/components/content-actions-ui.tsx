'use client';

import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { removeContent, togglePublish } from '../server/content-actions';

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  return (
    <form action={togglePublish}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={String(!published)} />
      <button type="submit" title={published ? 'Voltar para rascunho' : 'Publicar'} className="text-muted hover:bg-surface-2 flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold">
        {published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        {published ? 'Despublicar' : 'Publicar'}
      </button>
    </form>
  );
}

export function DeleteContent({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={removeContent}
      onSubmit={(e) => {
        if (!window.confirm(`Apagar "${title}"? Isso não pode ser desfeito.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" aria-label={`Apagar ${title}`} className="text-muted hover:text-danger grid size-9 place-items-center rounded-full">
        <Trash2 className="size-4" aria-hidden />
      </button>
    </form>
  );
}
