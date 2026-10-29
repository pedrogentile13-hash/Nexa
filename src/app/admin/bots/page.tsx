import Link from 'next/link';
import type { Route } from 'next';
import { Bot, ChevronRight } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { listSchools } from '@/features/admin/server/queries';
import { requireAccess } from '@/features/admin/server/guard';
import { listBotTeachers } from '@/features/admin-bots/queries';

export const metadata = { title: 'Bots dos professores' };

export const dynamic = 'force-dynamic';

export default async function AdminBotsPage({ searchParams }: { searchParams: Promise<{ escola?: string }> }) {
  const identity = await requireAccess('/admin/bots');
  const { escola } = await searchParams;

  // A escola é a da direção/coordenação; a plataforma escolhe uma.
  const schools = identity.scope === 'school' ? [] : await listSchools();
  const schoolId = identity.scope === 'school' ? identity.schoolId : (escola ?? schools[0]?.id ?? null);
  const teachers = schoolId ? await listBotTeachers(schoolId) : [];

  return (
    <>
      <AdminHeader
        title="Bots dos professores"
        description="O assistente de cada professor responde só com o que ele cadastrou. Aqui você vê a base de respostas e as conversas dos alunos."
      />
      <div className="space-y-4 p-5">
        {schools.length > 0 && (
          <form className="flex items-center gap-2">
            <label htmlFor="escola" className="text-muted text-sm">
              Escola
            </label>
            <select
              id="escola"
              name="escola"
              defaultValue={schoolId ?? ''}
              className="border-border bg-bg h-11 rounded-md border px-3 text-sm"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="submit" className="bg-brand text-brand-fg h-11 rounded-full px-5 text-sm font-semibold">
              Ver
            </button>
          </form>
        )}

        {teachers.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <Bot className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum professor com bot ainda</p>
            <p className="text-muted mt-1 text-sm">Os professores aparecem aqui assim que a escola criar as contas deles.</p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {teachers.map((t) => (
              <li key={t.teacherId}>
                <Link href={`/admin/bots/${t.teacherId}` as Route} className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3.5">
                  <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
                    <Bot className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">Bot de {t.fullName}</span>
                    <span className="text-muted block truncate text-xs">
                      {t.classes ? `Turmas ${t.classes} · ` : ''}
                      {t.faqCount} {t.faqCount === 1 ? 'resposta' : 'respostas'} · {t.conversationCount}{' '}
                      {t.conversationCount === 1 ? 'conversa' : 'conversas'}
                    </span>
                  </span>
                  {t.pendingCount > 0 && (
                    <span className="bg-danger-soft text-danger shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {t.pendingCount} sem resposta
                    </span>
                  )}
                  {t.faqCount === 0 && <span className="text-warning shrink-0 text-xs">sem base</span>}
                  <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
