'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { ClipboardList, FileText, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveResource, type AdminState } from '@/features/admin/server/actions';
import { deletePlan, generatePlanSummary, savePlan, type PlanState } from '../server/actions';
import type { PlanSummary } from '../server/queries';

const INITIAL_PLAN: PlanState = { status: 'idle' };
const INITIAL_SAVE: AdminState = { status: 'idle' };

function Submit({ children, pendingLabel }: { children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-brand-fg inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/**
 * Planejamentos do professor — a fonte da IA.
 *
 * A mensagem de fundo: a IA só escreve o que ESTÁ aqui. Por isso o formulário
 * pede o conteúdo de verdade (tópicos, textos-base, o que cobrar), e cada
 * resultado sai como rascunho para o professor revisar antes de qualquer aluno ver.
 */
export function PlansManager({
  plans,
  subjects,
}: {
  plans: PlanSummary[];
  subjects: { id: string; name: string }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="order-2 space-y-3 lg:order-1">
        {plans.length === 0 ? (
          <div className="border-border bg-surface rounded-3xl border p-10 shadow-sm text-center">
            <ClipboardList className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum planejamento ainda</p>
            <p className="text-muted mt-1 text-sm">
              Cole o que você vai ensinar num bimestre ou numa aula. A IA cria resumo e simulado a partir disso — e só disso.
            </p>
          </div>
        ) : (
          plans.map((p) => <PlanCard key={p.id} plan={p} subjects={subjects} />)
        )}
      </div>

      <div className="order-1 lg:order-2">
        <NewPlanForm />
      </div>
    </div>
  );
}

function NewPlanForm() {
  const [state, action] = useActionState(savePlan, INITIAL_PLAN);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === 'saved') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="border-border bg-surface space-y-3 rounded-3xl border p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="text-base font-semibold tracking-tight">Novo planejamento</h2>
      <div>
        <Label htmlFor="plan-title">Título</Label>
        <Input id="plan-title" name="title" required maxLength={160} placeholder="2º bimestre — Revolução Francesa" />
      </div>
      <div>
        <Label htmlFor="plan-content">Conteúdo</Label>
        <textarea
          id="plan-content"
          name="content"
          required
          minLength={20}
          maxLength={20000}
          rows={10}
          placeholder={'Cole aqui os tópicos, textos-base e o que você pretende cobrar.\n\nEx.: Causas — crise financeira, desigualdade entre os três estados, iluminismo. Fases — assembleia, convenção, diretório…'}
          className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-2xl border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <p className="text-subtle mt-1 text-xs">Até 20.000 caracteres. Quanto mais fiel ao que você ensina, melhor sai o material.</p>
      </div>
      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
      )}
      {state.status === 'saved' && <p className="text-success text-sm">Planejamento salvo.</p>}
      <Submit>
        <Plus className="size-4" aria-hidden />
        Salvar planejamento
      </Submit>
    </form>
  );
}

function PlanCard({ plan, subjects }: { plan: PlanSummary; subjects: { id: string; name: string }[] }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const r = await generatePlanSummary(plan.id);
      if (r.ok) setSummary(r.markdown);
      else setError(r.message);
    });
  }

  return (
    <article className="border-border bg-surface rounded-3xl border p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight">{plan.title}</h3>
          <p className="text-muted mt-1 line-clamp-3 text-sm whitespace-pre-wrap">{plan.content}</p>
          <p className="text-subtle mt-1 text-xs">{plan.content.length.toLocaleString('pt-BR')} caracteres</p>
        </div>
        <form action={deletePlan}>
          <input type="hidden" name="id" value={plan.id} />
          <button
            type="submit"
            aria-label={`Excluir ${plan.title}`}
            className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 place-items-center rounded-full"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </form>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/professor/conteudo/importar-simulado?plano=${plan.id}` as Route}
          className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"
        >
          <Sparkles className="size-4" aria-hidden />
          Gerar simulado
        </Link>
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="border-border hover:bg-surface-2 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileText className="size-4" aria-hidden />}
          {pending ? 'Escrevendo…' : 'Gerar resumo'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}

      {summary !== null && <SummaryDraft planTitle={plan.title} initial={summary} subjects={subjects} onClose={() => setSummary(null)} />}
    </article>
  );
}

/**
 * O resumo gerado, editável, com "Salvar como rascunho". Rascunho = só o
 * professor vê; ele revisa, ajusta e publica pelo fluxo de conteúdo de sempre.
 */
function SummaryDraft({
  planTitle,
  initial,
  subjects,
  onClose,
}: {
  planTitle: string;
  initial: string;
  subjects: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [state, action] = useActionState(saveResource, INITIAL_SAVE);

  if (state.status === 'saved') {
    return (
      <div className="bg-success-soft text-success mt-3 rounded-2xl px-4 py-3 text-sm">
        Rascunho salvo. Revise e publique em{' '}
        <Link href={'/professor/conteudo' as Route} className="font-semibold underline">
          Conteúdo
        </Link>
        .
      </div>
    );
  }

  return (
    <form action={action} className="bg-surface-2 mt-3 space-y-3 rounded-2xl p-4">
      <input type="hidden" name="kind" value="resumo" />
      <input type="hidden" name="contentFormat" value="markdown" />
      <input type="hidden" name="difficulty" value="medio" />
      <input type="hidden" name="xpReward" value="0" />
      <p className="text-subtle text-xs">Revise antes de salvar. Nada vai ao aluno até você publicar.</p>

      <div>
        <Label htmlFor="sum-title">Título do resumo</Label>
        <Input id="sum-title" name="title" required defaultValue={`Resumo — ${planTitle}`} maxLength={160} />
      </div>
      <div>
        <Label htmlFor="sum-subject">Matéria</Label>
        <select
          id="sum-subject"
          name="subjectId"
          required
          defaultValue=""
          className="border-border bg-bg text-text focus-visible:ring-brand h-11 w-full rounded-full border px-4 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="" disabled>
            Escolha a matéria
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="sum-body">Texto (Markdown)</Label>
        <textarea
          id="sum-body"
          name="body"
          required
          rows={14}
          defaultValue={initial}
          className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-2xl border p-3 font-mono text-xs focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>

      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
      )}

      <div className="flex gap-2">
        <Submit pendingLabel="Salvando…">Salvar como rascunho</Submit>
        <button type="button" onClick={onClose} className="text-muted hover:text-text h-11 px-3 text-sm">
          Descartar
        </button>
      </div>
    </form>
  );
}
