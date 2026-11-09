'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock3, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { PopEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { ExamBankItem } from '../lib/exam-bank';
import { ExamCover } from './exam-cover';

type Kind = 'all' | 'official' | 'mock';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Banco de provas: cartões com a capa do caderno, filtros no topo e tudo
 * alinhado à esquerda. Filtra no cliente (a lista já vem limitada).
 */
export function ExamBank({ items }: { items: ExamBankItem[] }) {
  const [q, setQ] = useState('');
  const [exam, setExam] = useState('');
  const [year, setYear] = useState('');
  const [kind, setKind] = useState<Kind>('all');

  const exams = useMemo(() => [...new Set(items.map((i) => i.examName).filter((n): n is string => Boolean(n)))].sort(), [items]);
  const years = useMemo(() => [...new Set(items.map((i) => i.year).filter((y): y is number => y !== null))].sort((a, b) => b - a), [items]);

  const visible = items.filter(
    (i) =>
      (!exam || i.examName === exam) &&
      (!year || String(i.year) === year) &&
      (kind === 'all' || (kind === 'official' ? i.official : !i.official)) &&
      (!q.trim() || norm(`${i.title} ${i.examName ?? ''} ${i.subjectName ?? ''}`).includes(norm(q))),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de prova">
        <Chip active={kind === 'all'} onClick={() => setKind('all')}>Todas</Chip>
        <Chip active={kind === 'official'} onClick={() => setKind('official')}>Provas anteriores</Chip>
        <Chip active={kind === 'mock'} onClick={() => setKind('mock')}>Simulados inspirados</Chip>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_10rem]">
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Buscar prova</span>
          <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por prova, ano ou matéria"
            className="border-border bg-surface text-text focus-visible:ring-brand h-11 w-full rounded-xl border pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
          />
        </label>
        <select
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          aria-label="Vestibular"
          className="border-border bg-surface text-text h-11 rounded-xl border px-3 text-sm outline-none"
        >
          <option value="">Todos os vestibulares</option>
          {exams.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Ano"
          className="border-border bg-surface text-text h-11 rounded-xl border px-3 text-sm outline-none"
        >
          <option value="">Todos os anos</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <PopEmptyState
          icon={<Clock3 className="size-6 text-white" aria-hidden />}
          title="As provas estão chegando"
          description="Assim que as provas e os simulados forem publicados, eles aparecem aqui."
        />
      ) : visible.length === 0 ? (
        <p className="text-muted py-6 text-sm">Nada com esses filtros. Tente afrouxar um deles.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((i) => (
            <li key={i.key}>
              <ExamCard item={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExamCard({ item: i }: { item: ExamBankItem }) {
  const soon = i.resourceId === null;
  return (
    <article className={cn('border-border bg-surface flex h-full gap-4 rounded-2xl border p-3 sm:p-4', soon && 'opacity-80')}>
      <div className="w-28 shrink-0">
        <ExamCover examName={i.examName} year={i.year} label={i.coverLabel} coverUrl={i.coverUrl} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[0.95rem] leading-snug font-semibold">{i.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {soon ? (
            <Badge variant="neutral">Ainda sem questões</Badge>
          ) : (
            <Badge variant={i.official ? 'brand' : 'neutral'}>{i.official ? 'Prova anterior' : 'Simulado inspirado'}</Badge>
          )}
          {i.subjectName && <Badge>{i.subjectName}</Badge>}
          {i.questionCount > 0 && <Badge>{i.questionCount} {i.questionCount === 1 ? 'questão' : 'questões'}</Badge>}
          {i.bestPercent !== null && <Badge variant={i.bestPercent >= 60 ? 'success' : 'warning'}>Melhor: {i.bestPercent}%</Badge>}
        </div>
        <div className="mt-auto pt-4">
          {soon ? (
            <span className="bg-surface-2 text-muted inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold">Em breve</span>
          ) : (
            <Link
              href={`/estudar/${i.resourceId}`}
              className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors"
            >
              Acessar
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
