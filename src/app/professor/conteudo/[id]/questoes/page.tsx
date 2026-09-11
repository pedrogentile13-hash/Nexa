import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { TeacherQuestionEditor } from '@/features/teacher/components/teacher-question-editor';
import { Button } from '@/components/ui/button';
import { requireTeacher } from '@/features/teacher/server/guard';
import { getTeacherResource, getTeacherResourceQuestions } from '@/features/teacher/server/queries';

export default async function TeacherQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;

  const [resource, questions] = await Promise.all([
    getTeacherResource(id),
    getTeacherResourceQuestions(id),
  ]);

  if (!resource) notFound();

  return (
    <>
      <TeacherHeader
        title={`Questões · ${resource.title}`}
        description={
          questions.length === 0
            ? 'Nenhuma questão cadastrada ainda.'
            : `${questions.length} ${questions.length === 1 ? 'questão' : 'questões'} · o aluno responde nesta ordem.`
        }
        action={
          <Button asChild variant="secondary">
            <Link href={`/professor/conteudo/${resource.id}`}>
              <ArrowLeft aria-hidden />
              Voltar ao conteúdo
            </Link>
          </Button>
        }
      />
      <div className="p-5">
        <TeacherQuestionEditor resourceId={resource.id} questions={questions} />
      </div>
    </>
  );
}
