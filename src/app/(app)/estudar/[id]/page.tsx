import { notFound } from 'next/navigation';
import { ResourceViewer } from '@/features/study/components/resource-viewer';
import { getQuizQuestions, getResourceDetail } from '@/features/study/server/queries';

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResourceDetail(id);
  if (!resource) notFound();

  // As questões só são buscadas para os formatos que as usam — e mesmo então
  // vêm da função que não devolve gabarito.
  const questions =
    resource.kind === 'quiz' || resource.kind === 'simulado' ? await getQuizQuestions(id) : [];

  return <ResourceViewer resource={resource} questions={questions} />;
}
