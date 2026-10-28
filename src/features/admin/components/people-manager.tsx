'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Search, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FormFeedback, Select } from './form-parts';
import { setPersonRole, type AdminState } from '../server/actions';
import type { AdminPerson } from '../server/queries';
import { PLATFORM_ROLE_LABEL } from '@/lib/school-roles';

const INITIAL: AdminState = { status: 'idle' };



export function PeopleManager({
  people,
  currentUserId,
  search,
  readOnly = false,
}: {
  people: AdminPerson[];
  currentUserId: string;
  search: string;
  /** Admin de escola vê a lista pra chegar no relatório, mas não edita papel/escola. */
  readOnly?: boolean;
}) {
  const [state, formAction] = useActionState(setPersonRole, INITIAL);
  const router = useRouter();

  return (
    <div className="space-y-4">
      <form
        className="relative max-w-sm"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q');
          const q = typeof value === 'string' ? value.trim() : '';
          router.push(q ? `/admin/usuarios?q=${encodeURIComponent(q)}` : '/admin/usuarios');
        }}
      >
        <Search
          className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input name="q" defaultValue={search} placeholder="Buscar pelo nome" className="pl-9" />
      </form>

      <FormFeedback state={state} />

      <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
        {people.map((person) => {
          const isSelf = person.id === currentUserId;
          return (
            <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full',
                  person.platformRole === 'student'
                    ? 'bg-surface-2 text-muted'
                    : 'bg-brand-soft text-brand-text',
                )}
                aria-hidden
              >
                {person.platformRole === 'student' ? (
                  <User className="size-4" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <Link
                  href={`/admin/usuarios/${person.id}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {person.fullName ?? 'Sem nome'}
                  {isSelf && <span className="text-subtle ml-2 text-xs font-normal">você</span>}
                </Link>
                <span className="text-muted text-xs">
                  {PLATFORM_ROLE_LABEL[person.platformRole]}
                  {person.schoolName ? ` · ${person.schoolName}` : ''}
                </span>
              </span>

              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/usuarios/${person.id}`}>
                  <BarChart3 aria-hidden />
                  Ver relatório
                </Link>
              </Button>

              {!readOnly && person.platformRole === 'managed' && (
                <span className="text-subtle text-xs">Gerenciado pela escola</span>
              )}

              {!readOnly && person.platformRole !== 'managed' && (
                <form action={formAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="userId" value={person.id} />
                  {/* Rebaixar o próprio papel é bloqueado no servidor (deixaria o
                      painel sem dono) — o seletor fica travado para não parecer
                      que dá pra mudar e falhar só ao aplicar. */}
                  {isSelf && <input type="hidden" name="role" value={person.platformRole} />}
                  <Select
                    name={isSelf ? undefined : 'role'}
                    defaultValue={person.platformRole}
                    className="w-auto"
                    aria-label={`Papel de ${person.fullName ?? 'pessoa'}`}
                    disabled={isSelf}
                  >
                    <option value="student">Aluno</option>
                    <option value="admin_limited">Admin (funções limitadas)</option>
                    <option value="admin">Admin geral</option>
                  </Select>
                  <Button type="submit" variant="secondary" disabled={isSelf}>
                    Aplicar
                  </Button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {people.length === 0 && (
        <div className="border-border bg-surface rounded-lg border p-8 text-center">
          <p className="text-sm font-medium">Ninguém com esse nome</p>
        </div>
      )}
    </div>
  );
}
