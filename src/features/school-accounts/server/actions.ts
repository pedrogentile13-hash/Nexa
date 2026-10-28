'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, resolveSchoolId } from '@/features/admin/server/guard';
import { generatePassword, isValidLogin, loginToEmail, normalizeLogin } from '../lib/credentials';

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

  const password = generatePassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: loginToEmail(login, host),
    password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (createError || !created.user) {
    return fail(
      /already|registered|exists/i.test(createError?.message ?? '')
        ? 'Já existe uma conta com esse login nesta escola.'
        : 'Não consegui criar a conta agora. Tente de novo.',
    );
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      school_id: schoolId,
      class_id: parsed.data.role === 'student' ? (parsed.data.classId ?? null) : null,
      role: isStaffRole ? 'school_admin' : parsed.data.role === 'teacher_admin' ? 'teacher_admin' : 'student',
      school_title:
        parsed.data.role === 'school_coordinator' ? 'coordenacao'
        : parsed.data.role === 'school_director' ? 'direcao'
        : null,
      school_login: login,
    })
    .eq('id', created.user.id);

  if (profileError) {
    // Sem o perfil ajustado a conta ficaria solta (sem escola). Desfaz tudo em vez de deixar sobra.
    await admin.auth.admin.deleteUser(created.user.id);
    return fail(
      profileError.code === '42703'
        ? 'Aplique o SQL das contas da escola no Supabase antes de criar contas.'
        : profileError.code === '23505'
          ? 'Já existe uma conta com esse login nesta escola.'
          : 'Não consegui concluir o cadastro da conta. Nada foi criado.',
    );
  }

  revalidatePath('/admin/contas');
  return {
    status: 'issued',
    credentials: { fullName: parsed.data.fullName, login, password, address: `https://${host}` },
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
