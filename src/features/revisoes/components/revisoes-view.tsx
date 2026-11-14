'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleAlert,
  Flame,
  GraduationCap,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Markdown } from '@/features/study/components/markdown';
import { PopEmptyState, popEmptyStateActionClass } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { subjectColorVars } from '@/lib/design/subject-colors';
import { RESOURCE_KIND_ICON } from '@/lib/design/resource-kind';
import { dismissError, explainMyError, markContentReviewed } from '../server/actions';
import type { ReviewItem } from '../server/queries';

/**
 * Erros e revisões (Nexa Study e Nexa Vestibular, cada um com a própria fila).
 *
 * O que mudou na repaginação: erros de questão e conteúdos de revisão espaçada deixaram de vir misturados
 * numa lista só. No topo, o resumo do dia (quanto falta e o progresso); depois, um seletor Tudo / Erros /
 * Conteúdos, as abas por prazo (atrasadas, hoje, próximas, feitas) e a lista agrupada por matéria.
 */

const PAGE_SIZE = 8;
const BUCKETS: ReviewItem['bucket'][] = ['atrasada', 'hoje', 'proxima', 'concluida'];

const BUCKET_META: Record<ReviewItem['bucket'], { tab: string; description: string }> = {
  atrasada: {
    tab: 'Atrasadas',
    description:
      'Já passou do dia: quanto antes revisar, melhor. O que passa de 7 dias sem revisão sai da fila sozinho.',
  },
  hoje: { tab: 'Hoje', description: 'Para revisar ainda hoje.' },
  proxima: { tab: 'Próximas', description: 'Chegando nos próximos dias.' },
  concluida: { tab: 'Feitas', description: 'Já revisado hoje. A próxima vez está agendada.' },
};

type Kind = 'tudo' | ReviewItem['kind'];

function itemKey(item: ReviewItem): string {
  return item.kind === 'erro' ? `erro:${item.questionId}` : `conteudo:${item.resourceId}`;
}

export function RevisoesView({
  items,
  currentStreak,
  platform = 'school',
  redo,
}: {
  items: ReviewItem[];
  currentStreak: number;
  platform?: 'school' | 'vestibular';
  /** Ação extra do topo (no Vestibular: "Refazer meus erros"). */
  redo?: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, remove] = useOptimistic(items, (state, key: string) =>
    state.filter((item) => itemKey(item) !== key),
  );
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>('tudo');
  const [tab, setTab] = useState<ReviewItem['bucket'] | null>(null);
  const [subject, setSubject] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  const vestibular = platform === 'vestibular';
  const ofKind = optimistic.filter((i) => kind === 'tudo' || i.kind === kind);
  const count = (b: ReviewItem['bucket'], list = ofKind) =>
    list.filter((i) => i.bucket === b).length;

  // Progresso de hoje: o que já foi feito ÷ (feito + o que vence até hoje).
  const doneToday = count('concluida', optimistic);
  const dueNow = count('atrasada', optimistic) + count('hoje', optimistic);
  const progress =
    doneToday + dueNow === 0 ? 0 : Math.round((doneToday / (doneToday + dueNow)) * 100);
  const errorsOpen = optimistic.filter((i) => i.kind === 'erro' && i.bucket !== 'concluida').length;
  const contentsOpen = optimistic.filter(
    (i) => i.kind === 'conteudo' && i.bucket !== 'concluida',
  ).length;

  if (optimistic.length === 0) {
    return (
      <div className="max-w-3xl space-y-4 px-4 pt-6 pb-8 md:px-6 lg:px-8">
        {redo}
        <PopEmptyState
          tone="success"
          icon={<Check className="text-white" strokeWidth={3} />}
          title="Nada para revisar agora"
          description={
            vestibular
              ? 'Questões de vestibular que você errar e conteúdos concluídos aparecem aqui na hora certa de revisar.'
              : 'Questões que você errar e conteúdos concluídos aparecem aqui na hora certa de revisar.'
          }
          action={
            <Link
              href={vestibular ? '/vestibular/questoes' : '/estudar'}
              className={popEmptyStateActionClass}
            >
              <GraduationCap className="text-brand size-4" aria-hidden />
              {vestibular ? 'Treinar questões' : 'Ir estudar'}
            </Link>
          }
        />
      </div>
    );
  }

  const activeTab: ReviewItem['bucket'] =
    tab ??
    (count('atrasada') > 0
      ? 'atrasada'
      : count('hoje') > 0
        ? 'hoje'
        : count('proxima') > 0
          ? 'proxima'
          : 'concluida');

  const subjects = [...new Map(ofKind.map((i) => [i.subjectId, i.subjectName])).entries()].sort(
    (a, b) => a[1].localeCompare(b[1], 'pt-BR'),
  );
  const filtered = ofKind.filter(
    (i) => i.bucket === activeTab && (!subject || i.subjectId === subject),
  );
  const visible = filtered.slice(0, shown);

  // Agrupa a página visível por matéria, mantendo a ordem de chegada.
  const groups: { id: string; name: string; color: string; items: ReviewItem[] }[] = [];
  for (const item of visible) {
    let g = groups.find((x) => x.id === item.subjectId);
    if (!g) {
      g = { id: item.subjectId, name: item.subjectName, color: item.subjectColor, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }

  function pickTab(next: ReviewItem['bucket']) {
    setTab(next);
    setShown(PAGE_SIZE);
  }
  function pickKind(next: Kind) {
    setKind(next);
    setTab(null);
    setSubject('');
    setShown(PAGE_SIZE);
  }

  const review = (item: ReviewItem) =>
    startTransition(async () => {
      remove(itemKey(item));
      const result = await markContentReviewed(item.resourceId, item.nextIntervalStep);
      if (!result.ok) {
        setError('Não consegui salvar. Tente de novo.');
        router.refresh();
      }
    });
  const dismiss = (item: ReviewItem) =>
    startTransition(async () => {
      remove(itemKey(item));
      const result = item.questionId ? await dismissError(item.questionId) : { ok: true };
      if (!result.ok) {
        setError('Não consegui salvar. Tente de novo.');
        router.refresh();
      }
    });

  return (
    <div className="max-w-3xl space-y-5 px-4 pt-4 pb-8 md:px-6 lg:px-8">
      {/* Resumo do dia */}
      <section
        className={cn(
          'relative overflow-hidden rounded-3xl p-5 text-white',
          vestibular
            ? 'bg-[linear-gradient(135deg,#1e2a78_0%,#2b3fc4_55%,#1aa0c8_100%)]'
            : 'bg-[linear-gradient(135deg,#3a1fa8_0%,#6d4aff_55%,#17bfe0_100%)]',
        )}
      >
        <p className="text-xs font-semibold tracking-wider text-white/75 uppercase">
          {vestibular ? 'Nexa Vestibular' : 'Nexa Study'} · hoje
        </p>
        <p className="mt-1 text-2xl leading-tight font-bold">
          {dueNow === 0
            ? 'Tudo em dia!'
            : `${dueNow} ${dueNow === 1 ? 'item' : 'itens'} para revisar`}
        </p>
        <p className="mt-1 text-sm text-white/80">
          {dueNow === 0
            ? 'Você zerou o que vencia hoje. Aproveite para adiantar as próximas.'
            : 'Comece pelas atrasadas: é o que mais rende agora.'}
        </p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20" aria-hidden>
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-white/80">
          {doneToday} {doneToday === 1 ? 'feita' : 'feitas'} hoje · {progress}% do dia
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <HeroStat icon={Flame} value={currentStreak} label="dias seguidos" />
          <HeroStat icon={CircleAlert} value={errorsOpen} label="erros abertos" />
          <HeroStat icon={BookOpenCheck} value={contentsOpen} label="conteúdos" />
        </div>
      </section>

      {redo}

      {/* Tipo: tudo, erros ou conteúdos */}
      <div role="tablist" aria-label="Tipo de revisão" className="grid grid-cols-3 gap-2">
        {(
          [
            ['tudo', 'Tudo', Layers, optimistic.length],
            ['erro', 'Erros', Target, optimistic.filter((i) => i.kind === 'erro').length],
            [
              'conteudo',
              'Conteúdos',
              BookOpenCheck,
              optimistic.filter((i) => i.kind === 'conteudo').length,
            ],
          ] as const
        ).map(([value, label, Icon, n]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => pickKind(value)}
            className={cn(
              'inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2 text-sm font-semibold transition-colors',
              kind === value
                ? 'border-brand bg-brand text-brand-fg'
                : 'border-border bg-surface text-muted hover:text-text',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            <span
              className={cn(
                'tabular rounded-full px-1.5 text-xs',
                kind === value ? 'bg-white/20' : 'bg-surface-2',
              )}
            >
              {n}
            </span>
          </button>
        ))}
      </div>

      {/* Prazo */}
      <div
        role="tablist"
        aria-label="Prazo"
        className="bg-surface-2 grid grid-cols-4 gap-1 rounded-2xl p-1"
      >
        {BUCKETS.map((bucket) => (
          <button
            key={bucket}
            type="button"
            role="tab"
            aria-selected={activeTab === bucket}
            onClick={() => pickTab(bucket)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-xs font-medium transition-colors',
              activeTab === bucket ? 'bg-surface text-brand-text shadow-sm' : 'text-muted',
              bucket === 'atrasada' &&
                count('atrasada') > 0 &&
                activeTab !== bucket &&
                'text-danger',
            )}
          >
            <span className="tabular text-base leading-none font-semibold">{count(bucket)}</span>
            <span className="truncate">{BUCKET_META[bucket].tab}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted text-xs">{BUCKET_META[activeTab].description}</p>
        {subjects.length > 1 && (
          <label className="relative">
            <span className="sr-only">Filtrar por matéria</span>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setShown(PAGE_SIZE);
              }}
              className="border-border bg-surface h-9 appearance-none rounded-full border pr-8 pl-3 text-xs font-semibold"
            >
              <option value="">Todas as matérias</option>
              {subjects.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="text-subtle pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2"
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          Nada por aqui{subject ? ' nesta matéria' : ''}.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.id} style={subjectColorVars(g.color)} aria-label={g.name}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--subject-base)' }}
                />
                {g.name}
                <span className="text-subtle text-xs font-medium">{g.items.length}</span>
              </h3>
              <ul className="space-y-2">
                {g.items.map((item) =>
                  item.kind === 'erro' ? (
                    <ErrorCard key={itemKey(item)} item={item} onDismiss={() => dismiss(item)} />
                  ) : (
                    <ContentCard key={itemKey(item)} item={item} onReview={() => review(item)} />
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {filtered.length > visible.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className={popEmptyStateActionClass}
        >
          Ver mais ({filtered.length - visible.length})
        </button>
      )}
    </div>
  );
}

function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Flame;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur-sm">
      <Icon className="size-4 text-white/80" aria-hidden />
      <p className="tabular mt-1 text-lg leading-none font-bold">{value}</p>
      <p className="text-[11px] leading-tight text-white/75">{label}</p>
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
    <li className="border-border bg-surface relative overflow-hidden rounded-[20px] border">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: 'var(--subject-base)' }}
      />
      <div className="py-3 pr-3 pl-5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-start gap-3 text-left"
        >
          <span
            aria-hidden
            className="bg-danger-soft text-danger mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl"
          >
            <Target className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-danger text-[11px] font-semibold tracking-wide uppercase">
              Questão que você errou
            </span>
            <span
              className={cn('block text-sm leading-snug font-semibold', !open && 'line-clamp-2')}
            >
              {item.statement}
            </span>
            <span className="text-subtle mt-1 block truncate text-xs">
              {item.resourceTitle}
              {item.topicName ? ` · ${item.topicName}` : ''}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'text-subtle mt-1 size-4 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {open && (
          <div className="mt-3 space-y-3 pl-11">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {item.chosenBody && (
                <p className="bg-danger-soft rounded-xl px-3 py-2">
                  <span className="text-danger flex items-center gap-1 text-[11px] font-semibold uppercase">
                    <X className="size-3" aria-hidden /> Sua resposta
                  </span>
                  <span className="font-medium">{item.chosenBody}</span>
                </p>
              )}
              {item.correctBody && (
                <p className="bg-success-soft rounded-xl px-3 py-2">
                  <span className="text-success flex items-center gap-1 text-[11px] font-semibold uppercase">
                    <Check className="size-3" aria-hidden /> Resposta certa
                  </span>
                  <span className="font-medium">{item.correctBody}</span>
                </p>
              )}
            </div>

            {item.explanation && (
              <div className="text-muted border-l-2 border-current/20 pl-3 text-sm leading-relaxed">
                <Markdown source={item.explanation} />
              </div>
            )}

            {why && (
              <div
                aria-live="polite"
                className="bg-brand-soft text-text rounded-xl px-3.5 py-3 text-sm leading-relaxed"
              >
                {'error' in why ? (
                  <p className="text-danger">{why.error}</p>
                ) : (
                  <Markdown source={why.text} />
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {item.questionId && !why && (
                <button
                  type="button"
                  onClick={askWhy}
                  disabled={asking}
                  className={cn(popEmptyStateActionClass, 'text-brand-text')}
                >
                  {asking ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="size-4" aria-hidden />
                  )}
                  {asking ? 'Pensando…' : 'Por que errei?'}
                </button>
              )}
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
                Dominei
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * "2026-11-08" → "08/11", sem passar por Date: `new Date('2026-11-08')` é meia-noite UTC e, no fuso do Brasil,
 * aparecia como o dia anterior (e o servidor, em UTC, desenhava um dia diferente do celular).
 */
function diaMes(iso: string): string {
  const [, m, d] = /^\d{4}-(\d{2})-(\d{2})/.exec(iso) ?? [];
  return d && m ? `${d}/${m}` : iso;
}

function ContentCard({ item, onReview }: { item: ReviewItem; onReview: () => void }) {
  const Icon = item.resourceKind ? RESOURCE_KIND_ICON[item.resourceKind] : GraduationCap;
  const date = diaMes(item.dueDate);
  const due =
    item.bucket === 'atrasada'
      ? { label: `Atrasada desde ${date}`, cls: 'bg-danger-soft text-danger' }
      : item.bucket === 'hoje'
        ? { label: 'Revisar hoje', cls: 'bg-warning-soft text-warning' }
        : item.bucket === 'concluida'
          ? { label: `Feita · próxima em ${date}`, cls: 'bg-success-soft text-success' }
          : { label: `Em ${date}`, cls: 'bg-surface-2 text-muted' };

  return (
    <li className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-3.5">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ background: 'var(--subject-soft)', color: 'var(--subject-on-soft)' }}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug font-semibold">{item.resourceTitle}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn('rounded-full px-2 py-0.5 font-semibold', due.cls)}>{due.label}</span>
          {item.topicName && <span className="text-subtle truncate">{item.topicName}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={`/estudar/${item.resourceId}`}
          className="text-muted hover:text-text hover:bg-surface-2 grid size-9 place-items-center rounded-full"
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
