import Link from 'next/link';
import type { Route } from 'next';
import { AlertTriangle, ArrowRight, CalendarDays, Eye, Inbox, Megaphone, MessageCircle, Sparkles, UserX } from 'lucide-react';
import { Avatar, Chip, Metric, Panel, Ring } from '@/features/escola/components/ui';
import { STAFF_ROLE_LABEL } from '@/features/escola/lib/access';
import { requireStaff } from '@/features/escola/server/guard';
import { getHome } from '@/features/escola/server/queries';

export const metadata = { title: 'Início' };
export const dynamic = 'force-dynamic';

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date()));
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

export default async function EscolaHome() {
  const staff = await requireStaff('/escola');
  const home = await getHome(staff);
  const first = staff.fullName?.split(' ')[0] ?? 'tudo bem';
  const leader = staff.role !== 'teacher';
  const o = home.overview?.overview;
  const activePct = o && o.students > 0 ? Math.round((o.activeLast7Days / o.students) * 100) : 0;

  const attention: { icon: typeof Inbox; text: string; href: string; tone: 'warn' | 'bad' | 'brand' }[] = [];
  if (home.pendingPublications > 0) attention.push({ icon: Inbox, text: `${home.pendingPublications} ${home.pendingPublications === 1 ? 'conteúdo de aluno aguarda' : 'conteúdos de alunos aguardam'} sua autorização`, href: '/escola/publicacoes', tone: 'brand' });
  if (o && o.neverEntered > 0) attention.push({ icon: UserX, text: `${o.neverEntered} ${o.neverEntered === 1 ? 'aluno ainda não entrou' : 'alunos ainda não entraram'} — entregue o login e a senha`, href: '/escola/contas', tone: 'warn' });
  if (o && o.studentsWithoutClass > 0) attention.push({ icon: AlertTriangle, text: `${o.studentsWithoutClass} ${o.studentsWithoutClass === 1 ? 'aluno está' : 'alunos estão'} sem turma`, href: '/escola/alunos?sem-turma=1', tone: 'warn' });
  if (o && o.pendingQuestions > 0) attention.push({ icon: MessageCircle, text: `${o.pendingQuestions} ${o.pendingQuestions === 1 ? 'pergunta de aluno espera' : 'perguntas de alunos esperam'} resposta de um professor`, href: '/escola/professores', tone: 'bad' });
  if (home.pendingQuestions > 0) attention.push({ icon: MessageCircle, text: `${home.pendingQuestions} ${home.pendingQuestions === 1 ? 'pergunta de aluno espera' : 'perguntas de alunos esperam'} a sua resposta`, href: '/escola/chat', tone: 'bad' });

  return (
    <div className="space-y-6">
      {/* Abertura */}
      <section className="relative overflow-hidden rounded-[32px] p-6 text-white md:p-9" style={{ background: 'var(--gradient-header)' }}>
        <div aria-hidden className="absolute -top-16 -right-10 size-64 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-24 -bottom-24 size-72 rounded-full bg-white/10" />
        <p className="relative text-sm opacity-90">{STAFF_ROLE_LABEL[staff.role]} · {staff.schoolName ?? 'sua escola'}</p>
        <h1 className="relative mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting()}, {first}.
        </h1>
        <p className="relative mt-2 max-w-xl text-sm opacity-90 md:text-base">
          {leader ? 'Veja como a escola está usando o Nexa e o que pede a sua atenção hoje.' : 'Suas turmas, seus alunos e os recados da semana, num lugar só.'}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link href="/escola/comunicar" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-violet-700">
            <Megaphone className="size-4" aria-hidden /> Novo recado
          </Link>
          <Link href="/escola/visao-aluno" className="inline-flex h-11 items-center gap-2 rounded-full bg-white/20 px-5 text-sm font-semibold backdrop-blur">
            <Eye className="size-4" aria-hidden /> Ver como o aluno vê
          </Link>
        </div>
      </section>

      {/* Números */}
      {leader && o && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <Panel title="Quem usou nesta semana" hint="Alunos que estudaram nos últimos 7 dias">
            <div className="flex items-center gap-5">
              <Ring value={activePct} size={116} stroke={11} sublabel="ativos" />
              <p className="text-muted text-sm">
                <strong className="text-text tabular text-xl">{o.activeLast7Days}</strong> de {o.students} alunos
              </p>
            </div>
          </Panel>
          <Panel title="A escola em números">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label="Alunos" value={o.students} />
              <Metric label="Professores" value={o.teachers} />
              <Metric label="Nunca entraram" value={o.neverEntered} tone={o.neverEntered > 0 ? 'warn' : undefined} />
              <Metric label="IA hoje" value={o.aiUsesToday} hint="usos" />
            </div>
          </Panel>
        </div>
      )}

      {/* Atenção */}
      {attention.length > 0 && (
        <Panel title="Precisa de atenção">
          <ul className="space-y-2">
            {attention.map((a) => (
              <li key={a.text}>
                <Link href={a.href as Route} className="bg-surface-2 hover:bg-brand-soft flex items-center gap-3 rounded-2xl p-3.5 transition-colors">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${a.tone === 'bad' ? 'bg-danger-soft text-danger' : a.tone === 'warn' ? 'bg-warning-soft text-warning' : 'bg-brand-soft text-brand-text'}`}>
                    <a.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{a.text}</span>
                  <ArrowRight className="text-subtle size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Turmas */}
        <Panel
          title={leader ? 'Turmas' : 'Minhas turmas'}
          action={<Link href="/escola/turmas" className="text-brand-text text-sm font-semibold">Ver todas</Link>}
        >
          {home.classes.length === 0 ? (
            <p className="text-muted text-sm">{leader ? 'Nenhuma turma criada ainda.' : 'Você ainda não foi vinculado a uma turma. Peça à coordenação.'}</p>
          ) : (
            <ul className="space-y-2">
              {home.classes.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/escola/turmas/${c.id}` as Route} className="hover:bg-surface-2 flex items-center gap-3 rounded-2xl p-2.5 transition-colors">
                    <Avatar name={c.name} className="rounded-2xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{c.name}</span>
                      <span className="text-muted block truncate text-xs">{c.students} alunos · {c.active7d} ativos na semana</span>
                    </span>
                    <Chip tone={c.students > 0 && c.active7d / c.students >= 0.6 ? 'good' : c.active7d === 0 ? 'bad' : 'warn'}>
                      {c.students > 0 ? Math.round((c.active7d / c.students) * 100) : 0}%
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recados */}
        <Panel title="Seus últimos recados" action={<Link href="/escola/comunicar" className="text-brand-text text-sm font-semibold">Abrir</Link>}>
          {home.recentNotices.length === 0 ? (
            <div className="text-muted flex items-center gap-3 text-sm">
              <Sparkles className="text-brand size-5 shrink-0" aria-hidden />
              Nada publicado ainda. Um recado chega no celular de cada aluno e mostra quem leu.
            </div>
          ) : (
            <ul className="space-y-2">
              {home.recentNotices.map((n) => (
                <li key={n.id} className="bg-surface-2 rounded-2xl p-3.5">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                    <span>{n.className ? `Turma ${n.className}` : 'Toda a escola'}</span>
                    {n.audience ? <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" aria-hidden />{n.readCount ?? 0}/{n.audience} leram</span> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
