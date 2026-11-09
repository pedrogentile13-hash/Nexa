import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  BookMarked,
  CalendarClock,
  ClipboardCheck,
  Flame,
  Library,
  PenLine,
  Play,
  RotateCcw,
  Route as RouteIcon,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { StudyPlanReason } from '@/types/database.types';
import type { ExamBankItem } from '../lib/exam-bank';
import type { VestibularHome } from '../server/queries';
import { ExamCover } from './exam-cover';

/**
 * A casa de quem está se preparando.
 *
 * A pergunta que esta tela responde é "o que eu faço agora?", não "como eu
 * estou indo?". Por isso o topo é a prova e o prazo ao lado de UMA ação
 * concreta; os números vêm depois, e por último os atalhos e as provas
 * recentes. Tudo alinhado à esquerda.
 *
 * Componente de servidor: é leitura pura, e o dado já chega pronto de
 * `vestibular_home()`.
 */

const REASON_LABEL: Record<StudyPlanReason, string> = {
  cai_muito_e_voce_erra: 'Cai muito e você erra',
  cai_muito: 'Cai muito na sua prova',
  voce_erra: 'Você tem errado aqui',
  reforco: 'Reforço',
};

export function VestibularHomeView({ home, recentExams }: { home: VestibularHome; recentExams: ExamBankItem[] }) {
  const firstName = home.fullName?.trim().split(/\s+/)[0] ?? null;
  const goalPercent =
    home.dailyGoalMinutes > 0 ? Math.min(100, Math.round((home.minutesToday / home.dailyGoalMinutes) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <CountdownHero home={home} firstName={firstName} />
        <NextAction home={home} />
      </div>

      <section aria-label="Seus números" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border-border bg-surface col-span-2 rounded-2xl border p-4 lg:col-span-1">
          <p className="text-muted text-xs font-medium">Meta de hoje</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {home.minutesToday}
            <span className="text-muted text-sm font-medium"> / {home.dailyGoalMinutes} min</span>
          </p>
          <Progress label="Progresso da meta diária" value={goalPercent} tone={goalPercent >= 100 ? 'success' : 'brand'} className="mt-2" />
        </div>
        <Stat
          Icon={Flame}
          value={String(home.streakDays)}
          label={home.streakDays === 1 ? 'dia seguido' : 'dias seguidos'}
          tone={home.streakDays > 0 ? 'warning' : 'neutral'}
        />
        <Stat Icon={TrendingUp} value={home.accuracyWeek !== null ? `${home.accuracyWeek}%` : '—'} label="acerto na semana" tone="neutral" />
        <Stat
          Icon={RotateCcw}
          value={String(home.pendingErrors)}
          label={home.pendingErrors === 1 ? 'erro para revisar' : 'erros para revisar'}
          tone={home.pendingErrors > 0 ? 'danger' : 'neutral'}
        />
      </section>

      {recentExams.length > 0 && (
        <section aria-label="Provas recentes">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold">Provas recentes</h2>
            <Link href="/vestibular/provas" className="text-brand-text inline-flex items-center gap-1 text-sm font-semibold hover:underline">
              Ver o banco de provas
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {recentExams.map((e) => (
              <li key={e.key} className="w-28 shrink-0 sm:w-32">
                <Link
                  href={e.resourceId ? (`/estudar/${e.resourceId}` as Route) : '/vestibular/provas'}
                  className="group block"
                >
                  <ExamCover examName={e.examName} year={e.year} label={e.coverLabel} coverUrl={e.coverUrl} className="transition-transform group-hover:-translate-y-0.5" />
                  <p className="mt-2 line-clamp-2 text-xs leading-snug font-semibold">{e.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Atalhos da preparação">
        <h2 className="mb-3 text-base font-semibold">Acesso rápido</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Shortcut href="/vestibular/plano" title="Plano de estudo" hint="Por onde começar" Icon={RouteIcon} />
          <Shortcut href="/vestibular/questoes" title="Treinar questões" hint="Monte um treino por matéria" Icon={ClipboardCheck} />
          <Shortcut href="/vestibular/provas" title="Banco de provas" hint="ENEM, FUVEST, UNESP e mais" Icon={Library} />
          <Shortcut href="/vestibular/redacao/temas" title="Banco de temas" hint="Temas reais e inspirados" Icon={BookMarked} />
          <Shortcut href="/vestibular/redacao" title="Minhas redações" hint="Seus laudos e sua evolução" Icon={PenLine} />
          <Shortcut href="/revisoes" title="Erros e revisões" hint="O que você ainda erra" Icon={RotateCcw} />
          <Shortcut href="/vestibular/desempenho" title="Desempenho" hint="Seu mapa de domínio" Icon={TrendingUp} />
          <Shortcut href="/nexa-ia" title="Pergunte à NexaAI" hint="Tire dúvidas de qualquer matéria" Icon={Sparkles} />
        </div>
      </nav>
    </div>
  );
}

function CountdownHero({ home, firstName }: { home: VestibularHome; firstName: string | null }) {
  const { daysUntil, examName, targetYear, targetCourse, targetInstitution, applicationDate } = home;
  const finalStretch = daysUntil !== null && daysUntil <= 60 && daysUntil >= 0;
  const goal = [targetCourse, targetInstitution].filter(Boolean).join(' · ');

  return (
    <section className="text-brand-fg relative overflow-hidden rounded-3xl p-5 md:p-6" style={{ background: 'var(--gradient-header)' }}>
      <p className="text-brand-fg/80 text-sm">{firstName ? `Bom estudo, ${firstName}.` : 'Bom estudo.'}</p>

      <p className="mt-1 text-xl font-bold">
        {examName ?? 'Seu vestibular'}
        {targetYear ? ` ${targetYear}` : ''}
      </p>
      {goal && <p className="text-brand-fg/80 text-sm">{goal}</p>}

      <div className="mt-5">
        {daysUntil !== null && daysUntil >= 0 ? (
          <>
            <p className="flex items-baseline gap-2">
              <span className="text-6xl leading-none font-bold tabular-nums">{daysUntil}</span>
              <span className="text-brand-fg/80 text-sm">{daysUntil === 1 ? 'dia restante' : 'dias restantes'}</span>
            </p>
            {applicationDate && (
              <p className="text-brand-fg/70 mt-2 flex items-center gap-1.5 text-xs">
                <CalendarClock className="size-3.5" aria-hidden />
                Prova em {new Date(`${applicationDate}T12:00:00`).toLocaleDateString('pt-BR')}
                {finalStretch && ' · reta final'}
              </p>
            )}
          </>
        ) : (
          /*
            Sem data cadastrada, um contador seria inventado. Dizer que falta
            o dado é mais útil que mostrar um número errado num lugar onde a
            pessoa vai confiar nele todo dia.
          */
          <p className="text-brand-fg/80 text-sm leading-snug">
            A data desta edição ainda não foi cadastrada. A contagem regressiva aparece assim que ela existir.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * O passo seguinte, em uma ação só.
 *
 * A ordem de prioridade é deliberada: terminar o que ficou pela metade vem
 * antes de começar coisa nova, e o assunto do plano vem antes dos erros
 * soltos, porque o plano já levou os erros em conta ao ordenar.
 */
function NextAction({ home }: { home: VestibularHome }) {
  if (home.openSessionId) {
    return (
      <ActionCard
        title="Você tem um treino em aberto"
        description="Continua de onde parou: as questões que você já respondeu ficaram salvas."
        href={`/vestibular/questoes/sessao/${home.openSessionId}`}
        cta="Continuar treino"
        Icon={Play}
      />
    );
  }

  if (home.nextTopicName) {
    return (
      <ActionCard
        title={home.nextTopicName}
        description={home.nextTopicSubject ?? 'Próximo assunto do seu plano'}
        badge={home.nextTopicReason ? REASON_LABEL[home.nextTopicReason] : undefined}
        href="/vestibular/plano"
        cta="Ver o plano"
        Icon={Target}
      />
    );
  }

  if (home.pendingErrors > 0) {
    return (
      <ActionCard
        title={`${home.pendingErrors} ${home.pendingErrors === 1 ? 'erro esperando' : 'erros esperando'}`}
        description="Refazer o que você errou é o estudo que mais rende por minuto."
        href="/revisoes"
        cta="Refazer erros"
        Icon={RotateCcw}
      />
    );
  }

  return (
    <ActionCard
      title="Comece pelo primeiro treino"
      description="Responda algumas questões para eu saber onde você está. O plano se monta a partir daí."
      href="/vestibular/questoes"
      cta="Treinar agora"
      Icon={Play}
    />
  );
}

/**
 * Genérico no `href` de propósito: o destino pode ser uma rota fixa
 * (`/vestibular/plano`) ou uma dinâmica montada na hora (a sessão em aberto).
 * `Route` sozinho só aceita as fixas, e o parâmetro de tipo é o que deixa as
 * rotas tipadas do Next validarem as duas sem `as`.
 */
function ActionCard<T extends string>({
  title,
  description,
  badge,
  href,
  cta,
  Icon,
}: {
  title: string;
  description: string;
  badge?: string;
  href: Route<T>;
  cta: string;
  Icon: typeof Target;
}) {
  return (
    <section className="border-brand/30 bg-brand-soft flex flex-col rounded-3xl border p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden className="bg-brand text-brand-fg grid size-11 shrink-0 place-items-center rounded-2xl">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-subtle text-xs font-semibold tracking-wide uppercase">Agora</p>
          <p className="text-brand-text text-lg leading-snug font-semibold">{title}</p>
          <p className="text-muted mt-0.5 text-sm leading-snug">{description}</p>
          {badge && (
            <Badge variant="danger" className="mt-2">
              {badge}
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-auto pt-5">
        <Link
          href={href}
          className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-11 w-fit items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors"
        >
          {cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function Stat({
  Icon,
  value,
  label,
  tone,
}: {
  Icon: typeof Flame;
  value: string;
  label: string;
  tone: 'warning' | 'danger' | 'neutral';
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <Icon className={cn('size-4', tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-subtle')} aria-hidden />
      <p className="mt-2 text-2xl leading-none font-bold tabular-nums">{value}</p>
      <p className="text-muted mt-1 text-xs leading-tight">{label}</p>
    </div>
  );
}

function Shortcut({ href, title, hint, Icon }: { href: Route; title: string; hint: string; Icon: typeof Target }) {
  return (
    <Link
      href={href}
      className="border-border bg-surface hover:bg-surface-2 flex items-center gap-3 rounded-2xl border p-4 transition-colors"
    >
      <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted block text-xs leading-snug">{hint}</span>
      </span>
      <ArrowRight className="text-subtle size-4 shrink-0" aria-hidden />
    </Link>
  );
}
