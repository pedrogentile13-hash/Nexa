'use client';

import { useActionState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { BookOpenCheck, Inbox, Loader2, Plus, Power, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  deleteFaq,
  replyToPending,
  saveFaq,
  toggleFaq,
  type FaqState,
} from '../server/actions';
import type { FaqItem, PendingQuestion } from '../server/queries';

const INITIAL: FaqState = { status: 'idle' };

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-brand-fg inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/**
 * Painel do professor para o chat da escola: a fila de perguntas que o bot não
 * soube responder, e a base de respostas que ele usa.
 *
 * A fila vem primeiro de propósito — é o que tem um aluno esperando.
 */
export function FaqManager({
  faqs,
  pending,
  classes,
}: {
  faqs: FaqItem[];
  pending: PendingQuestion[];
  classes: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Inbox className="size-4" aria-hidden />
          Perguntas esperando você {pending.length > 0 && <span className="bg-danger text-white rounded-full px-2 py-0.5 text-xs">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted mt-2 text-sm">Nenhuma pergunta sem resposta. O bot está dando conta. 🎉</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((q) => (
              <li key={q.messageId}>
                <PendingCard question={q} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpenCheck className="size-4" aria-hidden />
            Sua base de respostas ({faqs.length})
          </h2>
          {faqs.length === 0 ? (
            <p className="text-muted mt-2 text-sm">
              Comece pelas dúvidas que você mais ouve: prazo de entrega, o que cai na prova, onde está o material.
            </p>
          ) : (
            <ul className="border-border bg-surface divide-border mt-3 divide-y overflow-hidden rounded-lg border">
              {faqs.map((f) => (
                <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`min-w-0 flex-1 ${f.active ? '' : 'opacity-50'}`}>
                    <p className="text-sm font-medium">{f.question}</p>
                    <p className="text-muted mt-0.5 text-sm whitespace-pre-wrap">{f.answer}</p>
                    <p className="text-subtle mt-1 text-xs">
                      {f.className ? `Turma ${f.className}` : 'Todas as suas turmas'}
                      {f.keywords ? ` · ${f.keywords}` : ''}
                      {f.active ? '' : ' · desligada'}
                    </p>
                  </div>
                  <form action={toggleFaq}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      aria-label={f.active ? 'Desligar resposta' : 'Ligar resposta'}
                      title={f.active ? 'Desligar (o bot para de usar)' : 'Ligar'}
                      className="text-muted hover:bg-surface-2 grid size-11 place-items-center rounded-md"
                    >
                      <Power className="size-4" aria-hidden />
                    </button>
                  </form>
                  <form action={deleteFaq}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      aria-label="Excluir resposta"
                      className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 place-items-center rounded-md"
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
          <NewFaqForm classes={classes} />
        </div>
      </section>
    </div>
  );
}

function NewFaqForm({ classes }: { classes: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveFaq, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'saved') formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="border-border bg-surface space-y-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Nova resposta</h2>
      <div>
        <Label htmlFor="faq-question">Pergunta</Label>
        <Input id="faq-question" name="question" required maxLength={300} placeholder="Quando é a entrega do trabalho?" />
      </div>
      <div>
        <Label htmlFor="faq-answer">Resposta</Label>
        <textarea
          id="faq-answer"
          name="answer"
          required
          maxLength={2000}
          rows={4}
          placeholder="A entrega é dia 12, pela plataforma, até 23h59."
          className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-md border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>
      <div>
        <Label htmlFor="faq-keywords">Palavras que o aluno pode usar (opcional)</Label>
        <Input id="faq-keywords" name="keywords" maxLength={300} placeholder="prazo, data limite, entregar" />
      </div>
      <div>
        <Label htmlFor="faq-class">Vale para</Label>
        <select
          id="faq-class"
          name="classId"
          defaultValue=""
          className="border-border bg-bg text-text focus-visible:ring-brand h-11 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">Todas as minhas turmas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
      )}
      {state.status === 'saved' && <p className="text-success text-sm">Resposta salva. O bot já pode usá-la.</p>}

      <Submit>
        <Plus className="size-4" aria-hidden />
        Salvar resposta
      </Submit>
    </form>
  );
}

function PendingCard({ question }: { question: PendingQuestion }) {
  const [state, action] = useActionState(replyToPending, INITIAL);

  if (state.status === 'saved') {
    return <p className="bg-success-soft text-success rounded-lg px-4 py-3 text-sm">Resposta enviada para {question.studentName}.</p>;
  }

  return (
    <form action={action} className="border-border bg-surface space-y-2 rounded-lg border p-4">
      <input type="hidden" name="messageId" value={question.messageId} />
      <p className="text-subtle text-xs">
        {question.studentName} · {dateFmt.format(new Date(question.askedAt))}
      </p>
      <p className="text-sm font-medium">{question.question ?? '(pergunta indisponível)'}</p>
      <textarea
        name="reply"
        required
        rows={3}
        maxLength={2000}
        placeholder="Sua resposta…"
        aria-label={`Responder a ${question.studentName}`}
        className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-md border p-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      <label className="text-muted flex items-center gap-2 text-xs">
        <input type="checkbox" name="saveAsFaq" className="size-4" />
        Guardar na minha base — o bot responde sozinho da próxima vez
      </label>
      {state.status === 'error' && (
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
      )}
      <Submit>Responder</Submit>
    </form>
  );
}
