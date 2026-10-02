'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Route as RouteIcon, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { TargetGradeForm } from './target-grade-form';
import { formatGrade } from '@/lib/format/grade';
import { cn } from '@/lib/utils';
import type { SimuladoAttempt, SubjectScore, TopicMastery } from '@/features/performance/server/queries';

export interface SubjectContentItem {
  id: string;
  kind: string;
  title: string;
  durationSeconds: number | null;
  completed: boolean;
}

export interface SubjectTrackItem {
  id: string;
  title: string;
  done: number;
  total: number;
}

const STATUS_DOT: Record<TopicMastery['status'], string> = {
  dominado: 'bg-success',
  desenvolvimento: 'bg-warning',
  revisar: 'bg-danger',
};

type Tab = 'geral' | 'conteudos' | 'trilhas' | 'questoes' | 'simulados' | 'revisoes';

export function SubjectTabs({
  subjectId,
  score,
  content,
  tracks,
  topics,
  simulados,
}: {
  subjectId: string;
  score: SubjectScore;
  content: SubjectContentItem[];
  tracks: SubjectTrackItem[];
  topics: TopicMastery[];
  simulados: SimuladoAttempt[];
}) {
  const [tab, setTab] = useState<Tab>('geral');

  return (
    <div className="min-w-0 lg:col-span-2">
      <UnderlineTabs
        label="Seções da matéria"
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          { value: 'geral', label: 'Visão geral' },
          { value: 'conteudos', label: `Conteúdos (${content.length})` },
          { value: 'trilhas', label: `Trilhas (${tracks.length})` },
          { value: 'questoes', label: 'Questões' },
          { value: 'revisoes', label: 'Revisões' },
          { value: 'simulados', label: `Simulados (${simulados.length})` },
        ]}
      />

      {tab === 'geral' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Como a nota é composta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">Avaliativo (70%)</span>
                  <span className="tabular text-sm font-semibold">
                    {formatGrade(score.assessmentScore, 1)}
                  </span>
                </div>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  {score.quizzesDone} {score.quizzesDone === 1 ? 'quiz' : 'quizzes'} ·{' '}
                  {score.simuladosDone} {score.simuladosDone === 1 ? 'simulado' : 'simulados'}
                </p>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">Empenho (30%)</span>
                  <span className="tabular text-sm font-semibold">
                    {Math.round(score.empenhoIndex)}%
                  </span>
                </div>
                <p className="text-muted mt-1 text-xs leading-relaxed">
                  {score.contentCompleted}{' '}
                  {score.contentCompleted === 1 ? 'conteúdo concluído' : 'conteúdos concluídos'}, e
                  quanto mais regular o estudo, maior esse número.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <TargetGradeForm subjectId={subjectId} initialTarget={score.targetGrade} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'conteudos' && (
        <Card>
          <CardContent className="p-0">
            {content.length === 0 ? (
              <p className="text-muted p-4 text-sm">
                Nenhum conteúdo desta matéria no acervo ainda.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {content.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/estudar/${item.id}`}
                      className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-subtle text-xs capitalize">{item.kind}</p>
                      </div>
                      {item.completed && (
                        <span className="bg-success-soft text-success shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
                          Concluído
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'trilhas' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tracks.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma trilha desta matéria ainda.</p>
          ) : (
            tracks.map((track) => {
              const percent = track.total > 0 ? Math.round((track.done / track.total) * 100) : 0;
              return (
                <Link
                  key={track.id}
                  href={`/trilhas/${track.id}`}
                  className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
                >
                  <span
                    aria-hidden
                    className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl"
                  >
                    <RouteIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{track.title}</p>
                    <p className="text-muted text-xs">
                      {track.done} de {track.total} lições
                    </p>
                    <Progress value={percent} size="sm" label={`${track.title}: ${percent}%`} className="mt-1.5" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === 'questoes' && (
        <Card>
          <CardContent className="p-0">
            {topics.length === 0 ? (
              <p className="text-muted p-4 text-sm">
                Faça um quiz ou simulado desta matéria pra ver o domínio por assunto.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {topics.map((topic) => (
                  <li
                    key={topic.topicId ?? topic.topicName}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      aria-hidden
                      className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT[topic.status])}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {topic.topicName}
                    </span>
                    <span className="text-muted shrink-0 text-xs tabular-nums">
                      {topic.correctCount}/{topic.totalCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'revisoes' && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="bg-brand-soft text-brand-text mx-auto mb-3 grid size-12 place-items-center rounded-full">
              <RotateCcw className="size-5" aria-hidden />
            </div>
            <p className="text-sm font-medium">Revisões chegando em breve</p>
            <p className="text-muted mx-auto mt-1 max-w-xs text-sm leading-relaxed">
              Em breve, esta aba mostra revisões programadas desta matéria.
            </p>
          </CardContent>
        </Card>
      )}

      {tab === 'simulados' && (
        <Card>
          <CardContent className="p-0">
            {simulados.length === 0 ? (
              <p className="text-muted p-4 text-sm">Nenhum simulado desta matéria ainda.</p>
            ) : (
              <ul className="divide-border divide-y">
                {simulados.map((attempt) => (
                  <li key={attempt.attemptId}>
                    <Link
                      href={`/estudar/${attempt.resourceId}/resultado?tentativa=${attempt.attemptId}`}
                      className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{attempt.resourceTitle}</p>
                        <p className="text-subtle text-xs">
                          {new Date(attempt.finishedAt).toLocaleDateString('pt-BR')} ·{' '}
                          {attempt.correctCount}/{attempt.totalCount} acertos
                        </p>
                      </div>
                      <span className="tabular text-sm font-semibold">
                        {Math.round(attempt.percent)}%
                      </span>
                      <RotateCcw className="text-subtle size-4 shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
