import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Library } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { PracticeSetup } from '@/features/vestibular/components/practice-setup';
import { getPracticeFilters, listPracticeSessions } from '@/features/vestibular/server/practice-queries';
import { isVestibularEnabled } from '@/lib/vestibular-access';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Treinar questões',
  description: 'Monte um treino de questões por prova e matéria.',
};

export const dynamic = 'force-dynamic';

export default async function VestibularQuestoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isVestibularEnabled())) redirect('/hoje');

  const [filters, sessions] = await Promise.all([getPracticeFilters(), listPracticeSessions()]);

  return (
    <>
      <AppHeader title="Treinar questões" subtitle="Monte um treino do seu jeito" />
      <PageMain className="pt-4 md:pt-6">
        <div className="max-w-3xl space-y-5">
          <Link
            href="/vestibular/provas"
            className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
          >
            <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-xl">
              <Library className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Prefere a prova inteira?</span>
              <span className="text-muted block text-xs">Abra a Biblioteca: ENEM, FUVEST, UNESP e mais.</span>
            </span>
            <ArrowRight className="text-subtle size-4 shrink-0" aria-hidden />
          </Link>
          <PracticeSetup filters={filters} sessions={sessions} />
        </div>
      </PageMain>
    </>
  );
}
