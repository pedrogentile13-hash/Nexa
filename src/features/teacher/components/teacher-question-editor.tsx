'use client';

import { useActionState, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Field, FormFeedback, Select, SubmitButton, Textarea } from '@/features/admin/components/form-parts';
import { DIFFICULTIES } from '@/features/admin/lib/labels';
import { deleteTeacherQuestion, saveTeacherQuestion, type AdminState } from '../server/actions';

export interface EditableTeacherQuestion {
  id: string;
  position: number;
  statement: string;
  explanation: string | null;
  difficulty: string;
  options: { id: string; position: number; body: string; is_correct: boolean }[];
}

const INITIAL: AdminState = { status: 'idle' };
const EMPTY_OPTIONS = ['', '', '', ''];

export function TeacherQuestionEditor({
  resourceId,
  questions,
}: {
  resourceId: string;
  questions: EditableTeacherQuestion[];
}) {
  const [state, formAction] = useActionState(saveTeacherQuestion, INITIAL);
  const [editing, setEditing] = useState<EditableTeacherQuestion | null>(null);
  const [optionCount, setOptionCount] = useState(4);

  const current = editing;
  const initialOptions = current ? current.options.map((o) => o.body) : EMPTY_OPTIONS;
  const initialCorrect = current ? current.options.findIndex((o) => o.is_correct) : 0;
  const visibleOptions = Array.from(
    { length: Math.max(optionCount, initialOptions.length) },
    (_, index) => initialOptions[index] ?? '',
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
      <div className="order-2 lg:order-1">
        {questions.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <p className="text-sm font-medium">Nenhuma questão ainda</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {questions.map((question) => (
              <li key={question.id} className="border-border bg-surface rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-surface-2 text-muted grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums">
                    {question.position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{question.statement}</p>

                    <ul className="mt-2 space-y-1">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className={cn(
                            'flex items-center gap-2 text-sm',
                            option.is_correct ? 'text-success font-medium' : 'text-muted',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-4 shrink-0 place-items-center rounded-full border',
                              option.is_correct
                                ? 'border-success bg-success text-white'
                                : 'border-border-strong',
                            )}
                            aria-hidden
                          >
                            {option.is_correct && <Check className="size-3" strokeWidth={3} />}
                          </span>
                          {option.body}
                        </li>
                      ))}
                    </ul>

                    {question.explanation && (
                      <p className="text-subtle mt-2 border-l-2 border-current/20 pl-3 text-xs leading-relaxed">
                        {question.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(question);
                        setOptionCount(question.options.length);
                      }}
                      aria-label={`Editar questão ${question.position}`}
                      className="text-muted hover:bg-surface-2 hover:text-text grid size-11 place-items-center rounded-md"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <form action={deleteTeacherQuestion}>
                      <input type="hidden" name="id" value={question.id} />
                      <input type="hidden" name="resourceId" value={resourceId} />
                      <button
                        type="submit"
                        aria-label={`Excluir questão ${question.position}`}
                        className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 place-items-center rounded-md"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <form
          action={formAction}
          key={current?.id ?? 'nova'}
          className="border-border bg-surface sticky top-4 space-y-3 rounded-lg border p-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {current ? `Editar questão ${current.position}` : 'Nova questão'}
            </h2>
            {current && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setOptionCount(4);
                }}
                aria-label="Cancelar edição"
                className="text-muted hover:text-text grid size-11 place-items-center rounded-md"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>

          <input type="hidden" name="resourceId" value={resourceId} />
          {current && <input type="hidden" name="id" value={current.id} />}

          <Field label="Enunciado">
            <Textarea name="statement" rows={3} required defaultValue={current?.statement ?? ''} />
          </Field>

          <fieldset>
            <legend className="text-text mb-1.5 block text-sm font-medium">
              Alternativas <span className="text-subtle font-normal">· marque a correta</span>
            </legend>

            <div className="space-y-2">
              {visibleOptions.map((value, index) => (
                <label key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctIndex"
                    value={index}
                    defaultChecked={index === Math.max(0, initialCorrect)}
                    aria-label={`Alternativa ${index + 1} é a correta`}
                    className="accent-success size-5 shrink-0"
                  />
                  <Input
                    name="option"
                    defaultValue={value}
                    placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                  />
                </label>
              ))}
            </div>

            {optionCount < 6 && (
              <button
                type="button"
                onClick={() => setOptionCount((n) => n + 1)}
                className="text-muted hover:text-text mt-2 flex h-11 items-center gap-1.5 text-sm"
              >
                <Plus className="size-4" aria-hidden />
                Mais uma alternativa
              </button>
            )}
          </fieldset>

          <Field label="Explicação" hint="aparece depois de responder">
            <Textarea name="explanation" rows={3} defaultValue={current?.explanation ?? ''} />
          </Field>

          <Field label="Dificuldade">
            <Select name="difficulty" defaultValue={current?.difficulty ?? 'medio'}>
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>

          <FormFeedback state={state} />
          <SubmitButton>{current ? 'Salvar questão' : 'Adicionar questão'}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
