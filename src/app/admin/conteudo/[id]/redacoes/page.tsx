import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { EssayGrading } from '@/features/admin/components/essay-grading';
import { getResource, listEssaysForGrading } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { Button } from '@/components/ui/button';

export default async function EssaysPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [resource, essays] = await Promise.all([getResource(id), listEssaysForGrading(id)]);
  if (!resource) notFound();

  return (
    <>
      <AdminHeader
        title={`Redações · ${resource.title}`}
        description={
          essays.length === 0
            ? 'Nenhuma redação entregue ainda.'
            : `${essays.length} entregue${essays.length === 1 ? '' : 's'}.`
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
        <EssayGrading resourceId={resource.id} essays={essays} />
      </div>
    </>
  );
}
