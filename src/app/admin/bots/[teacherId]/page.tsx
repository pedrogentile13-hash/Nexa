import { notFound } from 'next/navigation';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { requireAccess } from '@/features/admin/server/guard';
import { getBotDetail } from '@/features/admin-bots/queries';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Bot do professor' };

export const dynamic = 'force-dynamic';

const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const LABEL = { student: 'Aluno', bot: 'Bot', teacher: 'Professor' } as const;

export default async function AdminBotDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  await requireAccess('/admin/bots');
  const { teacherId } = await params;
  const detail = await getBotDetail(teacherId);
  if (!detail) notFound();

  return (
    <>
      <AdminHeader
        title={`Bot de ${detail.teacherName}`}
        description="Somente leitura. O professor edita a base e responde as perguntas pelo painel dele."
      />
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Base de respostas ({detail.faqs.length})</h2>
          {detail.faqs.length === 0 ? (
            <p className="text-muted text-sm">O professor ainda não cadastrou nenhuma resposta — o bot encaminha tudo a ele.</p>
          ) : (
            <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
              {detail.faqs.map((f) => (
                <li key={f.id} className={cn('px-4 py-3', !f.active && 'opacity-50')}>
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="text-muted mt-0.5 text-sm whitespace-pre-wrap">{f.answer}</p>
                  <p className="text-subtle mt-1 text-xs">
                    {f.className ? `Turma ${f.className}` : 'Todas as turmas'}
                    {f.active ? '' : ' · desligada'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Conversas dos alunos ({detail.conversations.length})</h2>
          {detail.conversations.length === 0 ? (
            <p className="text-muted text-sm">Nenhum aluno conversou com este bot ainda.</p>
          ) : (
            <ul className="space-y-3">
              {detail.conversations.map((c) => (
                <li key={c.id}>
                  <details className="border-border bg-surface rounded-lg border">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
                      <span>
                        {c.studentName}
                        {c.className ? <span className="text-subtle font-normal"> · {c.className}</span> : null}
                      </span>
                      <span className="text-subtle text-xs">{c.messages.length} mensagens</span>
                    </summary>
                    <ul className="border-border space-y-2 border-t px-4 py-3">
                      {c.messages.map((m) => (
                        <li key={m.id} className="text-sm">
                          <span className="text-subtle text-xs">
                            {LABEL[m.sender]} · {fmt.format(new Date(m.createdAt))}
                            {m.status === 'unanswered' ? ' · aguardando professor' : ''}
                          </span>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
