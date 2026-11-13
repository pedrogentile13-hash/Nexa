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
import { MixedSeedCard } from '@/features/admin/components/mixed-seed-card';
import { Grande2Card } from '@/features/admin/components/grande2-card';
import { createClient } from '@/lib/supabase/server';
import { PACOTES, SEED_TAG, TOPICOS } from '@/features/content/seed';
import { VEST_TAG } from '@/features/content/seed/vestibular';
import { MISTO_TAG, PACOTES_MISTOS } from '@/features/content/seed/misto';
import {
  G2_TAG,
  PACOTES_G2,
  PACOTES_G2_STUDY,
  PACOTES_G2_VESTIBULAR,
} from '@/features/content/seed/grande2';
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
    (
      await supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .contains('tags', [SEED_TAG])
        .eq('is_published', published)
    ).count ?? 0;

  const vestCount = async (published: boolean) =>
    (
      await supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .contains('tags', [VEST_TAG])
        .eq('is_published', published)
    ).count ?? 0;

  const mixedCount = async (published: boolean) =>
    (
      await supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .contains('tags', [MISTO_TAG])
        .eq('is_published', published)
    ).count ?? 0;

  const g2Count = async (published: boolean) =>
    (
      await supabase
        .from('resources')
        .select('id', { count: 'exact', head: true })
        .contains('tags', [G2_TAG])
        .eq('is_published', published)
    ).count ?? 0;

  const [
    g2Drafts,
    g2Published,
    seedDrafts,
    seedPublished,
    vestDrafts,
    vestPublished,
    mixedDrafts,
    mixedPublished,
    resources,
    subjects,
    schools,
  ] = await Promise.all([
    g2Count(false),
    g2Count(true),
    seedCount(false),
    seedCount(true),
    vestCount(false),
    vestCount(true),
    mixedCount(false),
    mixedCount(true),
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
        <Grande2Card
          drafts={g2Drafts}
          published={g2Published}
          quizzes={PACOTES_G2_STUDY.filter((p) => p.kind === 'quiz').length}
          simulados={PACOTES_G2_STUDY.filter((p) => p.kind === 'simulado').length}
          vestibular={PACOTES_G2_VESTIBULAR.length}
          questions={PACOTES_G2.reduce((n, p) => n + p.questoes.length, 0)}
          discursive={PACOTES_G2.reduce(
            (n, p) => n + p.questoes.filter((q) => q.k === 'd').length,
            0,
          )}
          withDiscursive={PACOTES_G2.filter((p) => p.questoes.some((q) => q.k === 'd')).length}
        />
        <StudySeedCard
          drafts={seedDrafts}
          published={seedPublished}
          topics={TOPICOS.length}
          packages={PACOTES.length}
          vestDrafts={vestDrafts}
          vestPublished={vestPublished}
        />
        <MixedSeedCard
          drafts={mixedDrafts}
          published={mixedPublished}
          packages={PACOTES_MISTOS.length}
          questions={PACOTES_MISTOS.reduce((n, p) => n + p.questoes.length, 0)}
          discursive={PACOTES_MISTOS.reduce(
            (n, p) => n + p.questoes.filter((q) => q.k === 'd').length,
            0,
          )}
        />
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
