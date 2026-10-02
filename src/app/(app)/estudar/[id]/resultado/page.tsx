import { notFound, redirect } from 'next/navigation';
import { AttemptResult } from '@/features/study/components/attempt-result';
import {
  getAttemptResult,
  getEssayResults,
  getResourceDetail,
  getWritingTasks,
} from '@/features/study/server/queries';

export default async function AttemptResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tentativa?: string }>;
}) {
  const [{ id }, { tentativa }] = await Promise.all([params, searchParams]);

  // Sem tentativa não há gabarito para mostrar: o material volta ao começo em
  // vez de abrir uma tela de revisão vazia que parece defeito.
  if (!tentativa) redirect(`/estudar/${id}`);

  const [resource, result, writingTasks, essays] = await Promise.all([
    getResourceDetail(id),
    getAttemptResult(tentativa),
    getWritingTasks(id),
    getEssayResults(tentativa),
  ]);

  if (!resource || !result.attempt) notFound();

  return <AttemptResult resource={resource} result={result} writingTasks={writingTasks} essays={essays} />;
}
