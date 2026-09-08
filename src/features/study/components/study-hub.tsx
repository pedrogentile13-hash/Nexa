'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Library, Route as RouteIcon, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { RESOURCE_KIND_COLOR as KIND_COLOR, RESOURCE_KIND_ICON as ICONS } from '@/lib/design/resource-kind';
import { KIND_META, KIND_ORDER, humanDuration } from '../lib/format';
import type { StudyHubData } from '../server/queries';
import type { ResourceKind } from '@/types/database.types';

/**
 * Hub de estudo.
 *
 * Responde uma pergunta: "com o que eu estudo isso?". Por isso o filtro de
 * matéria vem antes de tudo — a pergunta real do aluno nunca é "quais podcasts
 * existem", é "o que eu tenho de Física".
 *
 * "Continuar de onde parou" fica acima dos formatos porque retomar é o caminho
 * mais provável: quem já começou algo raramente quer começar outra coisa.
 */
export function StudyHub({ data, kindFilter }: { data: StudyHubData; kindFilter?: ResourceKind }) {
  const router = useRouter();
  const params = useSearchParams();
  const subjectFilter = params.get('materia');

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `/estudar?${qs}` : '/estudar');
  }

  const visible = kindFilter ? data.items.filter((i) => i.kind === kindFilter) : data.items;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 pt-4 pb-8 md:px-6 md:pt-6 lg:px-8">
      {!kindFilter && (
        <div
          className="relative overflow-hidden rounded-[20px] p-5 text-white"
          style={{ background: 'var(--gradient-header)' }}
        >
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl leading-tight font-bold tracking-tight md:text-[28px]">
                Biblioteca
              </h1>
              <p className="mt-1.5 text-sm opacity-90">
                Aprenda do seu jeito. Conteúdo pra cada etapa da sua jornada.
              </p>
            </div>
            <p className="hidden max-w-[180px] shrink-0 rounded-2xl bg-white/15 p-3 text-xs leading-snug backdrop-blur-sm sm:block">
              “Mais conhecimento, mais possibilidades.”
              <span className="mt-1 block opacity-80">— Nexa Study</span>
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- matérias -- */}
      {data.subjects.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip active={!subjectFilter} onClick={() => setParam('materia', null)}>
            Todas
          </FilterChip>
          {data.subjects.map((subject) => (
            <FilterChip
              key={subject.id}
              active={subjectFilter === subject.id}
              color={subject.color}
              onClick={() => setParam('materia', subject.id)}
            >
              {subject.name}
            </FilterChip>
          ))}
        </div>
      )}

      {/* --------------------------------------------------- continuar -- */}
      {data.continueItem && !kindFilter && (
        <section>
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Continuar de onde parou
          </h2>
          <Link
            href={`/estudar/${data.continueItem.id}`}
            style={subjectColorVars(data.continueItem.subjectColor)}
            className="border-border bg-surface hover:bg-surface-2 block overflow-hidden rounded-lg border transition-colors"
          >
            <div className="flex items-center gap-3 p-3.5">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
              >
                {(() => {
                  const Icon = ICONS[data.continueItem.kind];
                  return <Icon className="size-5" />;
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{data.continueItem.title}</p>
                <p className="text-muted text-xs">
                  {data.continueItem.subjectName} · {Math.round(data.continueItem.progressPercent)}%
                </p>
              </div>
            </div>
            <div className="bg-surface-2 h-1.5">
              <div
                className="h-full rounded-r-full"
                style={{
                  width: `${data.continueItem.progressPercent}%`,
                  backgroundColor: 'var(--subject-base)',
                }}
              />
            </div>
          </Link>
        </section>
      )}

      {/* ---------------------------------------------------- formatos -- */}
      {!kindFilter && (
        <section>
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Formatos
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {KIND_ORDER.filter((kind) => data.countsByKind[kind] > 0).map((kind) => {
              const Icon = ICONS[kind];
              const count = data.countsByKind[kind];
              return (
                <li key={kind} className="min-w-0" style={subjectColorVars(KIND_COLOR[kind])}>
                  <Link
                    href={{ pathname: '/estudar', query: { formato: kind } }}
                    className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
                  >
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {KIND_META[kind].plural}
                      </span>
                      <span className="text-muted text-xs tabular-nums">
                        {count} {count === 1 ? 'item' : 'itens'}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ----------------------------------------------------- trilhas -- */}
      {!kindFilter && data.tracks.length > 0 && (
        <section>
          <h2 className="text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
            Trilhas por matéria
          </h2>
          {/* `min-w-0` em cada item não é decoração: item de grid nasce com
              `min-width: auto`, e o título usa `truncate` (nowrap), cujo
              min-content é a largura INTEIRA do texto. Sem isso a lista estoura
              a viewport no celular — foi assim que 38px de rolagem horizontal
              apareceram ao trocar `space-y` por `grid`. */}
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {data.tracks.map((track) => (
              <li key={track.id} className="min-w-0">
                <Link
                  href={`/trilhas/${track.id}`}
                  className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
                >
                  <span
                    aria-hidden
                    className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-lg"
                  >
                    <RouteIcon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{track.title}</span>
                    <span className="text-muted text-xs">
                      {track.total === 0
                        ? 'sem lições ainda'
                        : `lição ${Math.min(track.done + 1, track.total)} de ${track.total}`}
                    </span>
                  </span>
                  {track.total > 0 && (
                    <span className="text-subtle shrink-0 text-xs font-semibold tabular-nums">
                      {Math.round((track.done / track.total) * 100)}%
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------- itens -- */}
      <section>
        {kindFilter && (
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
              {KIND_META[kindFilter].plural}
            </h2>
            <Link
              href="/estudar"
              className="text-brand-text h-11 text-sm leading-[44px] font-medium"
            >
              Ver todos os formatos
            </Link>
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyLibrary filtered={Boolean(subjectFilter || kindFilter)} kind={kindFilter} />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visible.slice(0, 60).map((item) => {
              const Icon = ICONS[item.kind];
              const duration = humanDuration(item.durationSeconds);
              return (
                <li key={item.id} className="min-w-0" style={subjectColorVars(item.subjectColor)}>
                  <Link
                    href={`/estudar/${item.id}`}
                    className="border-border bg-surface hover:bg-surface-2 relative flex items-center gap-3 overflow-hidden rounded-lg border p-3.5 transition-colors"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: 'var(--subject-base)' }}
                    />
                    <span
                      aria-hidden
                      className="ml-1 grid size-9 shrink-0 place-items-center rounded-md"
                      style={{
                        backgroundColor: 'var(--subject-soft)',
                        color: 'var(--subject-on-soft)',
                      }}
                    >
                      <Icon className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      <span className="text-muted block truncate text-xs">
                        {[
                          item.subjectName,
                          item.topicName,
                          duration,
                          item.questionCount > 0 ? `${item.questionCount} questões` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>

                    {item.progressPercent > 0 && (
                      <span className="text-subtle shrink-0 text-xs font-semibold tabular-nums">
                        {Math.round(item.progressPercent)}%
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      // A cor da matéria só pinta o chip ATIVO. Todos coloridos de uma vez
      // fazem a barra de filtros competir com o conteúdo que ela filtra.
      style={
        color
          ? {
              ...subjectColorVars(color),
              ...(active ? { backgroundColor: 'var(--subject-base)' } : {}),
            }
          : undefined
      }
      className={cn(
        'h-11 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? color
            ? 'text-white'
            : 'bg-brand text-brand-fg'
          : 'bg-surface-2 text-muted hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function EmptyLibrary({ filtered, kind }: { filtered: boolean; kind?: ResourceKind }) {
  // Um filtro por FORMATO merece um recado específico ("ainda não há
  // simulados") em vez do genérico "nada com esse filtro" — é a diferença
  // entre o aluno entender que o Nexa ainda não tem esse tipo de material e
  // achar que ele digitou o filtro errado.
  const title = kind
    ? `Ainda não há ${KIND_META[kind].plural.toLowerCase()} por aqui`
    : filtered
      ? 'Nada com esse filtro por enquanto'
      : 'A biblioteca ainda está vazia';

  const description = kind
    ? 'Assim que a escola publicar, aparece aqui — enquanto isso, dá para explorar os outros formatos.'
    : filtered
      ? 'Tente outra matéria ou veja o material das demais.'
      : 'Assim que a escola publicar resumos, simulados e vídeos, eles aparecem aqui.';

  return (
    <PopEmptyState
      icon={
        filtered ? (
          <SearchX className="text-white" />
        ) : (
          <Library className="text-white" strokeWidth={2.25} />
        )
      }
      title={title}
      description={description}
      action={
        filtered && (
          <Link href="/estudar" className={popEmptyStateActionClass}>
            {kind ? 'Ver todos os formatos' : 'Limpar filtros'}
          </Link>
        )
      }
    />
  );
}
