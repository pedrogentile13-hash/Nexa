import Link from 'next/link';
import { Clock, Lock, School, XCircle } from 'lucide-react';
import { requestPublicationAction } from '../server/material-actions';
import type { MyCreation } from '../server/material-queries';

/**
 * Tudo que a IA criou para o aluno. Privado por padrão; para a escola ver, ele
 * pede autorização à coordenação (o painel da escola aprova ou recusa).
 */
export function MyCreations({ items, hasSchool }: { items: MyCreation[]; hasSchool: boolean }) {
  if (items.length === 0) {
    return <p className="text-muted mx-auto max-w-3xl text-center text-sm">Nada criado ainda. Gere um resumo ou simulado a partir de um material.</p>;
  }

  return (
    <ul className="mx-auto max-w-3xl space-y-3">
      {items.map((c) => {
        const pub = c.publication;
        const published = c.visibility === 'school' || pub?.status === 'approved';
        return (
          <li key={c.id} className="border-border bg-surface space-y-2 rounded-2xl border p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/estudar/${c.id}`} className="block truncate text-sm font-semibold hover:underline">
                  {c.title}
                </Link>
                <p className="text-muted text-xs">
                  {c.kind === 'quiz' ? `Simulado · ${c.questionCount} questões` : 'Resumo'} · {c.subjectName}
                </p>
              </div>
              <Status published={published} pending={pub?.status === 'pending'} />
            </div>

            {pub?.status === 'rejected' && (
              <p className="text-danger flex items-start gap-1.5 text-xs">
                <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Recusado{pub.decisionNote ? `: ${pub.decisionNote}` : '.'}
              </p>
            )}

            {hasSchool && !published && pub?.status !== 'pending' && (
              <form action={requestPublicationAction} className="flex gap-2">
                <input type="hidden" name="resourceId" value={c.id} />
                <input
                  name="note"
                  maxLength={500}
                  placeholder="Recado para a coordenação (opcional)"
                  className="border-border bg-surface min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
                />
                <button type="submit" className="bg-brand-soft text-brand-text rounded-xl px-3 text-xs font-semibold">
                  Pedir publicação
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Status({ published, pending }: { published: boolean; pending: boolean }) {
  const base = 'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium';
  if (published)
    return (
      <span className={`${base} bg-success/10 text-success`}>
        <School className="size-3.5" aria-hidden /> Na escola
      </span>
    );
  if (pending)
    return (
      <span className={`${base} bg-warning/10 text-warning`}>
        <Clock className="size-3.5" aria-hidden /> Aguardando
      </span>
    );
  return (
    <span className={`${base} bg-surface-2 text-muted`}>
      <Lock className="size-3.5" aria-hidden /> Só você
    </span>
  );
}
