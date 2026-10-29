import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  CalendarClock,
  Flame,
  Play,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { StudyPlanReason } from '@/types/database.types';
import type { VestibularHome } from '../server/queries';

/**
 * A casa de quem está se preparando.
 *
 * A pergunta que esta tela responde é "o que eu faço agora?", não "como eu
 * estou indo?". Por isso o topo é a prova e o prazo, o meio é UMA ação
 * concreta — continuar o treino aberto, atacar o assunto do plano, ou refazer
 * os erros — e os números vêm depois. Um painel que abre por métrica deixa a
 * pessoa informada e parada.
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

export function VestibularHomeView({ home }: { home: VestibularHome }) {
  const firstName = home.fullName?.trim().split(/\s+/)[0] ?? null;
  const goalPercent =
    home.dailyGoalMinutes > 0
      ? Math.min(100, Math.round((home.minutesToday / home.dailyGoalMinutes) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <CountdownHero home={home} firstName={firstName} />

      <NextAction home={home} />

      {/* Meta do dia: a única barra da tela, porque é a única coisa que a
          pessoa pode zerar hoje. */}
      <section className="border-border bg-surface rounded-[20px] border p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Meta de hoje</p>
          <span className="text-subtle text-xs tabular-nums">
            {home.minutesToday} / {home.dailyGoalMinutes} min
          </span>
        </div>
        <Progress
          label="Progresso da meta diária"
          value={goalPercent}
          tone={goalPercent >= 100 ? 'success' : 'brand'}
        />
        <p className="text-muted mt-2 text-sm leading-snug">
          {goalPercent >= 100
            ? 'Meta batida. Tudo daqui pra frente hoje é lucro.'
            : home.questionsToday > 0
              ? `${home.questionsToday} ${home.questionsToday === 1 ? 'questão respondida' : 'questões respondidas'} hoje. Continua.`
              : 'Nenhuma questão hoje ainda. Dez minutos já mudam o dia.'}
        </p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat
          Icon={Flame}
          value={String(home.streakDays)}
          label={home.streakDays === 1 ? 'dia seguido' : 'dias seguidos'}
          tone={home.streakDays > 0 ? 'warning' : 'neutral'}
        />
        <MiniStat
          Icon={TrendingUp}
          value={home.accuracyWeek !== null ? `${home.accuracyWeek}%` : '—'}
          label="acerto na semana"
          tone="neutral"
        />
        <MiniStat
          Icon={RotateCcw}
          value={String(home.pendingErrors)}
          label={home.pendingErrors === 1 ? 'erro pendente' : 'erros pendentes'}
          tone={home.pendingErrors > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <nav aria-label="Atalhos da preparação" className="grid gap-2 sm:grid-cols-2">
        <Shortcut href="/vestibular/plano" title="Plano de estudo" hint="Por onde começar" />
        <Shortcut href="/vestibular/questoes" title="Questões" hint="Treino e provas anteriores" />
        <Shortcut href="/vestibular/erros" title="Central de erros" hint="O que você ainda erra" />
        <Shortcut href="/vestibular/desempenho" title="Desempenho" hint="Seu mapa de domínio" />
      </nav>
    </div>
  );
}

function CountdownHero({ home, firstName }: { home: VestibularHome; firstName: string | null }) {
  const { daysUntil, examName, targetYear, targetCourse, targetInstitution, applicationDate } =
    home;
  const finalStretch = daysUntil !== null && daysUntil <= 60 && daysUntil >= 0;

  const goal = [targetCourse, targetInstitution].filter(Boolean).join(' · ');

  return (
    <section
      className="text-brand-fg relative overflow-hidden rounded-[20px] p-5"
      style={{ background: 'var(--gradient-header)' }}
    >
      <p className="text-brand-fg/80 text-sm">
        {firstName ? `Bom estudo, ${firstName}.` : 'Bom estudo.'}
      </p>

      <p className="mt-1 text-lg font-bold">
        {examName ?? 'Seu vestibular'}
        {targetYear ? ` ${targetYear}` : ''}
      </p>
      {goal && <p className="text-brand-fg/80 text-sm">{goal}</p>}

      <div className="mt-4">
        {daysUntil !== null && daysUntil >= 0 ? (
          <>
            <p className="flex items-baseline gap-2">
              <span className="text-5xl leading-none font-bold tabular-nums">{daysUntil}</span>
              <span className="text-brand-fg/80 text-sm">
                {daysUntil === 1 ? 'dia restante' : 'dias restantes'}
              </span>
            </p>
            {applicationDate && (
              <p className="text-brand-fg/70 mt-1 flex items-center gap-1.5 text-xs">
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
            A data desta edição ainda não foi cadastrada — a contagem regressiva aparece assim que
            ela existir.
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
 * soltos — porque o plano já levou os erros em conta ao ordenar.
 */
function NextAction({ home }: { home: VestibularHome }) {
  if (home.openSessionId) {
    return (
      <ActionCard
        title="Você tem um treino em aberto"
        description="Continua de onde parou — as questões que você já respondeu ficaram salvas."
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
        href="/vestibular/erros"
        cta="Refazer erros"
        Icon={RotateCcw}
      />
    );
  }

  return (
    <ActionCard
      title="Comece pelo primeiro treino"
      description="Responda algumas questões pra eu saber onde você está — o plano se monta a partir daí."
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
    <section className="border-brand/30 bg-brand-soft rounded-[20px] border p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="bg-brand text-brand-fg grid size-11 shrink-0 place-items-center rounded-2xl"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-subtle text-xs font-semibold tracking-wide uppercase">Agora</p>
          <p className="text-brand-text text-base font-semibold">{title}</p>
          <p className="text-muted text-sm leading-snug">{description}</p>
          {badge && (
            <Badge variant="danger" className="mt-2">
              {badge}
            </Badge>
          )}
        </div>
      </div>
      <Button variant="pop" size="lg" className="mt-3 w-full" asChild>
        <Link href={href}>
          {cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </section>
  );
}

function MiniStat({
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
    <div className="border-border bg-surface rounded-[20px] border p-3 text-center">
      <Icon
        className={cn(
          'mx-auto size-4',
          tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-subtle',
        )}
        aria-hidden
      />
      <p className="mt-1 text-xl leading-none font-bold tabular-nums">{value}</p>
      <p className="text-subtle mt-1 text-[11px] leading-tight">{label}</p>
    </div>
  );
}

function Shortcut({ href, title, hint }: { href: Route; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="border-border bg-surface hover:bg-surface-2 flex items-center justify-between gap-3 rounded-[20px] border p-4 transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted block text-xs leading-snug">{hint}</span>
      </span>
      <ArrowRight className="text-subtle size-4 shrink-0" aria-hidden />
    </Link>
  );
}
