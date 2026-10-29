import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireContentManager } from '@/features/admin/server/guard';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { PublishToggle } from '@/features/escola/components/content-actions-ui';
import { SummaryForm } from '@/features/escola/components/summary-form';
import { Chip, PageTitle, Panel } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { getContent } from '@/features/escola/server/content-queries';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Conteúdo' };
export const dynamic = 'force-dynamic';

export default async function ConteudoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff('/escola/conteudo');
  const { id } = await params;
  const identity = await requireContentManager();
  const content = await getContent(id);
  if (!content) notFound();
  const advanced = `${staff.role === 'teacher' ? '/professor/conteudo' : '/admin/conteudo'}/${id}`;

  let subjectId = '';
  if (content.kind === 'resumo') {
    const supabase = await createClient();
    subjectId = (await supabase.from('resources').select('subject_catalog_id').eq('id', id).maybeSingle()).data?.subject_catalog_id ?? '';
  }
  const options = content.kind === 'resumo' ? await getResourceFormOptions(identity) : null;

  return (
    <>
      <Link href="/escola/conteudo" className="text-muted hover:text-text mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
        <ArrowLeft className="size-4" aria-hidden /> Conteúdo
      </Link>
      <PageTitle
        title={content.title}
        subtitle={`${content.subjectName} · ${content.kind}`}
        action={
          <div className="flex items-center gap-2">
            <Chip tone={content.published ? 'good' : 'neutral'}>{content.published ? 'Publicado' : 'Rascunho'}</Chip>
            <PublishToggle id={content.id} published={content.published} />
          </div>
        }
      />

      {content.kind === 'resumo' && options ? (
        <Panel>
          <SummaryForm subjects={options.subjects.map((s) => ({ id: s.id, name: s.name }))} initial={{ id: content.id, subjectId, title: content.title, body: content.body ?? '', published: content.published }} />
        </Panel>
      ) : (
        <Panel title={`${content.questions.length} ${content.questions.length === 1 ? 'questão' : 'questões'}`} hint="Para editar enunciados, alternativas e gabarito use a edição avançada.">
          <ol className="space-y-2">
            {content.questions.map((q) => (
              <li key={q.id} className="bg-surface-2 rounded-2xl p-3 text-sm">
                <span className="text-muted mr-2 font-semibold">{q.position}.</span>{q.statement}
              </li>
            ))}
          </ol>
          <Link href={advanced as Route} className="bg-brand-soft text-brand-text mt-4 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold">Editar questões (avançado)</Link>
        </Panel>
      )}
    </>
  );
}
