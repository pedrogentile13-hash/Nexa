'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClipboardCheck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PopEmptyState } from '@/components/ui/empty-state';
import type { VestibularResource } from '../server/queries';

/**
 * Lista de conteúdo de vestibular. Filtra no cliente porque a RPC já devolve
 * um conjunto pequeno (limite de 60) — voltar ao servidor a cada clique de
 * filtro seria um round-trip sem ganho nenhum aqui.
 *
 * Cada item abre no runner que JÁ existe (`/estudar/[id]`): quem responde uma
 * prova do ENEM usa exatamente o mesmo player, cronômetro e correção de um
 * simulado da escola.
 */
export function VestibularResourceList({ resources }: { resources: VestibularResource[] }) {
  const [exam, setExam] = useState('');
  const [subject, setSubject] = useState('');

  const exams = useMemo(
    () => [...new Set(resources.map((r) => r.examName).filter((n): n is string => Boolean(n)))].sort(),
    [resources],
  );
  const subjects = useMemo(
    () => [...new Set(resources.map((r) => r.subjectName))].sort(),
    [resources],
  );

  const visible = resources.filter(
    (r) => (!exam || r.examName === exam) && (!subject || r.subjectName === subject),
  );

  if (resources.length === 0) {
    return (
      <PopEmptyState
        icon={<ClipboardCheck className="size-6 text-white" aria-hidden />}
        title="Nenhum conteúdo de vestibular ainda"
        description="Assim que provas e simulados forem publicados para vestibular, eles aparecem aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          aria-label="Filtrar por vestibular"
          className="border-border bg-surface text-text h-10 rounded-md border px-3 text-sm outline-none"
        >
          <option value="">Todos os vestibulares</option>
          {exams.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Filtrar por matéria"
          className="border-border bg-surface text-text h-10 rounded-md border px-3 text-sm outline-none"
        >
          <option value="">Todas as matérias</option>
          {subjects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted py-10 text-center text-sm">
          Nada com esses filtros — tenta afrouxar um deles.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`/estudar/${r.id}`}
                className="border-border bg-surface hover:bg-surface-2 flex items-start gap-3 rounded-2xl border p-4 transition-colors"
              >
                <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
                  {r.kind === 'simulado' ? (
                    <ClipboardCheck className="size-4.5" aria-hidden />
                  ) : (
                    <FileText className="size-4.5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    {[
                      r.examName && r.editionYear ? `${r.examName} ${r.editionYear}` : r.examName,
                      r.subjectName,
                      r.questionCount > 0
                        ? `${r.questionCount} ${r.questionCount === 1 ? 'questão' : 'questões'}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {r.myBestPercent !== null && (
                  <Badge variant={r.myBestPercent >= 60 ? 'success' : 'neutral'}>
                    {r.myBestPercent}%
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
