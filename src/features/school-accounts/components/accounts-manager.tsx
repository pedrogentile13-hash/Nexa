'use client';

import { useActionState, useState } from 'react';
import { Check, Copy, KeyRound, Plus, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field, Select, SubmitButton } from '@/features/admin/components/form-parts';
import type { AdminClass } from '@/features/admin/server/queries';
import {
  createSchoolAccount,
  resetSchoolAccountPassword,
  type AccountState,
  type IssuedCredentials,
} from '../server/actions';
import { normalizeLogin, suggestLogin } from '../lib/credentials';
import type { SchoolAccount } from '../server/queries';

const INITIAL: AccountState = { status: 'idle' };

type AccountRole = SchoolAccount['role'];

const ROLE_LABEL: Record<AccountRole, string> = {
  student: 'Aluno',
  teacher_admin: 'Professor',
  school_coordinator: 'Coordenação',
  school_director: 'Direção',
};

/**
 * Painel de contas da escola.
 *
 * A senha aparece UMA vez, logo depois de criada ou redefinida — não fica
 * guardada em lugar nenhum, então quem fecha a tela sem anotar precisa gerar
 * outra. Por isso o cartão de credenciais é grande, com botão de copiar.
 */
export function AccountsManager({
  accounts,
  classes,
  schools,
  isGlobal,
  canCreateStaff,
}: {
  accounts: SchoolAccount[];
  classes: AdminClass[];
  schools: { id: string; name: string }[];
  isGlobal: boolean;
  /** Plataforma ou direção: podem criar contas de coordenação e direção. */
  canCreateStaff: boolean;
}) {
  const [createState, createAction] = useActionState(createSchoolAccount, INITIAL);
  const [resetState, resetAction] = useActionState(resetSchoolAccountPassword, INITIAL);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [loginEdited, setLoginEdited] = useState(false);
  const [role, setRole] = useState<AccountRole>('student');

  // O cartão mostra a credencial mais recente, de criação ou de redefinição.
  const issued =
    resetState.status === 'issued' ? resetState.credentials
    : createState.status === 'issued' ? createState.credentials
    : null;
  const error =
    createState.status === 'error' ? createState.message
    : resetState.status === 'error' ? resetState.message
    : null;

  return (
    <div className="space-y-6">
      {issued && <CredentialsCard credentials={issued} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          {accounts.length === 0 ? (
            <div className="border-border bg-surface rounded-lg border p-8 text-center">
              <UserRound className="text-muted mx-auto mb-3 size-8" aria-hidden />
              <p className="text-sm font-medium">Nenhuma conta criada ainda</p>
              <p className="text-muted mt-1 text-sm">
                Cadastre os alunos e professores: cada um recebe um login e uma senha aleatória para
                entrar no endereço da escola.
              </p>
            </div>
          ) : (
            <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.fullName ?? a.login}</p>
                    <p className="text-muted truncate text-xs">
                      <span className="font-mono">{a.login}</span>
                      {' · '}
                      {ROLE_LABEL[a.role]}
                      {a.className ? ` · ${a.className}` : ''}
                      {isGlobal && a.schoolName ? ` · ${a.schoolName}` : ''}
                    </p>
                  </div>
                  <form action={resetAction}>
                    <input type="hidden" name="userId" value={a.id} />
                    <button
                      type="submit"
                      title="Gerar uma nova senha aleatória"
                      className="text-muted hover:bg-surface-2 hover:text-text flex h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium"
                    >
                      <KeyRound className="size-4" aria-hidden />
                      Nova senha
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <form action={createAction} className="border-border bg-surface space-y-3 rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Nova conta</h2>

            {isGlobal && (
              <Field label="Escola">
                <Select name="schoolId" required defaultValue="">
                  <option value="">Escolha…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label="Nome completo">
              <Input
                name="fullName"
                required
                maxLength={120}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!loginEdited) setLogin(suggestLogin(e.target.value));
                }}
                placeholder="Ana Clara da Silva"
              />
            </Field>

            <Field label="Login" hint="o aluno digita isto para entrar">
              <Input
                name="login"
                required
                value={login}
                onChange={(e) => {
                  setLoginEdited(true);
                  setLogin(normalizeLogin(e.target.value));
                }}
                autoCapitalize="none"
                spellCheck={false}
                placeholder="ana.silva"
              />
            </Field>

            <Field label="Quem é">
              <Select name="role" value={role} onChange={(e) => setRole(e.target.value as AccountRole)}>
                <option value="student">Aluno</option>
                <option value="teacher_admin">Professor</option>
                {canCreateStaff && <option value="school_coordinator">Coordenação</option>}
                {canCreateStaff && <option value="school_director">Direção</option>}
              </Select>
            </Field>

            {role === 'student' && (
              <Field label="Turma">
                <Select name="classId" defaultValue="">
                  <option value="">Sem turma ainda</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isGlobal && c.schoolName ? `${c.schoolName} · ` : ''}
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {error && (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            )}

            <SubmitButton>
              <Plus aria-hidden />
              Criar conta
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}

function CredentialsCard({ credentials }: { credentials: IssuedCredentials }) {
  const [copied, setCopied] = useState(false);
  const text = `${credentials.fullName}\nEndereço: ${credentials.address}\nLogin: ${credentials.login}\nSenha: ${credentials.password}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o texto continua na tela para copiar à mão.
    }
  }

  return (
    <section
      aria-live="polite"
      className="border-brand bg-brand-soft text-brand-text rounded-xl border-2 p-5"
    >
      <p className="text-sm font-semibold">Credenciais de {credentials.fullName}</p>
      <p className="text-xs opacity-80">
        Anote agora: por segurança a senha aparece só desta vez. Se perder, gere uma nova.
      </p>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs opacity-70">Endereço</dt>
          <dd className="font-medium break-all">{credentials.address}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Login</dt>
          <dd className="font-mono text-base font-semibold">{credentials.login}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-70">Senha</dt>
          <dd className="font-mono text-base font-semibold select-all">{credentials.password}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={copy}
        className="bg-brand text-brand-fg mt-4 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Copiado' : 'Copiar tudo'}
      </button>
    </section>
  );
}
