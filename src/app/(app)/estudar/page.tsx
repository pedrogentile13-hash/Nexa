import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/app-header';
import { StudyHub } from '@/features/study/components/study-hub';
import { getStudyHub } from '@/features/study/server/queries';
import type { ResourceKind } from '@/types/database.types';

export const metadata: Metadata = {
  title: 'Estudar',
  description: 'Resumos, simulados, quiz, podcasts, vídeos e imagens das suas matérias.',
};

const KINDS: ResourceKind[] = [
  'resumo',
  'simulado',
  'quiz',
  'podcast',
  'video',
  'imagem',
  'musica',
];

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string; formato?: string }>;
}) {
  const params = await searchParams;
  const kindFilter = KINDS.includes(params.formato as ResourceKind)
    ? (params.formato as ResourceKind)
    : undefined;

  const data = await getStudyHub(params.materia);

  return (
    <>
      <AppHeader title="Estudar" subtitle="Com o que você estuda isso?" />
      <StudyHub data={data} kindFilter={kindFilter} />
    </>
  );
}
