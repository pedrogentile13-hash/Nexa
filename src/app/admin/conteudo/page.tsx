import Link from 'next/link';
import { FlaskConical, Plus } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ResourceTable } from '@/features/admin/components/resource-table';
import { ResourceFilterBar } from '@/features/admin/components/resource-filter-bar';
import {
  listResources,
  listSchools,
  listSubjectsWithTopics,
} from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { StudySeedCard } from '@/features/admin/components/study-seed-card';
import { createClient } from '@/lib/supabase/server';
import { PACOTES, SEED_TAG, TOPICOS } from '@/features/content/seed';
import { VEST_TAG } from '@/features/content/seed/vestibular';
import { Button } from '@/components/ui/button';
import type { ResourceKind } from '@/types/database.types';

export const metadata = { title: 'Conteúdo' };

type Search = {
  kind?: string;
  subject?: string;
  school?: string;
  status?: string;
  q?: string;
  bimestre?: string;
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<Search> }) {
  const identity = await requireAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const seedCount = async (published: boolean) =>
    (await supabase.from('resources').select('id', { count: 'exact', head: true }).contains('tags', [SEED_TAG]).eq('is_published', published)).count ?? 0;

  const vestCount = async (published: boolean) =>
    (await supabase.from('resources').select('id', { count: 'exact', head: true }).contains('tags', [VEST_TAG]).eq('is_published', published)).count ?? 0;

  const [seedDrafts, seedPublished, vestDrafts, vestPublished, resources, subjects, schools] = await Promise.all([
    seedCount(false),
    seedCount(true),
    vestCount(false),
    vestCount(true),
    listResources({
      kind: (params.kind as ResourceKind) || 'todos',
      subjectId: params.subject,
      schoolId: params.school,
      status: (params.status as 'publicado' | 'rascunho') ?? 'todos',
      search: params.q,
      bimestre: params.bimestre ? Number(params.bimestre) : undefined,
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
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/admin/conteudo/importar-simulado">
                <FlaskConical aria-hidden />
                Importar por código
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/conteudo/novo">
                <Plus aria-hidden />
                Novo conteúdo
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-5">
        <StudySeedCard drafts={seedDrafts} published={seedPublished} topics={TOPICOS.length} packages={PACOTES.length} vestDrafts={vestDrafts} vestPublished={vestPublished} />
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
