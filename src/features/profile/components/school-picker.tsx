'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, School, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  createAndJoinSchool,
  joinSchool,
  searchSchools,
  type SchoolOption,
} from '../server/actions';

export interface CurrentSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

/**
 * Vínculo com escola — antes só um admin conseguia fazer isso (painel
 * `/admin/usuarios`); agora qualquer aluno vincula a própria conta direto do
 * perfil. `school_id` já podia ser escrito pela própria RLS
 * (`profiles_update_own`), então isso é só a primeira UI que oferece isso.
 */
export function SchoolPicker({ currentSchool }: { currentSchool: CurrentSchool | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SchoolOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [runSearch] = useDebouncedCallback((value: string) => {
    setSearching(true);
    searchSchools(value).then((found) => {
      setResults(found);
      setSearching(false);
    });
  }, 300);

  function onQueryChange(value: string) {
    setQuery(value);
    setMessage(null);
    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    runSearch(value);
  }

  function handleJoin(schoolId: string) {
    startTransition(async () => {
      const result = await joinSchool(schoolId);
      if (!result.ok) {
        setMessage(result.message ?? 'Não consegui vincular essa escola.');
        return;
      }
      setEditing(false);
      setQuery('');
      setResults([]);
      router.refresh();
    });
  }

  function handleCreate() {
    const name = query.trim();
    if (name.length < 2) return;
    startTransition(async () => {
      const result = await createAndJoinSchool(name);
      if (!result.ok) {
        setMessage(result.message ?? 'Não consegui cadastrar essa escola.');
        return;
      }
      setEditing(false);
      setQuery('');
      setResults([]);
      router.refresh();
    });
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
          <School className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {currentSchool ? (
            <>
              <p className="truncate text-sm font-medium">{currentSchool.name}</p>
              <p className="text-muted truncate text-xs">
                {[currentSchool.city, currentSchool.state].filter(Boolean).join(' · ') ||
                  'Escola vinculada'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Nenhuma escola vinculada</p>
              <p className="text-muted text-xs">Vincule a sua pra aparecer no ranking da turma.</p>
            </>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
          {currentSchool ? 'Trocar' : 'Vincular'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Nome da sua escola"
          aria-label="Buscar escola"
          className="border-border bg-surface text-text placeholder:text-subtle focus-visible:border-brand focus-visible:ring-brand/25 h-11 w-full rounded-md border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
        />
      </div>

      {message && <p className="text-danger text-xs">{message}</p>}

      {query.trim().length >= 2 && (
        <ul className="border-border bg-surface divide-border divide-y rounded-lg border">
          {searching ? (
            <li className="text-muted flex items-center gap-2 p-3 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Buscando…
            </li>
          ) : (
            <>
              {results.map((s) => (
                <li key={s.id} className="flex items-center gap-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-muted truncate text-xs">
                      {[s.city, s.state].filter(Boolean).join(' · ') || 'Sem cidade cadastrada'}
                    </p>
                  </div>
                  {s.isVerified && <Badge variant="brand">Verificada</Badge>}
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleJoin(s.id)}
                  >
                    Entrar
                  </Button>
                </li>
              ))}
              {results.length === 0 && (
                <li className="text-muted p-3 text-sm">Nenhuma escola encontrada com esse nome.</li>
              )}
              {!exactMatch && (
                <li className="p-2.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleCreate}
                    className="text-brand text-sm font-medium hover:underline disabled:opacity-50"
                  >
                    Não achei — cadastrar &quot;{query.trim()}&quot;
                  </button>
                </li>
              )}
            </>
          )}
        </ul>
      )}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          setEditing(false);
          setQuery('');
          setResults([]);
          setMessage(null);
        }}
      >
        Cancelar
      </Button>
    </div>
  );
}
