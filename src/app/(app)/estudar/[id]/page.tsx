import { notFound } from 'next/navigation';
import { ResourceViewer } from '@/features/study/components/resource-viewer';
import { getQuizQuestions, getResourceDetail, getWritingTasks } from '@/features/study/server/queries';

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = await getResourceDetail(id);
  if (!resource) notFound();

  // Questões e redação só são buscadas para os formatos que as usam — e
  // questões vêm da função que não devolve gabarito.
  const isExam = resource.kind === 'quiz' || resource.kind === 'simulado';
  const [questions, writingTasks] = await Promise.all([
    isExam ? getQuizQuestions(id) : Promise.resolve([]),
    isExam ? getWritingTasks(id) : Promise.resolve([]),
  ]);

  return <ResourceViewer resource={resource} questions={questions} writingTasks={writingTasks} />;
}
