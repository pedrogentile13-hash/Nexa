import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { EssayGrading } from '@/features/admin/components/essay-grading';
import { getResource, listEssaysForGrading } from '@/features/admin/server/queries';
import { requireContentManager } from '@/features/admin/server/guard';
import { Button } from '@/components/ui/button';

export default async function TeacherEssaysPage({ params }: { params: Promise<{ id: string }> }) {
  await requireContentManager();
  const { id } = await params;

  const [resource, essays] = await Promise.all([getResource(id), listEssaysForGrading(id)]);
  if (!resource) notFound();

  return (
    <>
      <TeacherHeader
        title={`Redações · ${resource.title}`}
        description={
          essays.length === 0
            ? 'Nenhuma redação entregue ainda.'
            : `${essays.length} entregue${essays.length === 1 ? '' : 's'}.`
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
        <EssayGrading resourceId={resource.id} essays={essays} />
      </div>
    </>
  );
}
