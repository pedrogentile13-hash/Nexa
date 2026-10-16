'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { Check, Flame, GraduationCap, RotateCcw } from 'lucide-react';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { RESOURCE_KIND_ICON } from '@/lib/design/resource-kind';
import { dismissError, markContentReviewed } from '../server/actions';
import type { ReviewItem } from '../server/queries';

/**
 * Revisões — substitui a Central de Erros.
 *
 * Quatro seções, sempre nesta ordem: atrasadas (mais urgente), hoje,
 * próximas (só até 2 semanas — `review_queue()` já corta isso), concluídas
 * hoje (prova de que o trabalho foi feito, não some da tela assim que
 * confirmado). Erro de questão é sempre "hoje" — igual à Central de Erros de
 * antes, só que agora ao lado de conteúdo revisado por repetição espaçada.
 */

const BUCKET_META: Record<ReviewItem['bucket'], { title: string; description: string }> = {
  atrasada: {
    title: 'Atrasadas',
    description: 'Já passou do dia — o quanto antes revisar, melhor.',
  },
  hoje: { title: 'Hoje', description: 'Para revisar ainda hoje.' },
  proxima: { title: 'Próximas', description: 'Chegando nos próximos dias.' },
  concluida: {
    title: 'Concluídas hoje',
    description: 'Já revisado — a próxima vez está agendada.',
  },
};

function itemKey(item: ReviewItem): string {
  return item.kind === 'erro' ? `erro:${item.questionId}` : `conteudo:${item.resourceId}`;
}

export function RevisoesView({
  items,
  currentStreak,
}: {
  items: ReviewItem[];
  currentStreak: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, remove] = useOptimistic(items, (state, key: string) =>
    state.filter((item) => itemKey(item) !== key),
  );
  const [error, setError] = useState<string | null>(null);

  const reviewedToday = optimistic.filter((i) => i.bucket === 'concluida').length;
  const overdueCount = optimistic.filter((i) => i.bucket === 'atrasada').length;

  if (optimistic.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-8">
        <PopEmptyState
          tone="success"
          icon={<Check className="text-white" strokeWidth={3} />}
          title="Nenhuma revisão pendente"
          description="Questões erradas e conteúdo concluído aparecem aqui quando chega a hora de revisar."
          action={
            <Link href="/estudar" className={popEmptyStateActionClass}>
              <GraduationCap className="text-brand size-4" aria-hidden />
              Ir estudar
            </Link>
          }
        />
      </div>
    );
  }

  const buckets: ReviewItem['bucket'][] = ['atrasada', 'hoje', 'proxima', 'concluida'];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pt-4 pb-8">
      <section className="grid grid-cols-3 gap-2">
        <MiniStat icon={Flame} value={String(currentStreak)} label="Sequência" />
        <MiniStat icon={Check} value={String(reviewedToday)} label="Revisados hoje" />
        <MiniStat icon={RotateCcw} value={String(overdueCount)} label="Atrasadas" />
      </section>

      {error && <p className="text-danger text-sm">{error}</p>}

      {buckets.map((bucket) => {
        const bucketItems = optimistic.filter((i) => i.bucket === bucket);
        if (bucketItems.length === 0) return null;
        const meta = BUCKET_META[bucket];
        return (
          <section key={bucket}>
            <h2 className="mb-1 text-sm font-semibold">
              {meta.title} · {bucketItems.length}
            </h2>
            <p className="text-muted mb-2 text-xs">{meta.description}</p>
            <ul className="space-y-2">
              {bucketItems.map((item) =>
                item.kind === 'erro' ? (
                  <ErrorCard
                    key={itemKey(item)}
                    item={item}
                    onDismiss={() =>
                      startTransition(async () => {
                        remove(itemKey(item));
                        const result = item.questionId
                          ? await dismissError(item.questionId)
                          : { ok: true };
                        if (!result.ok) {
                          setError('Não consegui salvar — tente de novo.');
                          router.refresh();
                        }
                      })
                    }
                  />
                ) : (
                  <ContentCard
                    key={itemKey(item)}
                    item={item}
                    onReview={() =>
                      startTransition(async () => {
                        remove(itemKey(item));
                        const result = await markContentReviewed(
                          item.resourceId,
                          item.nextIntervalStep,
                        );
                        if (!result.ok) {
                          setError('Não consegui salvar — tente de novo.');
                          router.refresh();
                        }
                      })
                    }
                  />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Flame;
  value: string;
  label: string;
}) {
  return (
    <div className="border-border bg-surface flex flex-col items-center gap-1 rounded-2xl border p-3 text-center">
      <Icon className="text-brand size-4" aria-hidden />
      <p className="tabular text-lg leading-none font-semibold">{value}</p>
      <p className="text-muted text-xs leading-tight">{label}</p>
    </div>
  );
}

function ErrorCard({ item, onDismiss }: { item: ReviewItem; onDismiss: () => void }) {
  return (
    <li
      style={subjectColorVars(item.subjectColor)}
      className="border-border bg-surface relative overflow-hidden rounded-[20px] border"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: 'var(--subject-base)' }}
      />
      <div className="space-y-3 py-3.5 pr-4 pl-5">
        <div>
          <p className="text-sm leading-snug font-semibold">{item.statement}</p>
          {item.topicName && <p className="text-subtle mt-1 text-xs">{item.topicName}</p>}
        </div>

        <div className="space-y-1 text-sm">
          {item.chosenBody && (
            <p className="text-danger">
              Você respondeu: <span className="font-medium">{item.chosenBody}</span>
            </p>
          )}
          {item.correctBody && (
            <p className="text-success">
              Resposta certa: <span className="font-medium">{item.correctBody}</span>
            </p>
          )}
        </div>

        {item.explanation && (
          <p className="text-muted border-l-2 border-current/20 pl-3 text-sm leading-relaxed">
            {item.explanation}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/estudar/${item.resourceId}`} className={popEmptyStateActionClass}>
            <RotateCcw className="text-brand size-4" aria-hidden />
            Refazer
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className={cn(popEmptyStateActionClass, 'text-muted hover:text-success')}
          >
            <Check className="size-4" aria-hidden />
            Marcar como dominado
          </button>
        </div>
      </div>
    </li>
  );
}

function ContentCard({ item, onReview }: { item: ReviewItem; onReview: () => void }) {
  const Icon = item.resourceKind ? RESOURCE_KIND_ICON[item.resourceKind] : GraduationCap;
  const dueLabel =
    item.bucket === 'atrasada'
      ? `Atrasada desde ${new Date(item.dueDate).toLocaleDateString('pt-BR')}`
      : item.bucket === 'hoje'
        ? 'Revisar hoje'
        : item.bucket === 'concluida'
          ? `Revisado hoje · próxima em ${new Date(item.dueDate).toLocaleDateString('pt-BR')}`
          : `Revisar em ${new Date(item.dueDate).toLocaleDateString('pt-BR')}`;

  return (
    <li
      style={subjectColorVars(item.subjectColor)}
      className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-3.5"
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ background: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.resourceTitle}</p>
        <p className="text-muted truncate text-xs">
          {item.subjectName}
          {item.topicName ? ` · ${item.topicName}` : ''} · {dueLabel}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={`/estudar/${item.resourceId}`}
          className="text-muted hover:text-text grid size-9 place-items-center rounded-full"
          aria-label="Rever conteúdo"
        >
          <RotateCcw className="size-4" aria-hidden />
        </Link>
        {item.bucket !== 'concluida' && (
          <button
            type="button"
            onClick={onReview}
            className="bg-brand-soft text-brand-text hover:bg-brand hover:text-brand-fg grid size-9 place-items-center rounded-full transition-colors"
            aria-label="Marcar como revisado"
          >
            <Check className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}
