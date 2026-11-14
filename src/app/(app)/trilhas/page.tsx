import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { TrilhasView } from '@/features/trilhas/components/trilhas-view';
import { getTrilhasOverview } from '@/features/trilhas/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Trilhas',
  description: 'Percursos de estudo completos, organizados por objetivo.',
};

export const dynamic = 'force-dynamic';

export default async function TrilhasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getTrilhasOverview(user.id);

  return (
    <>
      <AppHeader title="Trilhas" subtitle="Percursos de estudo por objetivo" />
      <PageMain className="pt-4 md:pt-6">
        <TrilhasView overview={overview} />
      </PageMain>
    </>
  );
}
