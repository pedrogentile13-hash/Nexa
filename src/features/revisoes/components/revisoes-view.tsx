'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { Check, ChevronDown, Flame, GraduationCap, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { RESOURCE_KIND_ICON } from '@/lib/design/resource-kind';
import { dismissError, explainMyError, markContentReviewed } from '../server/actions';
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

const PAGE_SIZE = 6;
const BUCKETS: ReviewItem['bucket'][] = ['atrasada', 'hoje', 'proxima', 'concluida'];

const BUCKET_META: Record<ReviewItem['bucket'], { title: string; tab: string; description: string }> = {
  atrasada: {
    title: 'Atrasadas',
    tab: 'Atrasadas',
    description: 'Já passou do dia — o quanto antes revisar, melhor.',
  },
  hoje: { title: 'Hoje', tab: 'Hoje', description: 'Para revisar ainda hoje.' },
  proxima: { title: 'Próximas', tab: 'Próximas', description: 'Chegando nos próximos dias.' },
  concluida: {
    title: 'Concluídas hoje',
    tab: 'Feitas',
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

  const [tab, setTab] = useState<ReviewItem['bucket'] | null>(null);
  const [subject, setSubject] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  const counts = {
    atrasada: optimistic.filter((i) => i.bucket === 'atrasada').length,
    hoje: optimistic.filter((i) => i.bucket === 'hoje').length,
    proxima: optimistic.filter((i) => i.bucket === 'proxima').length,
    concluida: optimistic.filter((i) => i.bucket === 'concluida').length,
  };

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

  // Aba padrão: o mais urgente que existe (atrasadas → hoje → próximas → feitas).
  const activeTab: ReviewItem['bucket'] =
    tab ?? (counts.atrasada > 0 ? 'atrasada' : counts.hoje > 0 ? 'hoje' : counts.proxima > 0 ? 'proxima' : 'concluida');

  const subjects = [...new Map(optimistic.map((i) => [i.subjectId, i.subjectName])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1], 'pt-BR'),
  );
  const filtered = optimistic.filter((i) => i.bucket === activeTab && (!subject || i.subjectId === subject));
  const visible = filtered.slice(0, shown);

  function pick(next: ReviewItem['bucket']) {
    setTab(next);
    setShown(PAGE_SIZE);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4 pb-8">
      <section className="grid grid-cols-3 gap-2">
        <MiniStat icon={Flame} value={String(currentStreak)} label="Sequência" />
        <MiniStat icon={Check} value={String(counts.concluida)} label="Revisados hoje" />
        <MiniStat icon={RotateCcw} value={String(counts.atrasada)} label="Atrasadas" />
      </section>

      <div role="tablist" aria-label="Situação das revisões" className="bg-surface-2 grid grid-cols-4 gap-1 rounded-2xl p-1">
        {BUCKETS.map((bucket) => (
          <button
            key={bucket}
            type="button"
            role="tab"
            aria-selected={activeTab === bucket}
            onClick={() => pick(bucket)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-xs font-medium transition-colors',
              activeTab === bucket ? 'bg-surface text-brand-text shadow-sm' : 'text-muted',
            )}
          >
            <span className="tabular text-base leading-none font-semibold">{counts[bucket]}</span>
            <span className="truncate">{BUCKET_META[bucket].tab}</span>
          </button>
        ))}
      </div>

      {subjects.length > 1 && (
        <label className="relative block">
          <span className="sr-only">Filtrar por matéria</span>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setShown(PAGE_SIZE);
            }}
            className="border-border bg-surface h-11 w-full appearance-none rounded-xl border pr-9 pl-3 text-sm font-medium"
          >
            <option value="">Todas as matérias</option>
            {subjects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="text-subtle pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </label>
      )}

      {error && <p className="text-danger text-sm">{error}</p>}
      <p className="text-muted text-xs">{BUCKET_META[activeTab].description}</p>

      {filtered.length === 0 ? (
        <p className="text-muted py-6 text-center text-sm">Nada por aqui{subject ? ' nesta matéria' : ''}.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) =>
            item.kind === 'erro' ? (
              <ErrorCard
                key={itemKey(item)}
                item={item}
                onDismiss={() =>
                  startTransition(async () => {
                    remove(itemKey(item));
                    const result = item.questionId ? await dismissError(item.questionId) : { ok: true };
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
                    const result = await markContentReviewed(item.resourceId, item.nextIntervalStep);
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
      )}

      {filtered.length > visible.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className={cn(popEmptyStateActionClass, 'mx-auto')}
        >
          Ver mais ({filtered.length - visible.length})
        </button>
      )}
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
  const [why, setWhy] = useState<{ text: string } | { error: string } | null>(null);
  const [asking, startAsk] = useTransition();
  const [open, setOpen] = useState(false);

  function askWhy() {
    if (!item.questionId) return;
    const id = item.questionId;
    startAsk(async () => {
      const r = await explainMyError(id);
      setWhy(r.ok ? { text: r.markdown } : { error: r.message });
    });
  }

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
      <div className="py-3 pr-3 pl-5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-2 text-left">
          <span className="min-w-0 flex-1">
            <span className={cn('block text-sm leading-snug font-semibold', !open && 'line-clamp-2')}>{item.statement}</span>
            <span className="text-subtle mt-1 block truncate text-xs">
              {item.subjectName}
              {item.topicName ? ` · ${item.topicName}` : ''}
            </span>
          </span>
          <ChevronDown className={cn('text-subtle mt-0.5 size-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>

        {open && (
          <div className="mt-3 space-y-3">
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
              <p className="text-muted border-l-2 border-current/20 pl-3 text-sm leading-relaxed">{item.explanation}</p>
            )}

            {why && (
              <div aria-live="polite" className="bg-brand-soft text-text rounded-xl px-3.5 py-3 text-sm leading-relaxed">
                {'error' in why ? <p className="text-danger">{why.error}</p> : <Markdown source={why.text} />}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {item.questionId && !why && (
                <button type="button" onClick={askWhy} disabled={asking} className={cn(popEmptyStateActionClass, 'text-brand-text')}>
                  {asking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                  {asking ? 'Pensando…' : 'Por que errei?'}
                </button>
              )}
              <Link href={`/estudar/${item.resourceId}`} className={popEmptyStateActionClass}>
                <RotateCcw className="text-brand size-4" aria-hidden />
                Refazer
              </Link>
              <button type="button" onClick={onDismiss} className={cn(popEmptyStateActionClass, 'text-muted hover:text-success')}>
                <Check className="size-4" aria-hidden />
                Dominei
              </button>
            </div>
          </div>
        )}
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
        <p className="line-clamp-2 text-sm leading-snug font-semibold">{item.resourceTitle}</p>
        <p className="text-muted line-clamp-2 text-xs">
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
