import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ExamBank } from '@/features/vestibular/components/exam-bank';
import { buildExamBank } from '@/features/vestibular/lib/exam-bank';
import { listExamEditions, listVestibularResources } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Banco de provas',
  description: 'Provas anteriores dos principais vestibulares e simulados inspirados.',
};

export const dynamic = 'force-dynamic';

export default async function BancoDeProvasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  const [resources, editions] = await Promise.all([listVestibularResources(), listExamEditions()]);
  const items = buildExamBank(resources, editions);

  return (
    <>
      <AppHeader title="Banco de provas" subtitle="ENEM, FUVEST, UNESP e mais" />
      <PageMain className="pt-4 md:pt-6">
        <p className="text-muted mb-5 max-w-2xl text-sm leading-relaxed">
          Resolva a prova inteira, na ordem original, com cronômetro e correção. As provas anteriores entram
          conforme são revisadas; os simulados inspirados seguem o estilo de cada vestibular.
        </p>
        <ExamBank items={items} />
      </PageMain>
    </>
  );
}
