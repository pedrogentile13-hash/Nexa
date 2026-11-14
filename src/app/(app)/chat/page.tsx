import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { listMyTeachers } from '@/features/school-chat/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Chat com professores',
  description: 'Tire dúvidas sobre prazos, provas e materiais com o assistente de cada professor.',
};

export const dynamic = 'force-dynamic';

export default async function ChatListPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const teachers = await listMyTeachers();

  return (
    <>
      <AppHeader title="Professores" subtitle="Tire dúvidas sem esperar a próxima aula" />
      <PageMain className="pt-4 md:pt-6">
        {teachers.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border p-8 text-center">
            <MessageCircle className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum professor na sua turma ainda</p>
            <p className="text-muted mt-1 text-sm">
              Quando a escola ligar seus professores à sua turma, eles aparecem aqui.
            </p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-2xl border">
            {teachers.map((t) => (
              <li key={t.teacherId}>
                <Link
                  href={`/chat/${t.teacherId}` as Route}
                  className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-full font-semibold">
                    {t.fullName.trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t.fullName}</span>
                    <span className="text-muted block truncate text-xs">{t.subjects}</span>
                  </span>
                  <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageMain>
    </>
  );
}
