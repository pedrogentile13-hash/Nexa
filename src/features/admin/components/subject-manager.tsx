'use client';

import { useActionState, useState } from 'react';
import { ChevronDown, Plus, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { SUBJECT_COLOR_TOKENS } from '@/lib/design/subject-colors';
import { Field, FormFeedback, Select, SubmitButton } from './form-parts';
import { AREAS } from '../lib/labels';
import { deleteTopic, saveSubject, saveTopic, type AdminState } from '../server/actions';
import type { AdminSubject } from '../server/queries';

/**
 * Catálogo de matérias e seus assuntos.
 *
 * Uma lista com expansão, não duas telas. O assunto só faz sentido dentro da
 * matéria, e separar as duas em páginas obrigaria a lembrar em qual matéria se
 * estava — que é exatamente o erro que faz "Cinemática" nascer em Biologia.
 */

const INITIAL: AdminState = { status: 'idle' };

export function SubjectManager({
  subjects,
  schools,
  canEditCatalog,
}: {
  subjects: AdminSubject[];
  schools: { id: string; name: string }[];
  canEditCatalog: boolean;
}) {
  const [subjectState, subjectAction] = useActionState(saveSubject, INITIAL);
  const [topicState, topicAction] = useActionState(saveTopic, INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="order-2 space-y-2 lg:order-1">
        {subjects.map((subject) => {
          const open = openId === subject.id;
          return (
            <li
              key={subject.id}
              style={subjectColorVars(subject.defaultColor)}
              className="border-border bg-surface overflow-hidden rounded-lg border"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : subject.id)}
                aria-expanded={open}
                className="hover:bg-surface-2 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--subject-base)' }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {subject.name}
                    {!subject.isActive && (
                      <span className="text-subtle ml-2 text-xs font-normal">(inativa)</span>
                    )}
                  </span>
                  <span className="text-muted text-xs">
                    {subject.topics.length === 0
                      ? 'nenhum assunto'
                      : `${subject.topics.length} ${subject.topics.length === 1 ? 'assunto' : 'assuntos'}`}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'text-muted size-4 shrink-0 transition-transform',
                    open && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>

              {open && (
                <div className="border-border bg-surface-2/50 border-t px-4 py-3">
                  {subject.topics.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {subject.topics.map((topic) => (
                        <li key={topic.id} className="flex items-center gap-2">
                          <Tag className="text-subtle size-3.5 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {topic.name}
                            {topic.schoolId && (
                              <span className="text-subtle ml-2 text-xs">só desta escola</span>
                            )}
                          </span>
                          <form action={deleteTopic}>
                            <input type="hidden" name="id" value={topic.id} />
                            <button
                              type="submit"
                              aria-label={`Excluir ${topic.name}`}
                              className="text-muted hover:text-danger grid size-11 place-items-center rounded-md"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form action={topicAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="subjectId" value={subject.id} />
                    <input
                      type="hidden"
                      name="sortOrder"
                      value={(subject.topics.length + 1) * 10}
                    />
                    <div className="min-w-[180px] flex-1">
                      <Input name="name" placeholder="Novo assunto — ex.: Cinemática" required />
                    </div>
                    {schools.length > 0 && (
                      <Select
                        name="schoolId"
                        defaultValue="global"
                        className="w-auto min-w-[160px]"
                      >
                        <option value="global">Todas as escolas</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    <Button type="submit" variant="secondary">
                      <Plus aria-hidden />
                      Adicionar
                    </Button>
                  </form>
                  <div className="mt-2">
                    <FormFeedback state={topicState} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {canEditCatalog && (
        <div className="order-1 lg:order-2">
          <form
            action={subjectAction}
            className="border-border bg-surface space-y-3 rounded-lg border p-4"
          >
            <h2 className="text-sm font-semibold">Nova matéria</h2>
            <p className="text-muted text-xs">
              Entra no catálogo que todo aluno vê no onboarding, em qualquer escola.
            </p>

            <Field label="Nome">
              <Input name="name" required placeholder="Física" />
            </Field>

            <Field label="Área">
              <Select name="area" defaultValue="ciencias">
                {AREAS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Cor" hint="usada em gráficos e etiquetas">
              <Select name="defaultColor" defaultValue="blue">
                {SUBJECT_COLOR_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Ícone" hint="nome no Lucide">
              <Input name="defaultIcon" defaultValue="book-open" />
            </Field>

            <input type="hidden" name="sortOrder" value={(subjects.length + 1) * 10} />
            <input type="hidden" name="isActive" value="true" />

            <FormFeedback state={subjectState} />
            <SubmitButton>
              <Plus aria-hidden />
              Criar matéria
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
