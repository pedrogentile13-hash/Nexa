'use client';

import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from './form-parts';
import { RESOURCE_KINDS } from '../lib/labels';

/**
 * Filtros da biblioteca.
 *
 * O estado mora na URL, não no componente: um link filtrado é compartilhável,
 * volta igual depois de editar um item e sobrevive a recarregar a página —
 * que é o que acontece o tempo todo quando se publica dez itens seguidos.
 */

type Current = { kind?: string; subject?: string; school?: string; status?: string; q?: string };

export function ResourceFilterBar({
  subjects,
  schools,
  current,
}: {
  subjects: { id: string; name: string }[];
  schools: { id: string; name: string }[];
  current: Current;
}) {
  const router = useRouter();

  function apply(patch: Partial<Current>) {
    const next = { ...current, ...patch };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== 'todos') query.set(key, value);
    }
    const qs = query.toString();
    router.push(qs ? `/admin/conteudo?${qs}` : '/admin/conteudo');
  }

  const hasFilter = Boolean(
    current.kind || current.subject || current.school || current.status || current.q,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-[200px] flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q');
          apply({ q: typeof value === 'string' && value.trim() ? value.trim() : undefined });
        }}
      >
        <Search
          className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          name="q"
          defaultValue={current.q ?? ''}
          placeholder="Buscar pelo título"
          className="pl-9"
        />
      </form>

      <Select
        aria-label="Formato"
        value={current.kind ?? 'todos'}
        onChange={(e) => apply({ kind: e.target.value })}
        className="w-auto"
      >
        <option value="todos">Todos os formatos</option>
        {RESOURCE_KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.plural}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Matéria"
        value={current.subject ?? 'todos'}
        onChange={(e) =>
          apply({ subject: e.target.value === 'todos' ? undefined : e.target.value })
        }
        className="w-auto"
      >
        <option value="todos">Todas as matérias</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      {schools.length > 0 && (
        <Select
          aria-label="Escola"
          value={current.school ?? 'todos'}
          onChange={(e) =>
            apply({ school: e.target.value === 'todos' ? undefined : e.target.value })
          }
          className="w-auto"
        >
          <option value="todos">Todas as escolas</option>
          <option value="global">Só o acervo global</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      )}

      <Select
        aria-label="Situação"
        value={current.status ?? 'todos'}
        onChange={(e) => apply({ status: e.target.value === 'todos' ? undefined : e.target.value })}
        className="w-auto"
      >
        <option value="todos">Publicados e rascunhos</option>
        <option value="publicado">Só publicados</option>
        <option value="rascunho">Só rascunhos</option>
      </Select>

      {hasFilter && (
        <button
          type="button"
          onClick={() => router.push('/admin/conteudo')}
          className="text-muted hover:bg-surface-2 hover:text-text flex h-11 items-center gap-1.5 rounded-md px-3 text-sm"
        >
          <X className="size-4" aria-hidden />
          Limpar
        </button>
      )}
    </div>
  );
}
