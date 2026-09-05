'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FormFeedback, Select } from './form-parts';
import { setPersonRole, type AdminState } from '../server/actions';
import type { AdminPerson } from '../server/queries';

const INITIAL: AdminState = { status: 'idle' };

const ROLE_LABEL: Record<string, string> = {
  student: 'Aluno',
  school_admin: 'Admin da escola',
  admin: 'Admin geral',
};

export function PeopleManager({
  people,
  schools,
  currentUserId,
  search,
}: {
  people: AdminPerson[];
  schools: { id: string; name: string }[];
  currentUserId: string;
  search: string;
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
                  person.role === 'student'
                    ? 'bg-surface-2 text-muted'
                    : 'bg-brand-soft text-brand-text',
                )}
                aria-hidden
              >
                {person.role === 'student' ? (
                  <User className="size-4" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {person.fullName ?? 'Sem nome'}
                  {isSelf && <span className="text-subtle ml-2 text-xs font-normal">você</span>}
                </span>
                <span className="text-muted text-xs">
                  {ROLE_LABEL[person.role] ?? person.role}
                  {person.schoolName ? ` · ${person.schoolName}` : ''}
                </span>
              </span>

              <form action={formAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="userId" value={person.id} />
                <Select
                  name="role"
                  defaultValue={person.role}
                  className="w-auto"
                  aria-label={`Papel de ${person.fullName ?? 'pessoa'}`}
                  disabled={isSelf}
                >
                  <option value="student">Aluno</option>
                  <option value="school_admin">Admin da escola</option>
                  <option value="admin">Admin geral</option>
                </Select>
                <Select
                  name="schoolId"
                  defaultValue={person.schoolId ?? ''}
                  className="w-auto"
                  aria-label="Escola"
                  disabled={isSelf}
                >
                  <option value="">Sem escola</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="secondary" disabled={isSelf}>
                  Aplicar
                </Button>
              </form>
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
