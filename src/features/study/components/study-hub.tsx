'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Library, Route as RouteIcon, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteCreationButton } from '@/features/nexa-ia/components/delete-creation-button';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { RESOURCE_KIND_COLOR as KIND_COLOR, RESOURCE_KIND_ICON as ICONS } from '@/lib/design/resource-kind';
import { KIND_META, KIND_ORDER, humanDuration } from '../lib/format';
import { BIMESTRES } from '@/lib/design/bimestre';
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
  const bimestreFilter = params.get('bimestre');
  const origin = params.get('origem') ?? 'todos';

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `/estudar?${qs}` : '/estudar');
  }

  let visible = kindFilter ? data.items.filter((i) => i.kind === kindFilter) : data.items;
  if (bimestreFilter) visible = visible.filter((i) => i.bimestre === Number(bimestreFilter));

  const hasBimestre = data.items.some((i) => i.bimestre);

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 pt-4 pb-8 md:px-6 md:pt-6 lg:px-8">
      {/* ------------------------------------------------------- origem -- */}
      <div role="tablist" aria-label="De onde vem o conteúdo" className="bg-surface-2 grid grid-cols-3 gap-1 rounded-2xl p-1 md:max-w-xl">
        {(
          [
            ['todos', 'Tudo'],
            ['plataforma', 'Da plataforma'],
            ['meus', 'Meus conteúdos'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={origin === value}
            onClick={() => setParam('origem', value === 'todos' ? null : value)}
            className={cn(
              'h-10 min-w-0 truncate rounded-xl px-2 text-sm font-medium transition-colors',
              origin === value ? 'bg-surface text-brand-text shadow-sm' : 'text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------ filtros -- */}
      {/* Menus suspensos, não fileiras de botões rolando para o lado: com 10+
          matérias a fileira escondia metade das opções. */}
      {(data.subjects.length > 0 || hasBimestre) && (
        <div className="grid grid-cols-2 gap-2.5 md:max-w-xl">
          {data.subjects.length > 0 && (
            <FilterSelect
              label="Matéria"
              value={subjectFilter ?? ''}
              onChange={(v) => setParam('materia', v || null)}
              allLabel="Todas as matérias"
              options={data.subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
              className={hasBimestre ? undefined : 'col-span-2'}
            />
          )}
          {hasBimestre && (
            <FilterSelect
              label="Bimestre"
              value={bimestreFilter ?? ''}
              onChange={(v) => setParam('bimestre', v || null)}
              allLabel="Todos os bimestres"
              options={BIMESTRES.map((b) => ({ value: String(b.value), label: b.label }))}
              className={data.subjects.length > 0 ? undefined : 'col-span-2'}
            />
          )}
        </div>
      )}

      {/* --------------------------------------------------- continuar -- */}
      {data.continueItem && !kindFilter && !bimestreFilter && (
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
      {!kindFilter && !bimestreFilter && (
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
            {origin !== 'meus' && data.tracks.length > 0 && (
              <li className="min-w-0">
                <Link
                  href="/trilhas"
                  className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
                >
                  <span aria-hidden className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-lg">
                    <RouteIcon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">Trilhas</span>
                    <span className="text-muted text-xs tabular-nums">
                      {data.tracks.length} {data.tracks.length === 1 ? 'trilha' : 'trilhas'}
                    </span>
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      {/* ----------------------------------------------------- trilhas -- */}
      {!kindFilter && origin !== 'meus' && data.tracks.length > 0 && (
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
          <EmptyLibrary
            filtered={Boolean(subjectFilter || kindFilter || bimestreFilter || origin !== 'todos')}
            kind={kindFilter}
          />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visible.slice(0, 60).map((item) => {
              const Icon = ICONS[item.kind];
              const duration = humanDuration(item.durationSeconds);
              return (
                <li key={item.id} className="relative min-w-0" style={subjectColorVars(item.subjectColor)}>
                  <Link
                    href={`/estudar/${item.id}`}
                    className={cn(
                      'border-border bg-surface hover:bg-surface-2 relative flex items-center gap-3 overflow-hidden rounded-lg border p-3.5 transition-colors',
                      item.mine && 'pr-14',
                    )}
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
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate text-sm font-semibold">{item.title}</span>
                        {item.mine && (
                          <span className="bg-brand-soft text-brand-text shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">Meu</span>
                        )}
                      </span>
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
                  {item.mine && (
                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                      <DeleteCreationButton resourceId={item.id} title={item.title} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
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

function FilterSelect({
  label,
  value,
  onChange,
  allLabel,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className="text-muted mb-1 block text-xs font-semibold">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'border-border bg-surface text-text focus-visible:ring-brand h-11 w-full min-w-0 appearance-none truncate rounded-xl border pr-9 pl-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
            value && 'border-brand/40 bg-brand-soft text-brand-text',
          )}
        >
          <option value="">{allLabel}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="text-subtle pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </span>
    </label>
  );
}
