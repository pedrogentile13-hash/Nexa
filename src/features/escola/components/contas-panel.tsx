'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, Plus, Search } from 'lucide-react';
import { createSchoolAccount, resetSchoolAccountPassword, revealSchoolPassword, type AccountState, type IssuedCredentials } from '@/features/school-accounts/server/actions';
import { normalizeLogin, suggestLogin } from '@/features/school-accounts/lib/credentials';
import type { SchoolAccount } from '@/features/school-accounts/server/queries';
import { cn } from '@/lib/utils';
import { Avatar, Chip, Empty } from './ui';

const INITIAL: AccountState = { status: 'idle' };
type Role = SchoolAccount['role'];
const ROLE_LABEL: Record<Role, string> = { student: 'Aluno', teacher_admin: 'Professor', school_coordinator: 'Coordenação', school_director: 'Direção' };
const TABS: { key: 'student' | 'teacher_admin' | 'staff'; label: string }[] = [
  { key: 'student', label: 'Alunos' },
  { key: 'teacher_admin', label: 'Professores' },
  { key: 'staff', label: 'Equipe' },
];
const field = 'border-border bg-surface-2 h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-brand';

/** Contas da escola: ver/entregar logins e senhas, criar uma conta. A senha é cifrada no banco; o olho a mostra. */
export function ContasPanel({ accounts, classes, canCreateStaff }: { accounts: SchoolAccount[]; classes: { id: string; name: string }[]; canCreateStaff: boolean }) {
  const [createState, createAction, creating] = useActionState(createSchoolAccount, INITIAL);
  const [resetState, resetAction] = useActionState(resetSchoolAccountPassword, INITIAL);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('student');
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [edited, setEdited] = useState(false);
  const [role, setRole] = useState<Role>('student');

  const issued = resetState.status === 'issued' ? resetState.credentials : createState.status === 'issued' ? createState.credentials : null;
  const error = createState.status === 'error' ? createState.message : resetState.status === 'error' ? resetState.message : null;

  const shown = useMemo(
    () =>
      accounts.filter((a) => {
        const inTab = tab === 'staff' ? a.role === 'school_coordinator' || a.role === 'school_director' : a.role === tab;
        const text = `${a.fullName ?? ''} ${a.login}`.toLowerCase();
        return inTab && (!q || text.includes(q.toLowerCase()));
      }),
    [accounts, tab, q],
  );

  return (
    <div className="space-y-6">
      {issued && <Credentials c={issued} />}
      {error && <p role="alert" className="bg-danger-soft text-danger rounded-2xl px-4 py-3 text-sm">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="bg-surface border-border rounded-3xl border p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="bg-surface-2 flex max-w-full gap-1 overflow-x-auto rounded-full p-1">
              {TABS.map((t) => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium', tab === t.key ? 'bg-surface text-brand-text shadow-sm' : 'text-muted')}>
                  {t.label}
                </button>
              ))}
            </div>
            <label className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-56">
              <span className="sr-only">Buscar</span>
              <Search className="text-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="border-border bg-surface-2 h-10 w-full rounded-full border pr-3 pl-9 text-sm outline-none" />
            </label>
          </div>

          {shown.length === 0 ? (
            <Empty title="Nenhuma conta aqui" text="Crie uma ao lado ou importe uma planilha abaixo." />
          ) : (
            <ul className="divide-border divide-y">
              {shown.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={a.fullName ?? a.login} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.fullName ?? a.login}</p>
                    <p className="text-muted flex flex-wrap items-center gap-x-2 text-xs"><span className="font-mono">{a.login}</span>{a.className && <Chip tone="brand">{a.className}</Chip>}<span>{ROLE_LABEL[a.role]}</span></p>
                  </div>
                  <Reveal userId={a.id} name={a.fullName ?? a.login} />
                  <form action={resetAction}>
                    <input type="hidden" name="userId" value={a.id} />
                    <button type="submit" title="Gerar uma nova senha" className="text-muted hover:bg-surface-2 flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-medium"><KeyRound className="size-4" aria-hidden /> Nova senha</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface border-border h-fit rounded-3xl border p-5 shadow-sm md:p-6">
          <h2 className="mb-4 text-base font-semibold">Nova conta</h2>
          <form action={createAction} className="space-y-3">
            <input
              name="fullName" required maxLength={120} placeholder="Nome completo" value={name} className={field}
              onChange={(e) => { setName(e.target.value); if (!edited) setLogin(suggestLogin(e.target.value)); }}
            />
            <input
              name="login" required placeholder="login (o aluno digita para entrar)" value={login} autoCapitalize="none" spellCheck={false} className={cn(field, 'font-mono')}
              onChange={(e) => { setEdited(true); setLogin(normalizeLogin(e.target.value)); }}
            />
            <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={field}>
              <option value="student">Aluno</option>
              <option value="teacher_admin">Professor</option>
              {canCreateStaff && <option value="school_coordinator">Coordenação</option>}
              {canCreateStaff && <option value="school_director">Direção</option>}
            </select>
            {role === 'student' && (
              <select name="classId" defaultValue="" className={field}>
                <option value="">Sem turma ainda</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <button type="submit" disabled={creating} className="bg-brand text-brand-fg inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:opacity-60">
              {creating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Criar conta
            </button>
            <p className="text-muted text-xs">A senha é gerada na hora e aparece aqui — e depois pelo olho da lista.</p>
          </form>
        </section>
      </div>
    </div>
  );
}

function Reveal({ userId, name }: { userId: string; name: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle() {
    if (password) return setPassword(null);
    setMessage(null);
    start(async () => {
      const r = await revealSchoolPassword(userId);
      if (r.ok) setPassword(r.password);
      else setMessage(r.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        {password && <button type="button" title="Copiar" onClick={() => void navigator.clipboard?.writeText(password)} className="bg-surface-2 rounded-lg px-2.5 py-1 font-mono text-sm select-all">{password}</button>}
        <button type="button" onClick={toggle} disabled={pending} aria-label={password ? `Ocultar a senha de ${name}` : `Ver a senha de ${name}`} className="text-muted hover:bg-surface-2 grid size-10 place-items-center rounded-full disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : password ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {message && <p className="text-warning max-w-56 text-right text-xs">{message}</p>}
    </div>
  );
}

function Credentials({ c }: { c: IssuedCredentials }) {
  const [copied, setCopied] = useState(false);
  const text = `${c.fullName}\nEndereço: ${c.address}\nLogin: ${c.login}\nSenha: ${c.password}`;
  return (
    <section aria-live="polite" className="bg-brand-soft text-brand-text rounded-3xl p-5">
      <p className="text-sm font-semibold">Credenciais de {c.fullName}</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-xs opacity-70">Endereço</dt><dd className="font-medium break-all">{c.address}</dd></div>
        <div><dt className="text-xs opacity-70">Login</dt><dd className="font-mono text-base font-semibold">{c.login}</dd></div>
        <div><dt className="text-xs opacity-70">Senha</dt><dd className="font-mono text-base font-semibold select-all">{c.password}</dd></div>
      </dl>
      <button
        type="button"
        onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* texto fica na tela */ } }}
        className="bg-brand text-brand-fg mt-4 inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? 'Copiado' : 'Copiar tudo'}
      </button>
    </section>
  );
}
