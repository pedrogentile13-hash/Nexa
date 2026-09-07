import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { StudyTopBar } from '@/features/study/components/study-top-bar';
import { ErrorsView } from '@/features/errors/components/errors-view';
import { getRecentErrors } from '@/features/errors/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Central de erros',
  description: 'Questões que você errou, com o gabarito e um caminho de volta pro material.',
};

export const dynamic = 'force-dynamic';

export default async function ErrorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const errors = await getRecentErrors();

  return (
    <>
      <StudyTopBar title="Central de erros" subtitle="Última resposta errada de cada questão" />
      <ErrorsView errors={errors} />
    </>
  );
}
