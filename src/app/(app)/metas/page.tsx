import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { MetasView } from '@/features/metas/components/metas-view';
import { getLongTermGoals, getMetasOverview } from '@/features/metas/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Metas',
  description: 'Seus objetivos de estudo, acompanhados automaticamente.',
};

export const dynamic = 'force-dynamic';

export default async function MetasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [overview, goals] = await Promise.all([
    getMetasOverview(user.id),
    getLongTermGoals(user.id),
  ]);

  return (
    <>
      <AppHeader title="Metas" subtitle="Seus objetivos de estudo" />
      <PageMain className="pt-4 md:pt-6">
        <MetasView overview={overview} goals={goals} />
      </PageMain>
    </>
  );
}
