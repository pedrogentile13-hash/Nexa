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
  readOnly = false,
}: {
  people: AdminPerson[];
  schools: { id: string; name: string }[];
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
                <Link
                  href={`/admin/usuarios/${person.id}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {person.fullName ?? 'Sem nome'}
                  {isSelf && <span className="text-subtle ml-2 text-xs font-normal">você</span>}
                </Link>
                <span className="text-muted text-xs">
                  {ROLE_LABEL[person.role] ?? person.role}
                  {person.schoolName ? ` · ${person.schoolName}` : ''}
                </span>
              </span>

              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/usuarios/${person.id}`}>
                  <BarChart3 aria-hidden />
                  Ver relatório
                </Link>
              </Button>

              {!readOnly && (
                <form action={formAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="userId" value={person.id} />
                  {/* Rebaixar o próprio papel é bloqueado no servidor (deixaria o
                      painel sem dono) — o seletor fica travado no papel atual pra
                      não parecer que dá pra mudar e falhar só ao aplicar. Mas
                      escola é independente disso: nada impede o próprio admin de
                      se vincular a uma escola, então esse campo (e o botão) não
                      têm por que ficar bloqueados junto. */}
                  {isSelf && <input type="hidden" name="role" value={person.role} />}
                  <Select
                    name={isSelf ? undefined : 'role'}
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
                  >
                    <option value="">Sem escola</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="secondary">
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
