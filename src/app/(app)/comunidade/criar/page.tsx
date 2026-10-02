import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { CreatorView } from '@/features/community/components/creator-view';
import {
  listCreatorSubjects,
  listMyCreatorContent,
  listMyCommunitiesForSharing,
} from '@/features/community/server/creator-queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Criar com IA',
  description: 'Gere quizzes e resumos com IA e decida com quem compartilhar.',
};

export const dynamic = 'force-dynamic';

export default async function CriarComIAPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!(await isFeatureEnabled('creator_enabled'))) redirect('/hoje');

  const [subjects, resources, communities] = await Promise.all([
    listCreatorSubjects(),
    listMyCreatorContent(),
    listMyCommunitiesForSharing(),
  ]);

  return (
    <>
      <AppHeader title="Criar com IA" subtitle="Gere quiz ou resumo sobre qualquer tema" />
      <CreatorView subjects={subjects} resources={resources} communities={communities} />
    </>
  );
}
