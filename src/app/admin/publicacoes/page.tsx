import { AdminHeader } from '@/features/admin/components/admin-shell';
import { requireAccess } from '@/features/admin/server/guard';
import { listPublicationRequests } from '@/features/nexa-ia/server/material-queries';
import { decidePublicationAction } from '@/features/nexa-ia/server/material-actions';
import type { PublicationStatus } from '@/types/database.types';

export const metadata = { title: 'Pedidos de publicação' };
export const dynamic = 'force-dynamic';

const TABS: { key: PublicationStatus; label: string }[] = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'rejected', label: 'Recusados' },
];

export default async function PublicacoesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAccess('/admin/publicacoes');
  const { status } = await searchParams;
  const current = TABS.find((t) => t.key === status)?.key ?? 'pending';
  const requests = await listPublicationRequests(current);

  return (
    <>
      <AdminHeader
        title="Pedidos de publicação"
        description="Resumos e simulados que alunos criaram com a IA. Só vão para o ambiente da escola se você aprovar."
      />
      <div className="space-y-4 p-5">
        <nav className="flex gap-2" aria-label="Filtro">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`/admin/publicacoes?status=${t.key}`}
              className={`rounded-full px-3 py-1.5 text-sm ${t.key === current ? 'bg-brand-soft text-brand-text font-semibold' : 'text-muted'}`}
            >
              {t.label}
            </a>
          ))}
        </nav>

        {requests.length === 0 ? (
          <p className="text-muted text-sm">Nenhum pedido aqui.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="border-border bg-surface space-y-3 rounded-2xl border p-4">
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-muted text-xs">
                    {r.kind === 'quiz' ? `Simulado · ${r.question_count} questões` : 'Resumo'} · {r.subject_name} · por {r.requester_name}
                    {r.class_name ? ` (${r.class_name})` : ''}
                  </p>
                  {r.note && <p className="mt-1 text-xs italic">“{r.note}”</p>}
                </div>
                <pre className="bg-surface-2 max-h-48 overflow-auto rounded-xl p-3 text-xs whitespace-pre-wrap">{r.preview || 'Sem prévia.'}</pre>

                {current === 'pending' ? (
                  <form action={decidePublicationAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input
                      name="note"
                      maxLength={500}
                      placeholder="Recado ao aluno (opcional)"
                      className="border-border bg-surface min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
                    />
                    <button name="decision" value="approve" className="bg-brand text-brand-fg rounded-xl px-4 text-sm font-semibold">
                      Aprovar
                    </button>
                    <button name="decision" value="reject" className="border-border text-danger rounded-xl border px-4 text-sm font-semibold">
                      Recusar
                    </button>
                  </form>
                ) : (
                  r.decision_note && <p className="text-muted text-xs">Recado: {r.decision_note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
