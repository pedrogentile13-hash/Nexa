import Link from 'next/link';
import { CalendarClock, ClipboardCheck, PenLine, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatTile } from '@/components/ui/stat-tile';
import type { VestibularOverview } from '../server/queries';

/**
 * Painel do /vestibular.
 *
 * A contagem regressiva só aparece quando existe uma data de prova cadastrada
 * de verdade (`exam_editions.application_date`) — sem data, o card vira um
 * aviso honesto em vez de um contador inventado.
 */
export function VestibularDashboard({ overview }: { overview: VestibularOverview }) {
  const { daysUntil, examName, editionYear, applicationDate } = overview;

  return (
    <div className="space-y-4">
      <div className="border-border bg-surface rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-xl">
            <CalendarClock className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">
              {examName ?? 'Seu vestibular'}
              {editionYear ? ` ${editionYear}` : ''}
            </p>
            {daysUntil !== null && daysUntil >= 0 ? (
              <p className="text-muted mt-1 text-sm">
                Faltam{' '}
                <strong className="text-brand-text tabular text-lg">{daysUntil}</strong>{' '}
                {daysUntil === 1 ? 'dia' : 'dias'}
                {applicationDate
                  ? ` — prova em ${new Date(`${applicationDate}T12:00:00`).toLocaleDateString('pt-BR')}`
                  : ''}
              </p>
            ) : (
              <p className="text-muted mt-1 text-sm leading-relaxed">
                A data desta edição ainda não foi cadastrada — a contagem regressiva aparece assim
                que ela existir.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Target}
          value={overview.questionsAnswered.toLocaleString('pt-BR')}
          label="Questões resolvidas"
        />
        <StatTile
          icon={Target}
          value={overview.accuracyPercent !== null ? `${overview.accuracyPercent}%` : '—'}
          label="Taxa de acertos"
        />
        <StatTile
          icon={ClipboardCheck}
          value={(overview.simuladosDone + overview.practicesDone).toLocaleString('pt-BR')}
          label="Provas e treinos"
        />
        <StatTile
          icon={PenLine}
          value={overview.essaysSubmitted.toLocaleString('pt-BR')}
          label="Redações entregues"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Praticar agora</p>
            <p className="text-muted text-sm">Treino avulso ou uma prova anterior inteira.</p>
          </div>
          <Button asChild>
            <Link href="/vestibular/questoes">Ver questões</Link>
          </Button>
        </div>

        <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Central de erros</p>
            <p className="text-muted text-sm">O que você ainda erra, pronto pra refazer.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/vestibular/erros">Ver erros</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
