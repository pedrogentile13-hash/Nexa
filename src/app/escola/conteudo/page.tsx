import Link from 'next/link';
import type { Route } from 'next';
import { FileText, ListChecks, Plus, Search } from 'lucide-react';
import { DeleteContent, PublishToggle } from '@/features/escola/components/content-actions-ui';
import { Chip, Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { listContent } from '@/features/escola/server/content-queries';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Conteúdo' };
export const dynamic = 'force-dynamic';

const KINDS: Record<string, string> = { resumo: 'Resumo', quiz: 'Quiz', simulado: 'Simulado', podcast: 'Podcast', video: 'Vídeo', imagem: 'Imagem', musica: 'Música' };
const STATUS = [
  { key: '', label: 'Tudo' },
  { key: 'rascunhos', label: 'Rascunhos' },
  { key: 'publicados', label: 'Publicados' },
];

export default async function ConteudoPage({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string; status?: string }> }) {
  const staff = await requireStaff('/escola/conteudo');
  const params = await searchParams;
  const rows = await listContent({ kind: params.tipo, status: params.status, q: params.q });

  const link = (over: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: params.q, tipo: params.tipo, status: params.status, ...over })) if (v) q.set(k, v);
    const s = q.toString();
    return (s ? `/escola/conteudo?${s}` : '/escola/conteudo') as Route;
  };
  const advanced = staff.role === 'teacher' ? '/professor/conteudo' : '/admin/conteudo';

  return (
    <>
      <PageTitle
        title="Conteúdo"
        subtitle="Resumos e simulados para os seus alunos. Tudo nasce como rascunho; você publica quando estiver pronto."
        action={
          <Link href="/escola/conteudo/novo" className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
            <Plus className="size-4" aria-hidden /> Novo conteúdo
          </Link>
        }
      />

      <Panel>
        <form action="/escola/conteudo" className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">Buscar</span>
            <Search className="text-subtle pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" aria-hidden />
            <input name="q" defaultValue={params.q ?? ''} placeholder="Buscar pelo título" className="border-border bg-surface-2 h-11 w-full rounded-full border pr-4 pl-10 text-sm outline-none" />
          </label>
          {params.tipo && <input type="hidden" name="tipo" value={params.tipo} />}
          {params.status && <input type="hidden" name="status" value={params.status} />}
          <button type="submit" className="bg-brand text-brand-fg h-11 rounded-full px-5 text-sm font-semibold">Buscar</button>
        </form>
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS.map((s) => (
            <Link key={s.key} href={link({ status: s.key || undefined })} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium', (params.status ?? '') === s.key ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted')}>{s.label}</Link>
          ))}
          <span className="bg-border mx-1 hidden w-px sm:block" aria-hidden />
          {['resumo', 'quiz', 'simulado'].map((k) => (
            <Link key={k} href={link({ tipo: params.tipo === k ? undefined : k })} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium', params.tipo === k ? 'bg-brand-soft text-brand-text' : 'bg-surface-2 text-muted')}>{KINDS[k]}s</Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <Empty icon={<FileText className="text-subtle size-8" aria-hidden />} title="Nenhum conteúdo por aqui" text="Crie o primeiro: a IA escreve um rascunho e você revisa." />
        ) : (
          <ul className="divide-border divide-y">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-2xl">
                  {r.kind === 'resumo' ? <FileText className="size-5" aria-hidden /> : <ListChecks className="size-5" aria-hidden />}
                </span>
                <Link href={`/escola/conteudo/${r.id}` as Route} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.title}</span>
                  <span className="text-muted block truncate text-xs">{KINDS[r.kind] ?? r.kind} · {r.subjectName}{r.questionCount > 0 ? ` · ${r.questionCount} questões` : ''}</span>
                </Link>
                <Chip tone={r.published ? 'good' : 'neutral'}>{r.published ? 'Publicado' : 'Rascunho'}</Chip>
                <PublishToggle id={r.id} published={r.published} />
                <DeleteContent id={r.id} title={r.title} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="text-muted mt-4 text-sm">Precisa de vídeo, podcast, PDF ou prova com seções? Use a <Link href={advanced as Route} className="text-brand-text font-semibold underline">edição avançada</Link>.</p>
    </>
  );
}
