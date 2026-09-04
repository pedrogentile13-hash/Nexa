import Link from 'next/link';
import type { Route } from 'next';
import { FileText, Plus, Route as RouteIcon, School, Users } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { getAdminOverview } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { RESOURCE_KINDS, kindPlural } from '@/features/admin/lib/labels';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Visão geral' };

export default async function AdminHomePage() {
  const identity = await requireAdmin();
  const overview = await getAdminOverview();

  const totalPublished = overview.publishedByKind.reduce((sum, k) => sum + k.count, 0);

  return (
    <>
      <AdminHeader
        title={`Olá, ${identity.fullName?.split(' ')[0] ?? 'admin'}`}
        description="O que existe hoje na biblioteca e o que falta publicar."
        action={
          <Button asChild>
            <Link href="/admin/conteudo/novo">
              <Plus aria-hidden />
              Novo conteúdo
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 p-5">
        {/* Rascunho vem primeiro de propósito: é a única linha aqui que pede
            uma ação. O resto é retrato, e retrato não é tarefa. */}
        {overview.draftCount > 0 && (
          <Link
            href={{ pathname: '/admin/conteudo', query: { status: 'rascunho' } }}
            className="border-warning/30 bg-warning-soft text-warning flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium"
          >
            <FileText className="size-5 shrink-0" aria-hidden />
            {overview.draftCount === 1
              ? '1 item em rascunho — ninguém o vê ainda.'
              : `${overview.draftCount} itens em rascunho — ninguém os vê ainda.`}
          </Link>
        )}

        <section>
          <h2 className="text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Biblioteca publicada · {totalPublished} {totalPublished === 1 ? 'item' : 'itens'}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RESOURCE_KINDS.map((kind) => {
              const count = overview.publishedByKind.find((k) => k.kind === kind.value)?.count ?? 0;
              return (
                <li key={kind.value}>
                  <Link
                    href={{ pathname: '/admin/conteudo', query: { kind: kind.value } }}
                    className={cn(
                      'border-border bg-surface hover:bg-surface-2 block rounded-lg border p-4 transition-colors',
                      count === 0 && 'opacity-70',
                    )}
                  >
                    <span className="text-2xl font-semibold tabular-nums">{count}</span>
                    <span className="text-muted mt-0.5 block text-sm">{kind.plural}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            href="/admin/materias"
            Icon={FileText}
            value={overview.subjectCount}
            label="matérias no catálogo"
          />
          <StatCard
            href="/admin/materias"
            Icon={FileText}
            value={overview.topicCount}
            label="assuntos cadastrados"
          />
          <StatCard
            href="/admin/trilhas"
            Icon={RouteIcon}
            value={overview.trackCount}
            label="trilhas"
          />
          <StatCard
            href="/admin/escolas"
            Icon={School}
            value={overview.schoolCount}
            label="escolas"
          />
        </section>

        <section>
          <h2 className="text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Editado por último
          </h2>
          {overview.recent.length === 0 ? (
            <div className="border-border bg-surface rounded-lg border p-6 text-center">
              <p className="text-sm font-medium">A biblioteca está vazia.</p>
              <p className="text-muted mt-1 text-sm">
                O primeiro resumo leva dois minutos e já aparece para os alunos.
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/conteudo/novo">Criar o primeiro conteúdo</Link>
              </Button>
            </div>
          ) : (
            <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
              {overview.recent.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/conteudo/${item.id}`}
                    className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="text-muted text-xs">{kindPlural(item.kind)}</span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-1 text-xs font-semibold',
                        item.isPublished
                          ? 'bg-success-soft text-success'
                          : 'bg-surface-2 text-muted',
                      )}
                    >
                      {item.isPublished ? 'publicado' : 'rascunho'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {identity.isGlobal && (
          <section>
            <Link
              href="/admin/usuarios"
              className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
            >
              <Users className="text-muted size-5" aria-hidden />
              <span className="font-medium">Dar acesso de administrador a outra pessoa</span>
            </Link>
          </section>
        )}
      </div>
    </>
  );
}

function StatCard({
  href,
  Icon,
  value,
  label,
}: {
  href: Route;
  Icon: typeof School;
  value: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-4 transition-colors"
    >
      <Icon className="text-muted size-5 shrink-0" aria-hidden />
      <span>
        <span className="block text-xl font-semibold tabular-nums">{value}</span>
        <span className="text-muted text-xs">{label}</span>
      </span>
    </Link>
  );
}
