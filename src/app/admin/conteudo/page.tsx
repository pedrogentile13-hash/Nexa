import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ResourceTable } from '@/features/admin/components/resource-table';
import { ResourceFilterBar } from '@/features/admin/components/resource-filter-bar';
import {
  listResources,
  listSchools,
  listSubjectsWithTopics,
} from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { Button } from '@/components/ui/button';
import type { ResourceKind } from '@/types/database.types';

export const metadata = { title: 'Conteúdo' };

type Search = { kind?: string; subject?: string; school?: string; status?: string; q?: string };

export default async function ContentPage({ searchParams }: { searchParams: Promise<Search> }) {
  const identity = await requireAdmin();
  const params = await searchParams;

  const [resources, subjects, schools] = await Promise.all([
    listResources({
      kind: (params.kind as ResourceKind) || 'todos',
      subjectId: params.subject,
      schoolId: params.school,
      status: (params.status as 'publicado' | 'rascunho') ?? 'todos',
      search: params.q,
    }),
    listSubjectsWithTopics(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader
        title="Conteúdo"
        description="Resumos, simulados, quiz, podcasts, vídeos, imagens e músicas."
        action={
          <Button asChild>
            <Link href="/admin/conteudo/novo">
              <Plus aria-hidden />
              Novo conteúdo
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-5">
        <ResourceFilterBar
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          current={params}
        />
        <ResourceTable resources={resources} />
      </div>
    </>
  );
}
