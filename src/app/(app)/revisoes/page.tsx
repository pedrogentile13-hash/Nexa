import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { RevisoesView } from '@/features/revisoes/components/revisoes-view';
import { getReviewQueue } from '@/features/revisoes/server/queries';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Revisões',
  description: 'Fila de revisão inteligente do que você estudou.',
};

export const dynamic = 'force-dynamic';

export default async function RevisoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const [items, { data: stats }] = await Promise.all([
    getReviewQueue(user.id),
    supabase.from('user_stats').select('current_streak').eq('user_id', user.id).maybeSingle(),
  ]);

  return (
    <>
      <AppHeader title="Revisões" subtitle="Fixe o que você já estudou" />
      <RevisoesView items={items} currentStreak={stats?.current_streak ?? 0} />
    </>
  );
}
