import Link from 'next/link';
import { CircleHelp, ClipboardList, FileText, Headphones, Image, Music, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { formatDuration, kindLabel } from '../lib/labels';
import { toggleResourcePublished } from '../server/actions';
import type { AdminResource } from '../server/queries';
import type { ResourceKind } from '@/types/database.types';

const ICONS: Record<ResourceKind, typeof FileText> = {
  resumo: FileText,
  simulado: ClipboardList,
  quiz: CircleHelp,
  podcast: Headphones,
  video: Play,
  imagem: Image,
  musica: Music,
};

/**
 * Lista da biblioteca.
 *
 * Publicar e despublicar acontece aqui, sem abrir o item: tirar do ar algo
 * errado é urgente, e urgência não combina com três cliques.
 */
export function ResourceTable({ resources }: { resources: AdminResource[] }) {
  if (resources.length === 0) {
    return (
      <div className="border-border bg-surface rounded-lg border p-8 text-center">
        <p className="text-sm font-medium">Nada com esses filtros</p>
        <p className="text-muted mt-1 text-sm">
          Ajuste a busca ou crie o primeiro conteúdo deste formato.
        </p>
      </div>
    );
  }

  return (
    <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
      {resources.map((resource) => {
        const Icon = ICONS[resource.kind];
        const duration = formatDuration(resource.durationSeconds);
        const needsQuestions =
          (resource.kind === 'quiz' || resource.kind === 'simulado') &&
          resource.questionCount === 0;

        return (
          <li key={resource.id} style={subjectColorVars(resource.subjectColor)}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-md"
                style={{ backgroundColor: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
              >
                <Icon className="size-4" />
              </span>

              <Link href={`/admin/conteudo/${resource.id}`} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{resource.title}</span>
                <span className="text-muted block truncate text-xs">
                  {[
                    kindLabel(resource.kind),
                    resource.subjectName,
                    resource.topicName,
                    duration,
                    resource.questionCount > 0 ? `${resource.questionCount} questões` : null,
                    resource.schoolName ?? 'todas as escolas',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </Link>

              {needsQuestions && (
                <Link
                  href={`/admin/conteudo/${resource.id}/questoes`}
                  className="bg-warning-soft text-warning hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:block"
                >
                  falta cadastrar questões
                </Link>
              )}

              <form action={toggleResourcePublished} className="shrink-0">
                <input type="hidden" name="id" value={resource.id} />
                <input type="hidden" name="next" value={String(!resource.isPublished)} />
                <button
                  type="submit"
                  className={cn(
                    'h-11 rounded-full px-3 text-xs font-semibold transition-colors',
                    resource.isPublished
                      ? 'bg-success-soft text-success hover:brightness-95'
                      : 'bg-surface-2 text-muted hover:bg-surface-hover',
                  )}
                >
                  {resource.isPublished ? 'publicado' : 'rascunho'}
                </button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
