'use client';

import { useActionState, useState } from 'react';
import { Pencil, Plus, School, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field, FormFeedback, SubmitButton } from './form-parts';
import { deleteSchool, saveSchool, type AdminState } from '../server/actions';
import type { AdminSchool } from '../server/queries';

/**
 * Cadastro de escolas.
 *
 * O formulário fica ao lado da lista, não atrás de uma navegação: cadastrar
 * escola é uma tarefa de repetição (uma rede com doze unidades cadastra doze
 * vezes seguidas), e ir e voltar de página doze vezes é o que faz alguém
 * desistir e mandar a lista por mensagem para outra pessoa fazer.
 */

const INITIAL: AdminState = { status: 'idle' };

export function SchoolManager({ schools }: { schools: AdminSchool[] }) {
  const [state, formAction] = useActionState(saveSchool, INITIAL);
  const [editing, setEditing] = useState<AdminSchool | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="order-2 lg:order-1">
        {schools.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <School className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhuma escola cadastrada</p>
            <p className="text-muted mt-1 text-sm">
              Sem escola, todo conteúdo publicado é global — o que já funciona. Cadastre uma escola
              quando quiser um acervo exclusivo dela.
            </p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {schools.map((school) => (
              <li key={school.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{school.name}</p>
                  <p className="text-muted text-xs">
                    {[school.city, school.state].filter(Boolean).join(' · ') || 'sem cidade'} ·{' '}
                    {school.studentCount} {school.studentCount === 1 ? 'aluno' : 'alunos'} ·{' '}
                    {school.resourceCount} {school.resourceCount === 1 ? 'item' : 'itens'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(school)}
                  aria-label={`Editar ${school.name}`}
                  className="text-muted hover:bg-surface-2 hover:text-text grid size-11 shrink-0 place-items-center rounded-md"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>

                <form action={deleteSchool}>
                  <input type="hidden" name="id" value={school.id} />
                  <button
                    type="submit"
                    aria-label={`Excluir ${school.name}`}
                    className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 shrink-0 place-items-center rounded-md"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <form
          action={formAction}
          key={editing?.id ?? 'nova'}
          className="border-border bg-surface space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editing ? 'Editar escola' : 'Nova escola'}</h2>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-muted hover:text-text grid size-11 place-items-center rounded-md"
                aria-label="Cancelar edição"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          {editing && <input type="hidden" name="id" value={editing.id} />}

          <Field label="Nome">
            <Input
              name="name"
              defaultValue={editing?.name ?? ''}
              required
              placeholder="Colégio Santa Cruz"
            />
          </Field>

          <div className="grid grid-cols-[1fr_88px] gap-3">
            <Field label="Cidade">
              <Input name="city" defaultValue={editing?.city ?? ''} placeholder="São Paulo" />
            </Field>
            <Field label="UF">
              <Input
                name="state"
                defaultValue={editing?.state ?? ''}
                maxLength={2}
                placeholder="SP"
              />
            </Field>
          </div>

          <FormFeedback state={state} />

          <SubmitButton>
            {editing ? (
              'Salvar alterações'
            ) : (
              <>
                <Plus aria-hidden />
                Cadastrar
              </>
            )}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
