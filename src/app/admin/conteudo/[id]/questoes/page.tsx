import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { QuestionEditor } from '@/features/admin/components/question-editor';
import {
  getResource,
  getResourceFormOptions,
  getResourceQuestions,
} from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { Button } from '@/components/ui/button';

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await requireAdmin();
  const { id } = await params;

  const [resource, questions, options] = await Promise.all([
    getResource(id),
    getResourceQuestions(id),
    getResourceFormOptions(identity),
  ]);

  if (!resource) notFound();

  const topics = options.topics.filter((t) => t.subjectId === resource.subject_catalog_id);

  return (
    <>
      <AdminHeader
        title={`Questões · ${resource.title}`}
        description={
          questions.length === 0
            ? 'Nenhuma questão cadastrada ainda.'
            : `${questions.length} ${questions.length === 1 ? 'questão' : 'questões'} · o aluno responde nesta ordem.`
        }
        action={
          <Button asChild variant="secondary">
            <Link href={`/admin/conteudo/${resource.id}`}>
              <ArrowLeft aria-hidden />
              Voltar ao conteúdo
            </Link>
          </Button>
        }
      />
      <div className="p-5">
        <QuestionEditor
          resourceId={resource.id}
          questions={questions}
          topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        />
      </div>
    </>
  );
}
