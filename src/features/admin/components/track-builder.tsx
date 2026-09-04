'use client';

import { Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from './form-parts';
import { kindLabel } from '../lib/labels';
import {
  addTrackLesson,
  addTrackSection,
  attachLessonResource,
  deleteTrackLesson,
  detachLessonResource,
} from '../server/actions';
import type { ResourceKind } from '@/types/database.types';

/**
 * Montagem da trilha.
 *
 * A tela imita o formato que o aluno vê: seções empilhadas, lições em ordem,
 * material dentro da lição. Um construtor com aparência de planilha esconderia
 * justamente o que importa conferir — se a sequência faz sentido lida de cima
 * para baixo.
 *
 * O encadeamento é automático: cada lição nova destrava depois da anterior. Ter
 * que ligar um nó ao outro à mão é o passo que se esquece, e o efeito só
 * aparece quando o aluno abre a trilha inteira destravada.
 */

interface Section {
  id: string;
  position: number;
  title: string;
}
interface Lesson {
  id: string;
  section_id: string;
  position: number;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  xp_reward: number;
  unlock_after_lesson_id: string | null;
}
interface Link {
  id: string;
  lesson_id: string;
  resource_id: string;
  position: number;
}

export function TrackBuilder({
  trackId,
  sections,
  lessons,
  links,
  resources,
}: {
  trackId: string;
  sections: Section[];
  lessons: Lesson[];
  links: Link[];
  resources: { id: string; title: string; kind: ResourceKind }[];
}) {
  const resourceById = new Map(resources.map((r) => [r.id, r]));

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionLessons = lessons
          .filter((l) => l.section_id === section.id)
          .sort((a, b) => a.position - b.position);

        return (
          <section key={section.id} className="border-border bg-surface rounded-lg border">
            <header className="border-border flex items-center gap-2 border-b px-4 py-3">
              <span className="text-muted text-xs font-semibold tracking-wide uppercase">
                Assunto {section.position}
              </span>
              <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{section.title}</h2>
              <span className="text-subtle text-xs">
                {sectionLessons.length} {sectionLessons.length === 1 ? 'lição' : 'lições'}
              </span>
            </header>

            <ol className="divide-border divide-y">
              {sectionLessons.map((lesson) => {
                const lessonLinks = links
                  .filter((l) => l.lesson_id === lesson.id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <li key={lesson.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span
                        className="bg-surface-2 text-muted mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums"
                        aria-hidden
                      >
                        {lesson.position}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          {lesson.unlock_after_lesson_id ? (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="size-3" aria-hidden />
                              destrava com a anterior
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Unlock className="size-3" aria-hidden />
                              sempre aberta
                            </span>
                          )}
                          {lesson.estimated_minutes && (
                            <span>· {lesson.estimated_minutes} min</span>
                          )}
                          <span>· {lesson.xp_reward} XP</span>
                        </p>

                        {lessonLinks.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {lessonLinks.map((link) => {
                              const resource = resourceById.get(link.resource_id);
                              return (
                                <li key={link.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-subtle text-xs tabular-nums">
                                    {link.position}.
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">
                                    {resource?.title ?? 'conteúdo removido'}
                                    {resource && (
                                      <span className="text-subtle ml-1.5 text-xs">
                                        {kindLabel(resource.kind)}
                                      </span>
                                    )}
                                  </span>
                                  <form action={detachLessonResource}>
                                    <input type="hidden" name="id" value={link.id} />
                                    <input type="hidden" name="trackId" value={trackId} />
                                    <button
                                      type="submit"
                                      aria-label="Tirar da lição"
                                      className="text-muted hover:text-danger grid size-11 place-items-center rounded-md"
                                    >
                                      <Trash2 className="size-3.5" aria-hidden />
                                    </button>
                                  </form>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        <form action={attachLessonResource} className="mt-2 flex flex-wrap gap-2">
                          <input type="hidden" name="lessonId" value={lesson.id} />
                          <input type="hidden" name="trackId" value={trackId} />
                          <Select
                            name="resourceId"
                            className="min-w-[200px] flex-1"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Juntar material à lição…
                            </option>
                            {resources.map((r) => (
                              <option key={r.id} value={r.id}>
                                {kindLabel(r.kind)} · {r.title}
                              </option>
                            ))}
                          </Select>
                          <Button type="submit" variant="secondary">
                            <Plus aria-hidden />
                            Juntar
                          </Button>
                        </form>
                      </div>

                      <form action={deleteTrackLesson}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="trackId" value={trackId} />
                        <button
                          type="submit"
                          aria-label={`Excluir lição ${lesson.title}`}
                          className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 shrink-0 place-items-center rounded-md"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ol>

            <form
              action={addTrackLesson}
              className="border-border flex flex-wrap items-end gap-2 border-t px-4 py-3"
            >
              <input type="hidden" name="sectionId" value={section.id} />
              <input type="hidden" name="trackId" value={trackId} />
              <div className="min-w-[180px] flex-1">
                <Input name="title" placeholder="Nova lição — ex.: Queda livre" required />
              </div>
              <Input
                name="estimatedMinutes"
                type="number"
                min={1}
                placeholder="min"
                className="w-20"
              />
              <Input
                name="xpReward"
                type="number"
                min={0}
                defaultValue={20}
                className="w-20"
                aria-label="XP"
              />
              <Button type="submit" variant="secondary">
                <Plus aria-hidden />
                Lição
              </Button>
            </form>
          </section>
        );
      })}

      <form action={addTrackSection} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="trackId" value={trackId} />
        <div className="min-w-[200px] flex-1">
          <Input name="title" placeholder="Novo assunto — ex.: Leis de Newton" required />
        </div>
        <Button type="submit">
          <Plus aria-hidden />
          Adicionar assunto
        </Button>
      </form>
    </div>
  );
}
