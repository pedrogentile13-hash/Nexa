import Link from 'next/link';
import type { Route } from 'next';
import { CalendarDays, KeyRound, MessageCircleQuestion, Sparkles, UserX, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SchoolOverview, TeacherRow } from './queries';

/**
 * A escola de relance, para direção e coordenação.
 *
 * O que pede ação vem em destaque (contas que nunca entraram, perguntas de
 * alunos esperando o professor); o resto é retrato. Números, nunca nomes de
 * alunos — a lista nominal mora em Contas da escola.
 */
export function SchoolPanel({
  schoolName,
  overview: o,
  teachers,
}: {
  schoolName: string | null;
  overview: SchoolOverview;
  teachers: TeacherRow[];
}) {
  const activePct = o.students > 0 ? Math.round((o.activeLast7Days / o.students) * 100) : 0;

  const alerts: { text: string; href: Route }[] = [];
  if (o.neverEntered > 0) {
    alerts.push({
      text: `${o.neverEntered} ${o.neverEntered === 1 ? 'aluno ainda não entrou' : 'alunos ainda não entraram'} no Nexa — entregue o login e a senha.`,
      href: '/admin/contas' as Route,
    });
  }
  if (o.pendingQuestions > 0) {
    alerts.push({
      text: `${o.pendingQuestions} ${o.pendingQuestions === 1 ? 'pergunta de aluno está esperando' : 'perguntas de alunos estão esperando'} resposta de professor.`,
      href: '/admin' as Route,
    });
  }
  if (o.studentsWithoutClass > 0) {
    alerts.push({
      text: `${o.studentsWithoutClass} ${o.studentsWithoutClass === 1 ? 'aluno está' : 'alunos estão'} sem turma.`,
      href: '/admin/contas' as Route,
    });
  }

  return (
    <section aria-label="Visão da escola" className="space-y-4">
      <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
        {schoolName ?? 'Sua escola'} · visão geral
      </h2>

      {alerts.length > 0 && (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.text}>
              <Link
                href={a.href}
                className="border-warning/30 bg-warning-soft text-warning block rounded-lg border px-4 py-3 text-sm font-medium"
              >
                {a.text}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat Icon={Users} label="Alunos" value={o.students} hint={`${o.teachers} ${o.teachers === 1 ? 'professor' : 'professores'}`} />
        <Stat
          Icon={Users}
          label="Ativos em 7 dias"
          value={`${activePct}%`}
          hint={`${o.activeLast7Days} de ${o.students}`}
          tone={o.students > 0 && activePct < 40 ? 'warn' : 'ok'}
        />
        <Stat Icon={UserX} label="Nunca entraram" value={o.neverEntered} hint="contas criadas pela escola" tone={o.neverEntered > 0 ? 'warn' : 'ok'} />
        <Stat Icon={MessageCircleQuestion} label="Perguntas esperando" value={o.pendingQuestions} hint="no chat dos professores" tone={o.pendingQuestions > 0 ? 'warn' : 'ok'} />
        <Stat Icon={CalendarDays} label="Eventos em 30 dias" value={o.upcomingEvents} href={'/admin/eventos' as Route} />
        <Stat Icon={KeyRound} label="Contas da escola" value={o.managedAccounts} href={'/admin/contas' as Route} />
        <Stat Icon={Sparkles} label="Usos da IA hoje" value={o.aiUsesToday} hint="limite por aluno" />
      </ul>

      {teachers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Professores e o chat da turma</h3>
          <div className="border-border bg-surface overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="text-muted border-border border-b text-xs">
                <tr>
                  <th className="px-4 py-2 font-medium">Professor</th>
                  <th className="px-4 py-2 font-medium">Turmas</th>
                  <th className="px-4 py-2 font-medium">Respostas cadastradas</th>
                  <th className="px-4 py-2 font-medium">Aguardando</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {teachers.map((t) => (
                  <tr key={t.teacherId}>
                    <td className="px-4 py-2.5 font-medium">{t.fullName}</td>
                    <td className="text-muted px-4 py-2.5">{t.classes || '—'}</td>
                    <td className="px-4 py-2.5">
                      {t.faqCount === 0 ? <span className="text-warning">nenhuma ainda</span> : t.faqCount}
                    </td>
                    <td className="px-4 py-2.5">
                      {t.pendingCount > 0 ? (
                        <span className="bg-danger-soft text-danger rounded-full px-2 py-0.5 text-xs font-semibold">{t.pendingCount}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  Icon,
  label,
  value,
  hint,
  tone = 'ok',
  href,
}: {
  Icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'ok' | 'warn';
  href?: Route;
}) {
  const body = (
    <div
      className={cn(
        'border-border bg-surface h-full rounded-lg border p-4',
        tone === 'warn' && 'border-warning/40',
        href && 'hover:bg-surface-2 transition-colors',
      )}
    >
      <Icon className={cn('mb-2 size-4', tone === 'warn' ? 'text-warning' : 'text-muted')} aria-hidden />
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-sm">{label}</p>
      {hint && <p className="text-muted text-xs">{hint}</p>}
    </div>
  );
  return <li>{href ? <Link href={href}>{body}</Link> : body}</li>;
}
