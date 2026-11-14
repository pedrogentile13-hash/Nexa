'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, resolveSchoolId } from '@/features/admin/server/guard';
import { generatePassword, isValidLogin, loginToEmail, normalizeLogin } from '../lib/credentials';
import { parseAccountsCsv } from '../lib/csv';
import { openPassword, passwordSecret, sealPassword } from '../lib/secret';

/**
 * Contas criadas pela escola (login + senha, sem e-mail).
 *
 * Só a coordenação/direção (e o administrador da plataforma) chegam aqui —
 * `requireAdmin`. A criação usa a chave de serviço do Supabase porque criar um
 * usuário de OUTRA pessoa é por definição algo que a chave anônima não faz; ela
 * nunca sai do servidor, e a senha gerada é devolvida UMA vez para a tela e
 * não é guardada em lugar nenhum (só o hash do Supabase).
 */

export interface IssuedCredentials {
  fullName: string;
  login: string;
  password: string;
  address: string;
}

export type AccountState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'issued'; credentials: IssuedCredentials };

const fail = (message: string): AccountState => ({ status: 'error', message });

const MISSING_KEY =
  'Falta a variável SUPABASE_SERVICE_ROLE_KEY no servidor — é ela que permite criar contas. Peça ao responsável técnico para configurá-la.';

const createSchema = z.object({
  schoolId: z.string().optional(),
  fullName: z.string().trim().min(3, 'Escreva o nome completo.').max(120),
  login: z.string().trim().min(1, 'Defina um login.'),
  role: z.enum(['student', 'teacher_admin', 'school_coordinator', 'school_director']),
  classId: z.string().uuid().optional(),
});

/** Endereço (host) da escola — base do e-mail fabricado. Sem ele, não há como criar conta. */
async function schoolHost(schoolId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('school_domains')
    .select('host')
    .eq('school_id', schoolId)
    .eq('active', true)
    .order('created_at')
    .limit(1)
    .maybeSingle();
  return data?.host ?? null;
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Guarda a senha CIFRADA para a coordenação poder revê-la. Falha em silêncio:
 * a conta já foi criada, e sem a tabela (SQL pendente) só o "ver senha" deixa de funcionar.
 */
async function storePassword(admin: AdminClient, userId: string, password: string): Promise<void> {
  const secret = passwordSecret();
  if (!secret) return;
  await admin
    .from('school_account_secrets')
    .upsert({ user_id: userId, secret: sealPassword(password, secret), updated_at: new Date().toISOString() });
}
type AccountRole = 'student' | 'teacher_admin' | 'school_coordinator' | 'school_director';

/**
 * Cria UMA conta (usuário do Auth + perfil). Compartilhada pela criação avulsa e
 * pela importação de planilha, para as duas terem exatamente as mesmas regras e
 * o mesmo desfazimento se algo falhar no meio.
 */
async function createOne(input: {
  admin: AdminClient;
  schoolId: string;
  host: string;
  fullName: string;
  login: string;
  role: AccountRole;
  classId: string | null;
}): Promise<{ ok: true; password: string } | { ok: false; message: string; duplicate?: boolean }> {
  const { admin, schoolId, host, fullName, login, role, classId } = input;
  const isStaffRole = role === 'school_coordinator' || role === 'school_director';
  const password = generatePassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: loginToEmail(login, host),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    const duplicate = /already|registered|exists/i.test(createError?.message ?? '');
    return {
      ok: false,
      duplicate,
      message: duplicate
        ? 'Já existe uma conta com esse login nesta escola.'
        : 'Não consegui criar a conta agora. Tente de novo.',
    };
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      school_id: schoolId,
      class_id: role === 'student' ? classId : null,
      role: isStaffRole ? 'school_admin' : role === 'teacher_admin' ? 'teacher_admin' : 'student',
      school_title: role === 'school_coordinator' ? 'coordenacao' : role === 'school_director' ? 'direcao' : null,
      school_login: login,
    })
    .eq('id', created.user.id);

  if (profileError) {
    // Sem o perfil ajustado a conta ficaria solta (sem escola). Desfaz tudo em vez de deixar sobra.
    await admin.auth.admin.deleteUser(created.user.id);
    const duplicate = profileError.code === '23505';
    return {
      ok: false,
      duplicate,
      message:
        profileError.code === '42703'
          ? 'Aplique o SQL das contas da escola no Supabase antes de criar contas.'
          : duplicate
            ? 'Já existe uma conta com esse login nesta escola.'
            : 'Não consegui concluir o cadastro da conta. Nada foi criado.',
    };
  }

  await storePassword(admin, created.user.id, password);
  return { ok: true, password };
}

export async function createSchoolAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const identity = await requireAdmin();

  const parsed = createSchema.safeParse({
    schoolId: formData.get('schoolId') || undefined,
    fullName: formData.get('fullName'),
    login: formData.get('login'),
    role: formData.get('role'),
    classId: formData.get('classId') || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Revise os dados.');

  const schoolId = resolveSchoolId(identity, parsed.data.schoolId ?? null);
  if (!schoolId) return fail('Escolha uma escola.');

  const login = normalizeLogin(parsed.data.login);
  if (!isValidLogin(login)) {
    return fail('O login precisa ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.');
  }

  const host = await schoolHost(schoolId);
  if (!host) return fail('Esta escola ainda não tem um endereço próprio cadastrado, então não dá para criar contas.');

  const supabase = await createClient();

  // Contas da coordenação/direção: só a plataforma ou a direção criam. A
  // coordenação cria alunos e professores — senão qualquer coordenadora se
  // transformaria em direção (e a hierarquia deixaria de valer).
  const isStaffRole = parsed.data.role === 'school_coordinator' || parsed.data.role === 'school_director';
  if (isStaffRole && !identity.isGlobal) {
    const { data: level } = await supabase.rpc('school_staff_level', { p_school_id: schoolId });
    if ((level ?? 0) < 3) return fail('Só a direção cria contas de coordenação e direção.');
  }
  if (parsed.data.classId) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', parsed.data.classId)
      .eq('school_id', schoolId)
      .maybeSingle();
    if (!cls) return fail('Essa turma não pertence a esta escola.');
  }

  const admin = createAdminClient();
  if (!admin) return fail(MISSING_KEY);

  const result = await createOne({
    admin,
    schoolId,
    host,
    fullName: parsed.data.fullName,
    login,
    role: parsed.data.role,
    classId: parsed.data.classId ?? null,
  });
  if (!result.ok) return fail(result.message);

  revalidatePath('/admin/contas');
  return {
    status: 'issued',
    credentials: { fullName: parsed.data.fullName, login, password: result.password, address: `https://${host}` },
  };
}

/**
 * Nova senha aleatória. Só para contas criadas pela escola, e só de aluno ou
 * professor: a senha da própria coordenação/direção não se redefine por aqui
 * (senão uma coordenadora trocaria a senha da direção e entraria como ela).
 */
export async function resetSchoolAccountPassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const identity = await requireAdmin();

  const userId = z.string().uuid().safeParse(formData.get('userId'));
  if (!userId.success) return fail('Conta inválida.');

  const supabase = await createClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, school_id, role, school_login')
    .eq('id', userId.data)
    .maybeSingle();

  if (!target || !target.school_login || !target.school_id) return fail('Esta conta não foi criada pela escola.');
  if (!identity.isGlobal && target.school_id !== identity.schoolId) return fail('Esta conta é de outra escola.');
  // Coordenação/direção só têm a senha redefinida pela plataforma: se a
  // coordenação pudesse, trocaria a senha da direção e entraria como ela.
  if (target.role !== 'student' && target.role !== 'teacher_admin' && !identity.isGlobal) {
    return fail('Só dá para redefinir a senha de alunos e professores.');
  }

  const host = await schoolHost(target.school_id);
  if (!host) return fail('Esta escola não tem endereço cadastrado.');

  const admin = createAdminClient();
  if (!admin) return fail(MISSING_KEY);

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(target.id, { password });
  if (error) return fail('Não consegui trocar a senha agora. Tente de novo.');
  await storePassword(admin, target.id, password);

  return {
    status: 'issued',
    credentials: {
      fullName: target.full_name ?? target.school_login,
      login: target.school_login,
      password,
      address: `https://${host}`,
    },
  };
}

export type RevealState = { ok: true; password: string } | { ok: false; message: string };

/**
 * Mostra a senha de uma conta criada pela escola, para a coordenação repassá-la.
 * Direção/coordenação/admin só veem senha de aluno e professor da PRÓPRIA escola
 * (a plataforma vê todas). A senha de coordenação/direção só a plataforma vê.
 */
export async function revealSchoolPassword(userId: string): Promise<RevealState> {
  const identity = await requireAdmin();
  const id = z.string().uuid().safeParse(userId);
  if (!id.success) return { ok: false, message: 'Conta inválida.' };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from('profiles')
    .select('id, school_id, role, school_login')
    .eq('id', id.data)
    .maybeSingle();
  if (!target || !target.school_login || !target.school_id) return { ok: false, message: 'Esta conta não foi criada pela escola.' };
  if (!identity.isGlobal && target.school_id !== identity.schoolId) return { ok: false, message: 'Esta conta é de outra escola.' };
  if (target.role !== 'student' && target.role !== 'teacher_admin' && !identity.isGlobal) {
    return { ok: false, message: 'Só a administração geral vê a senha da coordenação e da direção.' };
  }

  const admin = createAdminClient();
  const secret = passwordSecret();
  if (!admin || !secret) return { ok: false, message: MISSING_KEY };

  const { data, error } = await admin.from('school_account_secrets').select('secret').eq('user_id', target.id).maybeSingle();
  if (error) return { ok: false, message: 'Aplique o SQL das senhas da escola no Supabase para poder ver senhas.' };
  if (!data) return { ok: false, message: 'Esta senha foi criada antes de existir o "ver senha". Gere uma nova senha para ela.' };

  const password = openPassword(data.secret, secret);
  return password ? { ok: true, password } : { ok: false, message: 'Não consegui abrir esta senha. Gere uma nova.' };
}

// ------------------------------------------------------------- planilha --

export interface ImportedAccount {
  fullName: string;
  login: string;
  password: string;
  className: string | null;
  role: 'student' | 'teacher_admin';
}

export type ImportState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | {
      status: 'done';
      address: string;
      created: ImportedAccount[];
      failed: { line: number; name: string; message: string }[];
    };

/**
 * Importa uma planilha de alunos/professores de uma vez.
 *
 * Cada linha é independente: uma que falha (turma inexistente, login já usado)
 * não derruba as outras — o relatório diz exatamente quais criou e quais não.
 * Cria 5 por vez: o Supabase leva ~300 ms por conta, e 200 em fila passariam do
 * tempo que a hospedagem dá a uma ação.
 */
export async function importSchoolAccounts(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const identity = await requireAdmin();
  const err = (message: string): ImportState => ({ status: 'error', message });

  const schoolId = resolveSchoolId(identity, String(formData.get('schoolId') ?? '') || null);
  if (!schoolId) return err('Escolha uma escola.');

  const text = String(formData.get('csv') ?? '');
  if (!text.trim()) return err('Cole ou envie a planilha primeiro.');
  if (text.length > 200_000) return err('Arquivo grande demais.');

  const parsed = parseAccountsCsv(text);
  if (parsed.rows.length === 0 && parsed.errors.length > 0 && parsed.errors[0]!.line === 0) {
    return err(parsed.errors[0]!.message);
  }
  if (parsed.rows.length === 0) {
    return err(parsed.errors[0] ? `Nenhuma linha válida. Linha ${parsed.errors[0].line}: ${parsed.errors[0].message}` : 'A planilha está vazia.');
  }

  const host = await schoolHost(schoolId);
  if (!host) return err('Esta escola ainda não tem um endereço próprio cadastrado, então não dá para criar contas.');

  const admin = createAdminClient();
  if (!admin) return err(MISSING_KEY);

  const supabase = await createClient();
  const { data: classRows } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).is('closed_at', null);
  const fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');
  const classByName = new Map((classRows ?? []).map((c) => [fold(c.name), c.id]));

  const created: ImportedAccount[] = [];
  const failed: { line: number; name: string; message: string }[] = parsed.errors.map((e) => ({
    line: e.line,
    name: '',
    message: e.message,
  }));

  const work = async (row: (typeof parsed.rows)[number]) => {
    let classId: string | null = null;
    if (row.className) {
      classId = classByName.get(fold(row.className)) ?? null;
      if (!classId) {
        failed.push({ line: row.line, name: row.fullName, message: `Turma "${row.className}" não existe nesta escola.` });
        return;
      }
    }

    // Login SUGERIDO que já existe no banco: tenta com número. O digitado, não — é erro dela.
    let login = row.login;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const result = await createOne({ admin, schoolId, host, fullName: row.fullName, login, role: row.role, classId });
      if (result.ok) {
        created.push({ fullName: row.fullName, login, password: result.password, className: row.className, role: row.role });
        return;
      }
      if (!result.duplicate || row.loginTyped || attempt === 5) {
        failed.push({ line: row.line, name: row.fullName, message: result.message });
        return;
      }
      login = normalizeLogin(`${row.login}${attempt + 2}`);
    }
  };

  for (let i = 0; i < parsed.rows.length; i += 5) {
    await Promise.all(parsed.rows.slice(i, i + 5).map(work));
  }

  created.sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
  failed.sort((a, b) => a.line - b.line);
  revalidatePath('/admin/contas');
  return { status: 'done', address: `https://${host}`, created, failed };
}
