'use client';

import { useActionState, useEffect, useState } from 'react';
import { BarChart3, Bell, Check, Copy, GraduationCap, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Field, Select, SubmitButton, Textarea } from './form-parts';
import { DIFFICULTIES } from '../lib/labels';
import {
  draftClassNotice,
  generateClassSummary,
  generateStudentPlan,
  searchStudentsAction,
  suggestQuestionIdeas,
  type AiAssistantState,
} from '../server/ai-assistant';
import type { NexaAiOptions, NexaAiStudentOption } from '../server/nexaai-queries';

const INITIAL: AiAssistantState = { status: 'idle' };

type FunctionKey = 'class-summary' | 'student-plan' | 'notice' | 'question-ideas';

const FUNCTIONS: {
  key: FunctionKey;
  Icon: typeof BarChart3;
  title: string;
  description: string;
}[] = [
  {
    key: 'class-summary',
    Icon: BarChart3,
    title: 'Resumo de turma/matéria',
    description: 'Como a turma está indo e quais assuntos estão mais fracos.',
  },
  {
    key: 'student-plan',
    Icon: GraduationCap,
    title: 'Plano de estudo de um aluno',
    description: 'Sugestão de foco a partir do desempenho real dele.',
  },
  {
    key: 'notice',
    Icon: Bell,
    title: 'Rascunho de aviso',
    description: 'Escreva a ideia solta — a IA devolve o texto pronto.',
  },
  {
    key: 'question-ideas',
    Icon: Lightbulb,
    title: 'Ideias de questão',
    description: 'Abordagens pra você escrever a questão à mão depois.',
  },
];

/**
 * Painel de funções rápidas da NexaAI — exclusivo de `/admin/nexaai` e
 * `/professor/nexaai`. Nenhuma das quatro funções escreve no banco: cada
 * uma lê algo que já existe (desempenho real) ou só gera texto solto, e o
 * resultado fica numa caixa com "Copiar" pra colar em outro lugar do
 * painel — nunca é publicado sozinho.
 */
export function NexaaiPanel({ options }: { options: NexaAiOptions }) {
  const [active, setActive] = useState<FunctionKey | null>(null);

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {FUNCTIONS.map((fn) => (
          <li key={fn.key}>
            <button
              type="button"
              onClick={() => setActive((current) => (current === fn.key ? null : fn.key))}
              aria-pressed={active === fn.key}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                active === fn.key
                  ? 'border-brand bg-brand-soft'
                  : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
                <fn.Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{fn.title}</span>
                <span className="text-muted block text-xs leading-relaxed">{fn.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active === 'class-summary' && <ClassSummaryForm options={options} />}
      {active === 'student-plan' && <StudentPlanForm />}
      {active === 'notice' && <NoticeForm />}
      {active === 'question-ideas' && <QuestionIdeasForm />}
    </div>
  );
}

function ResultBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="border-border bg-surface-2/60 mt-3 rounded-lg border p-3">
      <p className="text-text text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard
            .writeText(text)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {
              // Sem permissão de clipboard — o texto já está visível pra selecionar à mão.
            });
        }}
        className="text-brand-text mt-2 flex items-center gap-1.5 text-xs font-medium hover:underline"
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

function ClassSummaryForm({ options }: { options: NexaAiOptions }) {
  const [state, formAction] = useActionState(generateClassSummary, INITIAL);

  return (
    <div className="border-border bg-surface space-y-3 rounded-xl border p-4">
      <form action={formAction} className="space-y-3">
        {options.schools.length > 0 && (
          <Field label="Escola">
            <Select name="schoolId" required defaultValue="">
              <option value="" disabled>
                Escolha a escola
              </option>
              {options.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Matéria">
          <Select name="subjectCatalogId" required defaultValue="">
            <option value="" disabled>
              Escolha a matéria
            </option>
            {options.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Turma" hint="opcional — considera todas se não escolher">
          <Select name="classId" defaultValue="">
            <option value="">Todas as turmas</option>
            {options.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.schoolName ? ` · ${c.schoolName}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        <SubmitButton>Gerar resumo</SubmitButton>
      </form>
      {state.status === 'ok' && <ResultBox text={state.text} />}
    </div>
  );
}

function StudentPlanForm() {
  const [state, formAction] = useActionState(generateStudentPlan, INITIAL);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NexaAiStudentOption[]>([]);
  const [selected, setSelected] = useState<NexaAiStudentOption | null>(null);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchStudentsAction(query).then((r) => {
        if (!cancelled) setResults(r);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, selected]);

  return (
    <div className="border-border bg-surface space-y-3 rounded-xl border p-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="studentId" value={selected?.id ?? ''} />
        <Field label="Aluno">
          {selected ? (
            <div className="bg-surface-2 flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm">
              <span>
                {selected.fullName ?? 'Sem nome'}{' '}
                <span className="text-subtle">· {selected.subtitle}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setQuery('');
                }}
                className="text-brand-text text-xs font-medium hover:underline"
              >
                Trocar
              </button>
            </div>
          ) : (
            <>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque pelo nome do aluno"
                autoComplete="off"
              />
              {results.length > 0 && (
                <ul className="border-border bg-surface mt-1.5 max-h-48 overflow-y-auto rounded-md border">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(r);
                          setResults([]);
                        }}
                        className="hover:bg-surface-2 flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                      >
                        <span>{r.fullName ?? 'Sem nome'}</span>
                        <span className="text-subtle text-xs">{r.subtitle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Field>
        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        <SubmitButton disabled={!selected}>Gerar plano</SubmitButton>
      </form>
      {state.status === 'ok' && <ResultBox text={state.text} />}
    </div>
  );
}

function NoticeForm() {
  const [state, formAction] = useActionState(draftClassNotice, INITIAL);

  return (
    <div className="border-border bg-surface space-y-3 rounded-xl border p-4">
      <form action={formAction} className="space-y-3">
        <Field label="Ideia do aviso" hint="escreva solto, a IA organiza">
          <Textarea name="idea" rows={3} required placeholder="lembrar da prova de sexta, levar calculadora" />
        </Field>
        <Field label="Tom">
          <Select name="tone" defaultValue="neutro">
            <option value="neutro">Neutro</option>
            <option value="formal">Formal</option>
            <option value="informal">Leve/informal</option>
          </Select>
        </Field>
        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        <SubmitButton>Gerar rascunho</SubmitButton>
      </form>
      {state.status === 'ok' && <ResultBox text={state.text} />}
    </div>
  );
}

function QuestionIdeasForm() {
  const [state, formAction] = useActionState(suggestQuestionIdeas, INITIAL);

  return (
    <div className="border-border bg-surface space-y-3 rounded-xl border p-4">
      <form action={formAction} className="space-y-3">
        <Field label="Matéria">
          <Input name="subject" required placeholder="Matemática" />
        </Field>
        <Field label="Tema" hint="opcional">
          <Input name="topic" placeholder="Equações do 2º grau" />
        </Field>
        <Field label="Dificuldade">
          <Select name="difficulty" defaultValue="medio">
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        {state.status === 'error' && <p className="text-danger text-sm">{state.message}</p>}
        <SubmitButton>Gerar ideias</SubmitButton>
      </form>
      {state.status === 'ok' && <ResultBox text={state.text} />}
    </div>
  );
}
