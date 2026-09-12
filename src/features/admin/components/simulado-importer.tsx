'use client';

import { useActionState, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  Image as ImageIcon,
  Layers,
  PenLine,
  Table2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Field, FormFeedback, Select, SubmitButton, Textarea } from './form-parts';
import { DIFFICULTIES } from '../lib/labels';
import { parseSimuladoCode, type ImportResult } from '../lib/simulado-import';
import { importSimulado, type AdminState } from '../server/actions';
import { AiExamGenerator } from './ai-exam-generator';
import type { ResourceFormOptions } from '../server/queries';
import type { ExamAsset } from '@/types/simulado';

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

const V2_PLACEHOLDER = `{
  "simulation": {
    "schemaVersion": "2.0",
    "code": "ANGLO-9ANO-001",
    "title": "Simulado Anglo — 9º ano",
    "grade": 9,
    "examStyle": "anglo",
    "mode": "exam",
    "settings": { "showTimer": true, "timeLimitMinutes": 150 },
    "resources": [
      {
        "id": "TXT01",
        "type": "text",
        "title": "Texto I",
        "content": "Texto-base utilizado nas questões 1 e 2.",
        "presentation": "collapsible"
      },
      {
        "id": "GRAPH01",
        "type": "chart",
        "title": "Distribuição populacional",
        "chart": {
          "kind": "bar",
          "labels": ["Região A", "Região B", "Região C"],
          "datasets": [{ "label": "População", "data": [32, 48, 20] }]
        }
      }
    ],
    "sections": [
      { "id": "PORT", "title": "Língua Portuguesa", "subject": "Português", "type": "objective", "questionIds": ["Q1", "Q2"] }
    ],
    "questions": [
      {
        "id": "Q1",
        "groupId": "G1",
        "subject": "Português",
        "book": 3,
        "module": 27,
        "topic": "Tipos textuais",
        "difficulty": "anglo",
        "statement": "Considerando o Texto I, assinale a alternativa correta.",
        "resourceRefs": ["TXT01"],
        "alternatives": { "A": "Alternativa A", "B": "Alternativa B", "C": "Alternativa C", "D": "Alternativa D", "E": "Alternativa E" },
        "correctAlternative": "C",
        "explanation": "A alternativa C interpreta corretamente o texto.",
        "skills": ["interpretação"],
        "estimatedTimeSeconds": 120
      },
      {
        "id": "Q2",
        "groupId": "G1",
        "subject": "Português",
        "statement": "Com base no gráfico, a região com maior população é",
        "resourceRefs": ["GRAPH01"],
        "alternatives": { "A": "Região A", "B": "Região B", "C": "Região C", "D": "Nenhuma" },
        "correctAlternative": "B"
      }
    ],
    "writingTasks": [
      {
        "id": "R1",
        "title": "Produção de Texto",
        "genre": "artigo_de_opiniao",
        "theme": "Tema de exemplo",
        "prompt": "Com base nos textos motivadores, produza um artigo de opinião.",
        "resourceRefs": ["TXT01", "GRAPH01"],
        "instructions": ["Respeite o gênero solicitado.", "Apresente posicionamento claro."],
        "minWords": 180,
        "maxWords": 450,
        "evaluationCriteria": [
          { "id": "C1", "name": "Adequação ao tema", "maxScore": 2 },
          { "id": "C2", "name": "Argumentação", "maxScore": 2 }
        ]
      }
    ]
  }
}`;

const ASSET_ICON: Record<ExamAsset['type'], typeof BookOpen> = {
  text: BookOpen,
  image: ImageIcon,
  infographic: ImageIcon,
  diagram: ImageIcon,
  chart: BarChart3,
  table: Table2,
};

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
 *
 * `schemaVersion: "2.0"` no JSON colado liga a prévia rica (recursos, seções,
 * redação) — sem isso, é exatamente a tela de sempre.
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
                esse campo aqui só confundiria quem está importando um. Um
                "settings.timeLimitMinutes" no JSON v2 sobrescreve isto. */}
            {kind === 'simulado' && (
              <Field label="Tempo de prova" hint="em segundos · 0 = sem limite (ou defina no JSON)">
                <Input name="timeLimitSeconds" type="number" min={0} defaultValue={1200} />
              </Field>
            )}
          </div>

          <Field label="Etiquetas" hint="separadas por vírgula, além do código">
            <Input name="tags" placeholder="enem, revisão" />
          </Field>
        </section>

        <section className="border-border bg-surface space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-text text-sm font-medium">Código</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCode(V2_PLACEHOLDER)}
                className="text-brand hover:underline text-xs font-medium whitespace-nowrap"
              >
                Ver exemplo Anglo (v2)
              </button>
              <AiExamGenerator onGenerated={setCode} />
            </div>
          </div>
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
        <ImportSummary hasCode={Boolean(code.trim())} result={result} />

        {result.schemaVersion === '2.0' && !result.parseError && (
          <V2Overview result={result} />
        )}

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
                    {(question.groupId || question.subjectName || question.resourceRefs.length > 0) && (
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        {question.groupId && (
                          <span className="bg-surface-2 text-subtle rounded-full px-2 py-0.5 text-[11px] font-medium">
                            Grupo {question.groupId}
                          </span>
                        )}
                        {question.subjectName && (
                          <span className="bg-brand-soft text-brand-text rounded-full px-2 py-0.5 text-[11px] font-medium">
                            {question.subjectName}
                          </span>
                        )}
                        {question.resourceRefs.map((ref) => (
                          <span
                            key={ref}
                            className="border-border text-subtle rounded-full border px-2 py-0.5 text-[11px]"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}

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

function ImportSummary({ hasCode, result }: { hasCode: boolean; result: ImportResult }) {
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

  if (result.parseError) {
    return (
      <div className="border-danger/40 bg-danger-soft text-danger flex items-start gap-2.5 rounded-lg border p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-sm leading-relaxed">{result.parseError}</p>
      </div>
    );
  }

  const { counts } = result;
  const items: { ok: boolean; label: string }[] = [
    { ok: true, label: `${counts.questions} questões encontradas` },
    { ok: true, label: `${counts.statements} enunciados` },
    { ok: true, label: `${counts.alternatives} alternativas` },
    { ok: true, label: `${counts.answerKeys} gabaritos` },
  ];
  if (result.assets.length > 0) items.push({ ok: true, label: `${result.assets.length} recursos (textos, imagens, gráficos...)` });
  if (result.sections.length > 0) items.push({ ok: true, label: `${result.sections.length} seções` });
  if (result.writingTasks.length > 0) items.push({ ok: true, label: `${result.writingTasks.length} redação(ões)` });
  if (counts.errors > 0) {
    items.push({
      ok: false,
      label: `${counts.errors} questão${counts.errors === 1 ? '' : 'ões'} com erro de estrutura`,
    });
  }
  for (const error of result.simulationErrors) {
    items.push({ ok: false, label: error });
  }

  return (
    <ul className="border-border bg-surface space-y-1.5 rounded-lg border p-4 text-sm">
      {items.map((item, i) => (
        <li
          key={`${item.label}-${i}`}
          className={item.ok ? 'text-success flex items-center gap-2' : 'text-warning flex items-start gap-2'}
        >
          {item.ok ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Resumo do que é exclusivo da v2 — recursos, seções, redação, configurações. */
function V2Overview({ result }: { result: ImportResult }) {
  if (result.assets.length === 0 && result.sections.length === 0 && result.writingTasks.length === 0) {
    return null;
  }

  return (
    <div className="border-border bg-surface space-y-4 rounded-lg border p-4">
      {result.sections.length > 0 && (
        <div>
          <h3 className="text-subtle flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Layers className="size-3.5" aria-hidden />
            Seções da prova
          </h3>
          <ol className="mt-2 space-y-1">
            {result.sections.map((section) => (
              <li key={section.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{section.title}</span>
                {section.subject && <span className="text-subtle text-xs">· {section.subject}</span>}
                <span className="text-subtle text-xs">
                  {section.type === 'writing'
                    ? `${section.writingTaskIds?.length ?? 0} redação(ões)`
                    : `${section.questionIds?.length ?? 0} questões`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.assets.length > 0 && (
        <div>
          <h3 className="text-subtle text-xs font-semibold tracking-wide uppercase">Recursos</h3>
          <ul className="mt-2 space-y-1.5">
            {result.assets.map((asset) => {
              const Icon = ASSET_ICON[asset.type];
              return (
                <li key={asset.id} className="flex items-start gap-2 text-sm">
                  <Icon className="text-subtle mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {asset.title ?? asset.id} <span className="text-subtle font-normal">({asset.id})</span>
                    </p>
                    {asset.type === 'text' && (
                      <p className="text-muted line-clamp-2 text-xs">{asset.content}</p>
                    )}
                    {asset.type === 'table' && (
                      <p className="text-muted text-xs">{asset.headers.join(' · ')}</p>
                    )}
                    {asset.type === 'chart' && (
                      <p className="text-muted text-xs">gráfico de {asset.chart.kind}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {result.writingTasks.length > 0 && (
        <div>
          <h3 className="text-subtle flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <PenLine className="size-3.5" aria-hidden />
            Redação
          </h3>
          {result.writingTasks.map((task) => (
            <div key={task.sourceId} className="mt-2 text-sm">
              <p className="font-medium">{task.title}</p>
              <p className="text-muted text-xs">
                {task.genre ?? 'gênero não informado'}
                {task.minWords && task.maxWords && ` · ${task.minWords}–${task.maxWords} palavras`}
                {task.evaluationCriteria.length > 0 && ` · ${task.evaluationCriteria.length} critérios`}
              </p>
              {task.errors.length > 0 && (
                <ul className="text-danger mt-1 space-y-0.5 text-xs">
                  {task.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
