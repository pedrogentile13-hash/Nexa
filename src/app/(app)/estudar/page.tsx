import type { Metadata } from 'next';
import { GradientHeader } from '@/components/layout/gradient-header';
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
      {/* Como no Desempenho: degradê no celular, cabeçalho claro no desktop —
          numa tela larga a faixa colorida é área sem informação. */}
      <div className="md:hidden">
        <GradientHeader title="Estudar" subtitle="Com o que você estuda isso?" />
      </div>
      <div className="mx-auto hidden w-full max-w-[1440px] px-4 pt-6 md:block md:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Estudar</h1>
        <p className="text-muted mt-0.5 text-sm">Com o que você estuda isso?</p>
      </div>
      <StudyHub data={data} kindFilter={kindFilter} />
    </>
  );
}
