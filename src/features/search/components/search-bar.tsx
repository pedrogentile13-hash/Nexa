'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { FileText, Loader2, School, Search, User, X } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { kindLabel } from '@/features/admin/lib/labels';
import type { AdminSearchResult, ContentSearchResult } from '../server/actions';

/**
 * Barra de busca do cabeçalho.
 *
 * Um componente só para as duas versões (aluno busca só conteúdo, admin busca
 * conteúdo+pessoas+escolas) — o que muda é qual função de busca é passada e
 * para onde cada tipo de resultado leva; a interação (digitar, abrir/fechar,
 * navegar com teclado) é idêntica nas duas.
 */

type Result = ContentSearchResult | AdminSearchResult;

function resultHref(result: Result): Route {
  if (result.type === 'content') return `/estudar/${result.id}` as Route;
  if (result.type === 'person') return '/admin/usuarios' as Route;
  return '/admin/escolas' as Route;
}

function ResultIcon({ result }: { result: Result }) {
  if (result.type === 'person') return <User className="size-4" aria-hidden />;
  if (result.type === 'school') return <School className="size-4" aria-hidden />;
  return <FileText className="size-4" aria-hidden />;
}

function resultLabel(result: Result): string {
  if (result.type === 'content') return result.title;
  if (result.type === 'person') return result.name;
  return result.name;
}

function resultHint(result: Result): string {
  if (result.type === 'content') return `${kindLabel(result.kind)} · ${result.subjectName}`;
  if (result.type === 'person') return result.schoolName ? `${result.role} · ${result.schoolName}` : result.role;
  return 'Escola';
}

export function SearchBar({
  placeholder,
  search,
  contentOnlyAdminHref,
}: {
  placeholder: string;
  search: (query: string) => Promise<Result[]>;
  /** Admin edita conteúdo em rota própria; o aluno abre o leitor direto. */
  contentOnlyAdminHref?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const [runSearch] = useDebouncedCallback((value: string) => {
    startTransition(async () => {
      const found = await search(value);
      setResults(found);
    });
  }, 300);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function onChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    runSearch(value);
  }

  const href = (result: Result) =>
    contentOnlyAdminHref && result.type === 'content'
      ? (`/admin/conteudo/${result.id}` as Route)
      : resultHref(result);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="border-border bg-surface-2 text-text placeholder:text-subtle focus-visible:ring-brand/30 h-10 w-full rounded-full border-none pr-9 pl-9 text-sm outline-none focus-visible:ring-2"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            aria-label="Limpar busca"
            className="text-subtle hover:text-text absolute top-1/2 right-2.5 grid size-5 -translate-y-1/2 place-items-center"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="border-border bg-surface absolute top-full left-0 z-50 mt-2 max-h-96 w-full min-w-[280px] overflow-y-auto rounded-lg border shadow-lg">
          {pending ? (
            <div className="text-muted flex items-center justify-center gap-2 p-4 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="text-muted p-4 text-sm">Nada encontrado para &quot;{query}&quot;.</p>
          ) : (
            <ul className="divide-border divide-y">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link
                    href={href(result)}
                    onClick={() => setOpen(false)}
                    className="hover:bg-surface-2 flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="bg-brand-soft text-brand-text grid size-8 shrink-0 place-items-center rounded-full">
                      <ResultIcon result={result} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{resultLabel(result)}</span>
                      <span className="text-subtle block truncate text-xs">{resultHint(result)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
