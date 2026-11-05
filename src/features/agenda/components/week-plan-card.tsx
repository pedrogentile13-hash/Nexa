import Link from 'next/link';
import { CalendarCheck, GraduationCap } from 'lucide-react';
import type { PlanDay } from '../lib/week-plan';

const WEEKDAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', timeZone: 'UTC' });

/** "Plano da semana": o que estudar em cada dia, e por quê. */
export function WeekPlanCard({ plan, today }: { plan: PlanDay[]; today: string }) {
  const filled = plan.filter((d) => d.blocks.length > 0);
  if (filled.length === 0) return null;

  return (
    <details className="group border-border bg-surface mb-4 rounded-2xl border p-4" aria-label="Plano da semana">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <CalendarCheck className="text-brand size-4" aria-hidden /> Plano da semana
        <span className="text-muted ml-auto text-xs font-normal group-open:hidden">{filled.length} dias · toque para ver</span>
      </summary>
      <p className="text-muted mt-2 text-xs">Montado com seus assuntos mais fracos e as provas marcadas.</p>
      <ol className="mt-3 space-y-2.5">
        {filled.map((d) => (
          <li key={d.date} className="flex gap-3">
            <span className={`w-14 shrink-0 text-xs font-semibold capitalize ${d.date === today ? 'text-brand-text' : 'text-muted'}`}>
              {d.date === today ? 'Hoje' : WEEKDAY.format(new Date(`${d.date}T00:00:00Z`)).replace('.', '')}
            </span>
            <ul className="min-w-0 flex-1 space-y-1.5">
              {d.blocks.map((b, i) => (
                <li key={i} className="bg-surface-2 rounded-xl px-3 py-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {b.kind === 'prova' && <GraduationCap className="text-warning size-3.5 shrink-0" aria-hidden />}
                    <span className="truncate">{b.label}</span>
                    <span className="text-muted ml-auto shrink-0 text-xs">{b.minutes} min</span>
                  </p>
                  <p className="text-muted text-xs">
                    {b.subjectName} · {b.reason}
                  </p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <Link href="/estudar" className="text-brand-text mt-3 inline-block text-xs font-semibold">
        Ir estudar
      </Link>
    </details>
  );
}
