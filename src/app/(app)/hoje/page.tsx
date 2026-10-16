import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TodayView } from '@/features/today/components/today-view';
import { getCurrentUser } from '@/lib/supabase/server';
import { rankFocus } from '@/features/today/lib/ranking';
import { getTodaySnapshot } from '@/features/today/server/queries';

export const metadata: Metadata = {
  title: 'Hoje',
  description: 'O que você precisa fazer hoje.',
};

// Cada carregamento reflete o que acabou de ser marcado; sem isso a tela mais
// aberta do app mostraria o estado de ontem.
export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const snapshot = await getTodaySnapshot(user.id);
  const focus = rankFocus(snapshot.candidates, snapshot.today, 3);

  return <TodayView snapshot={snapshot} focus={focus} />;
}
