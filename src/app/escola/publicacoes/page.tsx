import Link from 'next/link';
import type { Route } from 'next';
import { Check, Inbox, X } from 'lucide-react';
import { Avatar, Chip, Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { decidePublicationAction } from '@/features/nexa-ia/server/material-actions';
import { listPublicationRequests } from '@/features/nexa-ia/server/material-queries';
import type { PublicationStatus } from '@/types/database.types';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Publicações' };
export const dynamic = 'force-dynamic';

const TABS: { key: PublicationStatus; label: string }[] = [
  { key: 'pending', label: 'Aguardando' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'rejected', label: 'Recusados' },
];

export default async function PublicacoesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff('/escola/publicacoes');
  const { status } = await searchParams;
  const current = TABS.find((t) => t.key === status)?.key ?? 'pending';
  const requests = await listPublicationRequests(current);

  return (
    <>
      <PageTitle title="Publicações" subtitle="Resumos e simulados que alunos criaram com a IA e pedem para compartilhar. Só vão para a escola se você aprovar." />
      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/escola/publicacoes?status=${t.key}` as Route} className={cn('rounded-full px-4 py-2 text-sm font-medium', t.key === current ? 'bg-brand text-brand-fg' : 'bg-surface text-muted border-border border')}>
            {t.label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <Panel><Empty icon={<Inbox className="text-subtle size-8" aria-hidden />} title="Nada por aqui" text={current === 'pending' ? 'Quando um aluno pedir para publicar, aparece neste lugar.' : undefined} /></Panel>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {requests.map((r) => (
            <li key={r.id} className="bg-surface border-border flex flex-col gap-3 rounded-3xl border p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Avatar name={r.requester_name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-muted text-xs">por {r.requester_name}{r.class_name ? ` (${r.class_name})` : ''}</p>
                </div>
                <Chip tone="brand">{r.kind === 'quiz' ? `Simulado · ${r.question_count}` : 'Resumo'}</Chip>
              </div>
              {r.note && <p className="bg-surface-2 rounded-2xl p-3 text-sm italic">“{r.note}”</p>}
              <pre className="bg-surface-2 max-h-44 overflow-auto rounded-2xl p-3 font-sans text-xs whitespace-pre-wrap">{r.preview || 'Sem prévia.'}</pre>
              {current === 'pending' ? (
                <form action={decidePublicationAction} className="mt-auto flex flex-wrap gap-2">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input name="note" maxLength={500} placeholder="Recado ao aluno (opcional)" className="border-border bg-surface-2 h-11 min-w-0 flex-1 rounded-full border px-4 text-sm outline-none" />
                  <button name="decision" value="approve" className="bg-success inline-flex text-white h-11 items-center gap-1.5 rounded-full px-5 text-sm font-semibold"><Check className="size-4" aria-hidden /> Aprovar</button>
                  <button name="decision" value="reject" className="text-danger border-border inline-flex h-11 items-center gap-1.5 rounded-full border px-5 text-sm font-semibold"><X className="size-4" aria-hidden /> Recusar</button>
                </form>
              ) : (
                r.decision_note && <p className="text-muted text-xs">Recado: {r.decision_note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
