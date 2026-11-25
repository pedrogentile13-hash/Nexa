import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireContentManager } from '@/features/admin/server/guard';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { QuizForm } from '@/features/escola/components/quiz-form';
import { SummaryForm } from '@/features/escola/components/summary-form';
import { PageTitle, Panel } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Novo conteúdo' };
export const dynamic = 'force-dynamic';

export default async function NovoConteudoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireStaff('/escola/conteudo');
  const identity = await requireContentManager();
  const options = await getResourceFormOptions(identity);
  const { tipo } = await searchParams;
  const kind = tipo === 'simulado' ? 'simulado' : 'resumo';
  const subjects = options.subjects.map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      <Link href="/escola/conteudo" className="text-muted hover:text-text mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
        <ArrowLeft className="size-4" aria-hidden /> Conteúdo
      </Link>
      <PageTitle title="Novo conteúdo" subtitle="A IA escreve um rascunho; você revisa, corrige e decide quando publicar." />
      <div className="mb-5 flex gap-2">
        {[
          ['resumo', 'Resumo'],
          ['simulado', 'Simulado'],
        ].map(([k, label]) => (
          <Link key={k} href={`/escola/conteudo/novo?tipo=${k}` as '/escola/conteudo/novo'} className={cn('rounded-full px-5 py-2 text-sm font-medium', kind === k ? 'bg-brand text-brand-fg' : 'bg-surface text-muted border-border border')}>
            {label}
          </Link>
        ))}
      </div>
      <Panel>{subjects.length === 0 ? <p className="text-muted text-sm">Você ainda não tem matérias atribuídas. Peça à coordenação.</p> : kind === 'resumo' ? <SummaryForm subjects={subjects} /> : <QuizForm subjects={subjects} />}</Panel>
    </>
  );
}
