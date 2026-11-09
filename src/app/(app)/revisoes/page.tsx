import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RedoErrors } from '@/features/vestibular/components/redo-errors';
import { PLATFORM_COOKIE } from '@/components/layout/platform-context';
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
  const saved = (await cookies()).get(PLATFORM_COOKIE)?.value;
  let platform: 'school' | 'vestibular' = saved === 'vestibular' ? 'vestibular' : 'school';
  if (!saved) {
    const { data: p } = await supabase.from('profiles').select('journey').eq('id', user.id).maybeSingle();
    if (p?.journey === 'vestibular') platform = 'vestibular';
  }
  const [items, { data: stats }] = await Promise.all([
    getReviewQueue(user.id, platform),
    supabase.from('user_stats').select('current_streak').eq('user_id', user.id).maybeSingle(),
  ]);

  return (
    <>
      <AppHeader
        title={platform === 'vestibular' ? 'Erros e revisões' : 'Revisões'}
        subtitle={platform === 'vestibular' ? 'Questões e conteúdos do vestibular para fixar' : 'Fixe o que você já estudou'}
      />
      {platform === 'vestibular' && (
        <div className="max-w-2xl px-4 pt-4 md:px-6 lg:px-8">
          <RedoErrors />
        </div>
      )}
      <RevisoesView items={items} currentStreak={stats?.current_streak ?? 0} />
    </>
  );
}
