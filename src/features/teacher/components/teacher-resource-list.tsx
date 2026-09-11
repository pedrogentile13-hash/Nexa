import Link from 'next/link';
import { CircleHelp, ClipboardList, FileText, Headphones, Image, Music, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kindLabel } from '@/features/admin/lib/labels';
import { toggleTeacherResourcePublished } from '../server/actions';
import type { TeacherResource } from '../server/queries';
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

export function TeacherResourceList({ resources }: { resources: TeacherResource[] }) {
  if (resources.length === 0) {
    return (
      <div className="border-border bg-surface rounded-lg border p-8 text-center">
        <p className="text-sm font-medium">Nenhum conteúdo ainda</p>
        <p className="text-muted mt-1 text-sm">Publique o primeiro resumo, vídeo ou simulado.</p>
      </div>
    );
  }

  return (
    <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
      {resources.map((resource) => {
        const Icon = ICONS[resource.kind];
        const needsQuestions = resource.kind === 'quiz' || resource.kind === 'simulado';

        return (
          <li key={resource.id} className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden
              className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-md"
            >
              <Icon className="size-4" />
            </span>

            <Link href={`/professor/conteudo/${resource.id}`} className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{resource.title}</span>
              <span className="text-muted block truncate text-xs">
                {[kindLabel(resource.kind), resource.subjectName].join(' · ')}
              </span>
            </Link>

            {needsQuestions && (
              <Link
                href={`/professor/conteudo/${resource.id}/questoes`}
                className="text-brand-text bg-brand-soft hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:block"
              >
                questões
              </Link>
            )}

            <form action={toggleTeacherResourcePublished} className="shrink-0">
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
          </li>
        );
      })}
    </ul>
  );
}
