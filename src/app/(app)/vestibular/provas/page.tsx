import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { VestibularLibrary } from '@/features/vestibular/components/vestibular-library';
import { buildLibrary } from '@/features/vestibular/lib/library';
import { listExamEditions, listExamFiles, listVestibularResources } from '@/features/vestibular/server/queries';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Biblioteca',
  description: 'Provas anteriores, cadernos oficiais e simulados no estilo de cada banca.',
};

export const dynamic = 'force-dynamic';

export default async function BancoDeProvasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!(await isFeatureEnabled('vestibular_enabled'))) redirect('/hoje');

  // Duas leituras: todo o conteúdo e, à parte, os simulados — assim nenhum simulado fica de fora por limite de lista.
  const [all, simulados, editions, files] = await Promise.all([
    listVestibularResources({}, 200),
    listVestibularResources({ kind: 'simulado' }, 200),
    listExamEditions(),
    listExamFiles(),
  ]);
  const resources = [...all, ...simulados.filter((s) => !all.some((a) => a.id === s.id))];
  const fileCounts: Record<string, number> = {};
  for (const f of files) fileCounts[f.editionId] = (fileCounts[f.editionId] ?? 0) + 1;

  const items = buildLibrary(resources, editions, fileCounts);
  const coverByBanca: Record<string, string | null> = {};
  for (const e of editions) coverByBanca[e.examName.toUpperCase()] ??= e.coverUrl;

  return (
    <>
      <AppHeader title="Biblioteca" subtitle="Simulados e provas: ENEM, FUVEST, UNICAMP, UNESP" />
      <PageMain className="space-y-5 pt-4 md:pt-6">
        <Link
          href="/vestibular/questoes"
          className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
        >
          <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
            <ClipboardCheck className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold">Quer treinar por matéria ou assunto?</span>
            <span className="text-muted block">Questões avulsas das provas, com correção na hora.</span>
          </span>
          <ArrowRight className="text-muted size-4 shrink-0" aria-hidden />
        </Link>
        <VestibularLibrary items={items} coverByBanca={coverByBanca} />
      </PageMain>
    </>
  );
}
