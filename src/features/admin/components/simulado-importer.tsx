'use client';

import { useActionState, useMemo, useState } from 'react';
import { AlertTriangle, Check, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Field, FormFeedback, Select, SubmitButton, Textarea } from './form-parts';
import { DIFFICULTIES } from '../lib/labels';
import { parseSimuladoCode } from '../lib/simulado-import';
import { importSimulado, type AdminState } from '../server/actions';
import type { ResourceFormOptions } from '../server/queries';

const INITIAL: AdminState = { status: 'idle' };

const KINDS = [
  { value: 'simulado', label: 'Simulado' },
  { value: 'quiz', label: 'Quiz' },
] as const;
type ImportKind = (typeof KINDS)[number]['value'];

const PLACEHOLDER = `{
  "simulation": {
    "code": "NEXA-SIM-MAT-001",
    "title": "Simulado de Matemática",
    "description": "Equações e funções",
    "questions": [
      {
        "id": 1,
        "statement": "Qual é o resultado da equação 2x + 4 = 10?",
        "alternatives": { "A": "2", "B": "3", "C": "4", "D": "5" },
        "correctAlternative": "B",
        "topic": "Equações de primeiro grau",
        "difficulty": "easy"
      }
    ]
  }
}`;

/**
 * Importar quiz ou simulado por código.
 *
 * O mesmo formato de JSON serve para os dois — o que muda é só o `kind`
 * gravado no recurso e o cronômetro, que só faz sentido pra simulado (quiz
 * nunca teve essa noção em nenhuma outra tela).
 *
 * A validação roda no CLIENTE a cada tecla — `parseSimuladoCode` é puro, sem
 * banco, então não há razão para esperar uma ida ao servidor só para saber se
 * falta uma alternativa correta. O servidor revalida do zero antes de gravar
 * (ver `importSimulado`); o que roda aqui é só a prévia.
 */
export function SimuladoImporter({
  options,
  canChooseSchool,
}: {
  options: ResourceFormOptions;
  canChooseSchool: boolean;
}) {
  const [state, formAction] = useActionState(importSimulado, INITIAL);
  const [kind, setKind] = useState<ImportKind>('simulado');
  const [code, setCode] = useState('');
  const [subjectId, setSubjectId] = useState(options.subjects[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const result = useMemo(() => parseSimuladoCode(code), [code]);
  const topics = options.topics.filter((t) => t.subjectId === subjectId);

  function applyParsedMetadata() {
    if (result.simulationTitle && !title) setTitle(result.simulationTitle);
    if (result.simulationDescription && !description) setDescription(result.simulationDescription);
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <section className="border-border bg-surface space-y-4 rounded-lg border p-4">
          <Field label="Formato">
            <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value as ImportKind)}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Matéria">
              <Select
                name="subjectId"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                {options.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assunto" hint="opcional">
              <Select name="topicId" defaultValue="">
                <option value="">Sem assunto</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {canChooseSchool && (
            <Field label="Quem enxerga">
              <Select name="schoolId" defaultValue="global">
                <option value="global">Todas as escolas</option>
                {options.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    Só {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Título">
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={kind === 'quiz' ? 'Quiz de Matemática' : 'Simulado de Matemática'}
            />
          </Field>

          <Field label="Descrição" hint="opcional">
            <Textarea
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Equações e funções"
            />
          </Field>

          <div className={cn('grid gap-4', kind === 'simulado' && 'sm:grid-cols-2')}>
            <Field label="Dificuldade">
              <Select name="difficulty" defaultValue="medio">
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            {/* Quiz não tem cronômetro em nenhuma outra tela do app — pedir
                esse campo aqui só confundiria quem está importando um. */}
            {kind === 'simulado' && (
              <Field label="Tempo de prova" hint="em segundos · 0 = sem limite">
                <Input name="timeLimitSeconds" type="number" min={0} defaultValue={1200} />
              </Field>
            )}
          </div>

          <Field label="Etiquetas" hint="separadas por vírgula, além do código">
            <Input name="tags" placeholder="enem, revisão" />
          </Field>
        </section>

        <section className="border-border bg-surface space-y-3 rounded-lg border p-4">
          <Field label="Código" hint="cole o JSON estruturado">
            <Textarea
              name="code"
              rows={14}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={applyParsedMetadata}
              className="font-mono text-xs leading-relaxed"
              placeholder={PLACEHOLDER}
              required
            />
          </Field>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton disabled={!result.ok}>
            {!code.trim()
              ? 'Cole o código para continuar'
              : result.ok
                ? `Publicar ${kind}`
                : 'Corrija os erros para publicar'}
          </SubmitButton>
          <FormFeedback state={state} />
        </div>
      </div>

      {/* Prévia ------------------------------------------------------------ */}
      <div className="space-y-3">
        <ImportSummary
          hasCode={Boolean(code.trim())}
          parseError={result.parseError}
          counts={result.counts}
        />

        {!result.parseError && result.questions.length > 0 && (
          <ol className="space-y-3">
            {result.questions.map((question) => (
              <li
                key={`${question.sourceId}-${question.index}`}
                className={
                  question.errors.length > 0
                    ? 'border-danger/40 bg-danger-soft rounded-lg border p-4'
                    : 'border-border bg-surface rounded-lg border p-4'
                }
              >
                <div className="flex items-start gap-2">
                  <span className="bg-surface-2 text-muted grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums">
                    {question.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{question.statement || '(sem enunciado)'}</p>

                    {question.errors.length > 0 ? (
                      <ul className="text-danger mt-2 space-y-1 text-xs">
                        {question.errors.map((error, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <span>
                              Questão {question.index} — {error}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {question.options.map((option) => (
                          <li
                            key={option.key}
                            className={
                              option.key === question.correctKey
                                ? 'bg-success-soft text-success flex items-center gap-2 rounded px-2 py-1 text-xs font-medium'
                                : 'text-muted flex items-center gap-2 px-2 py-1 text-xs'
                            }
                          >
                            {option.key === question.correctKey ? (
                              <Check className="size-3.5 shrink-0" aria-hidden />
                            ) : (
                              <span className="w-3.5 shrink-0" />
                            )}
                            <span className="font-semibold">{option.key}.</span> {option.text}
                          </li>
                        ))}
                      </ul>
                    )}

                    {question.topicName && !question.errors.length && (
                      <p className="text-subtle mt-1.5 text-xs">
                        {question.topicName} · {DIFFICULTIES.find((d) => d.value === question.difficulty)?.label}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </form>
  );
}

function ImportSummary({
  hasCode,
  parseError,
  counts,
}: {
  hasCode: boolean;
  parseError: string | null;
  counts: { questions: number; statements: number; alternatives: number; answerKeys: number; errors: number };
}) {
  if (!hasCode) {
    return (
      <div className="border-border bg-surface rounded-lg border p-8 text-center">
        <ClipboardList className="text-subtle mx-auto mb-2 size-6" aria-hidden />
        <p className="text-sm font-medium">Cole o código do simulado</p>
        <p className="text-muted mt-1 text-sm">
          A prévia aparece aqui assim que o JSON tiver pelo menos uma questão.
        </p>
      </div>
    );
  }

  if (parseError) {
    return (
      <div className="border-danger/40 bg-danger-soft text-danger flex items-start gap-2.5 rounded-lg border p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-sm leading-relaxed">{parseError}</p>
      </div>
    );
  }

  const items: { ok: boolean; label: string }[] = [
    { ok: true, label: `${counts.questions} questões encontradas` },
    { ok: true, label: `${counts.statements} enunciados` },
    { ok: true, label: `${counts.alternatives} alternativas` },
    { ok: true, label: `${counts.answerKeys} gabaritos` },
  ];
  if (counts.errors > 0) {
    items.push({
      ok: false,
      label: `${counts.errors} questão${counts.errors === 1 ? '' : 'ões'} com erro de estrutura`,
    });
  }

  return (
    <ul className="border-border bg-surface space-y-1.5 rounded-lg border p-4 text-sm">
      {items.map((item) => (
        <li
          key={item.label}
          className={item.ok ? 'text-success flex items-center gap-2' : 'text-warning flex items-center gap-2'}
        >
          {item.ok ? (
            <Check className="size-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
