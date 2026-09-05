'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Music,
  Play,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudyTopBar } from './study-top-bar';
import { humanDuration } from '../lib/format';
import { completeLesson } from '../server/actions';
import type { ResourceKind } from '@/types/database.types';

const ICONS: Record<ResourceKind, typeof FileText> = {
  resumo: FileText,
  simulado: ClipboardList,
  quiz: CircleHelp,
  podcast: Headphones,
  video: Play,
  imagem: ImageIcon,
  musica: Music,
};

/**
 * Uma lição da trilha.
 *
 * A lição não tem conteúdo próprio: ela é uma SEQUÊNCIA do material que já
 * existe na biblioteca — resumo, vídeo, quiz. Duplicar o texto aqui criaria
 * duas versões do mesmo resumo para divergir na primeira correção.
 *
 * "Concluir" é um botão explícito, não uma dedução. O app não tem como saber se
 * o aluno realmente leu, e fingir que sabe — marcando sozinho ao abrir — seria
 * inflar o progresso dele contra ele mesmo.
 */

interface Lesson {
  id: string;
  trackId: string;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  xpReward: number;
  state: 'locked' | 'available' | 'in_progress' | 'done' | 'mastered';
}

interface LessonResource {
  id: string;
  kind: ResourceKind;
  title: string;
  subtitle: string | null;
  durationSeconds: number | null;
  questionCount: number;
}

export function LessonView({ lesson, resources }: { lesson: Lesson; resources: LessonResource[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ state: string; xpAwarded: number } | null>(null);

  const alreadyDone = lesson.state === 'done' || lesson.state === 'mastered';

  function finish() {
    startTransition(async () => {
      const outcome = await completeLesson(lesson.id, false);
      if (outcome) setResult(outcome);
      router.refresh();
    });
  }

  return (
    <div className="pb-8">
      <StudyTopBar title={lesson.title} subtitle="Lição da trilha" />

      <div className="mx-auto max-w-2xl px-5">
        <header className="mb-5">
          <h1 className="text-xl leading-tight font-semibold tracking-tight">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted mt-1.5 text-sm leading-relaxed">{lesson.description}</p>
          )}
          <p className="text-subtle mt-2 text-xs">
            {[
              lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : null,
              lesson.xpReward > 0 ? `${lesson.xpReward} XP` : null,
              alreadyDone ? 'já concluída' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </header>

        {resources.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border px-4 py-8 text-center">
            <p className="text-sm font-medium">Esta lição ainda não tem material</p>
            <p className="text-muted mt-1 text-sm">
              A escola ainda não juntou resumo, vídeo ou quiz a ela.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {resources.map((resource, index) => {
              const Icon = ICONS[resource.kind];
              const duration = humanDuration(resource.durationSeconds);
              return (
                <li key={resource.id}>
                  <Link
                    href={`/estudar/${resource.id}`}
                    className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-lg border p-3.5 transition-colors"
                  >
                    <span className="text-subtle w-4 shrink-0 text-xs font-semibold tabular-nums">
                      {index + 1}
                    </span>
                    <span
                      aria-hidden
                      className="bg-brand-soft text-brand-text grid size-9 shrink-0 place-items-center rounded-md"
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{resource.title}</span>
                      <span className="text-muted block truncate text-xs">
                        {[
                          resource.subtitle,
                          duration,
                          resource.questionCount > 0 ? `${resource.questionCount} questões` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        {result ? (
          <div className="bg-success-soft mt-6 rounded-lg px-4 py-4 text-center">
            <p className="text-success text-sm font-semibold">
              {result.state === 'mastered' ? 'Lição dominada.' : 'Lição concluída.'}
            </p>
            {result.xpAwarded > 0 && (
              <p className="text-success mt-1 inline-flex items-center gap-1.5 text-sm">
                <Sparkles className="size-4" aria-hidden />+{result.xpAwarded} XP
              </p>
            )}
            <Button asChild variant="secondary" className="mt-3">
              <Link href={`/estudar/trilha/${lesson.trackId}`}>Voltar à trilha</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            <Button
              size="lg"
              className={cn('w-full', alreadyDone && 'opacity-80')}
              onClick={finish}
              disabled={pending}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              {alreadyDone ? 'Marcar de novo como concluída' : 'Concluir lição'}
            </Button>
            <p className="text-subtle mt-2 text-center text-xs">
              Concluir libera a próxima lição da trilha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
