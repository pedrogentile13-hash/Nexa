import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, FileText, Plus, Route as RouteIcon, School, Users } from 'lucide-react';
import { getAdminOverview } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { SchoolPanel } from '@/features/school-panel/school-panel';
import { getSchoolOverview } from '@/features/school-panel/queries';
import { listPublicationRequests } from '@/features/nexa-ia/server/material-queries';
import { RESOURCE_KINDS, kindPlural } from '@/features/admin/lib/labels';
import { Chip, Panel } from '@/features/escola/components/ui';
import { RESOURCE_KIND_COLOR, RESOURCE_KIND_ICON } from '@/lib/design/resource-kind';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Visão geral' };

export default async function AdminHomePage() {
  const identity = await requireAdmin();
  const overview = await getAdminOverview();
  // Direção e coordenação veem, no topo, a escola de relance (a plataforma não: ela não é de uma escola).
  const school = !identity.isGlobal && identity.schoolId ? await getSchoolOverview(identity.schoolId) : null;
  const pendingPublications = school ? (await listPublicationRequests('pending')).length : 0;
  const totalPublished = overview.publishedByKind.reduce((sum, k) => sum + k.count, 0);
  const first = identity.fullName?.split(' ')[0] ?? 'admin';

  return (
    <div className="space-y-6 p-5 md:p-8">
      <section className="relative overflow-hidden rounded-[32px] p-6 text-white md:p-9" style={{ background: 'var(--gradient-header)' }}>
        <div aria-hidden className="absolute -top-16 -right-10 size-64 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-24 -bottom-24 size-72 rounded-full bg-white/10" />
        <p className="relative text-sm opacity-90">Painel · {identity.scope === 'full' ? 'Administração geral' : identity.schoolName ?? 'Administração'}</p>
        <h1 className="relative mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Olá, {first}.</h1>
        <p className="relative mt-2 max-w-xl text-sm opacity-90 md:text-base">
          {totalPublished} {totalPublished === 1 ? 'item publicado' : 'itens publicados'} na biblioteca
          {overview.draftCount > 0 ? ` e ${overview.draftCount} em rascunho` : ''}. É daqui que você cuida do que os alunos veem.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link href="/admin/conteudo/novo" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-violet-700">
            <Plus className="size-4" aria-hidden /> Novo conteúdo
          </Link>
          {identity.isGlobal && (
            <Link href="/admin/usuarios" className="inline-flex h-11 items-center gap-2 rounded-full bg-white/20 px-5 text-sm font-semibold backdrop-blur">
              <Users className="size-4" aria-hidden /> Dar acesso de administrador
            </Link>
          )}
        </div>
      </section>

      {school && (
        <SchoolPanel schoolName={identity.schoolName} overview={school.overview} teachers={school.teachers} pendingPublications={pendingPublications} />
      )}

      {/* Rascunho vem primeiro de propósito: é a única linha aqui que pede uma ação. */}
      {overview.draftCount > 0 && (
        <Link
          href={{ pathname: '/admin/conteudo', query: { status: 'rascunho' } }}
          className="bg-warning-soft text-warning flex items-center gap-3 rounded-3xl px-5 py-4 text-sm font-semibold"
        >
          <FileText className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            {overview.draftCount === 1 ? '1 item em rascunho — ninguém o vê ainda.' : `${overview.draftCount} itens em rascunho — ninguém os vê ainda.`}
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden />
        </Link>
      )}

      <Panel title={`Biblioteca publicada · ${totalPublished} ${totalPublished === 1 ? 'item' : 'itens'}`}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RESOURCE_KINDS.map((kind) => {
            const count = overview.publishedByKind.find((k) => k.kind === kind.value)?.count ?? 0;
            const Icon = RESOURCE_KIND_ICON[kind.value];
            return (
              <li key={kind.value}>
                <Link
                  href={{ pathname: '/admin/conteudo', query: { kind: kind.value } }}
                  className={cn('bg-surface-2 hover:bg-brand-soft flex items-center gap-3 rounded-2xl p-4 transition-colors', count === 0 && 'opacity-70')}
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-2xl"
                    style={{ ...subjectColorVars(RESOURCE_KIND_COLOR[kind.value]), background: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-2xl font-semibold tabular-nums">{count}</span>
                    <span className="text-muted block truncate text-sm">{kind.plural}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="/admin/materias" Icon={FileText} value={overview.subjectCount} label="matérias no catálogo" />
        <StatCard href="/admin/materias" Icon={FileText} value={overview.topicCount} label="assuntos cadastrados" />
        <StatCard href="/admin/trilhas" Icon={RouteIcon} value={overview.trackCount} label="trilhas" />
        <StatCard href="/admin/escolas" Icon={School} value={overview.schoolCount} label="escolas" />
      </section>

      <Panel title="Editado por último">
        {overview.recent.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm font-semibold">A biblioteca está vazia.</p>
            <p className="text-muted mt-1 text-sm">O primeiro resumo leva dois minutos e já aparece para os alunos.</p>
            <Link href="/admin/conteudo/novo" className="bg-brand text-brand-fg mt-4 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold">
              Criar o primeiro conteúdo
            </Link>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {overview.recent.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/conteudo/${item.id}` as Route} className="hover:bg-surface-2 -mx-2 flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="text-muted text-xs">{kindPlural(item.kind)}</span>
                  </span>
                  <Chip tone={item.isPublished ? 'good' : 'neutral'}>{item.isPublished ? 'publicado' : 'rascunho'}</Chip>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function StatCard({ href, Icon, value, label }: { href: Route; Icon: typeof School; value: number; label: string }) {
  return (
    <Link href={href} className="bg-surface border-border hover:border-brand/40 flex items-center gap-3 rounded-3xl border p-5 shadow-sm transition-colors">
      <span aria-hidden className="bg-brand-soft text-brand-text grid size-12 shrink-0 place-items-center rounded-2xl">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-muted text-xs">{label}</span>
      </span>
    </Link>
  );
}
