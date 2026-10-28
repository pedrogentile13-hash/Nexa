/**
 * Direção e coordenação são `profiles.role = 'school_admin'` com um
 * `school_title` — ver a migration 20261003000100. Para quem usa o painel
 * (e escolhe num seletor) são três opções distintas, então esta camada
 * traduz entre a "escolha" da tela e as duas colunas do banco.
 *
 * Em módulo puro para o mapeamento ser testado: um erro aqui promoveria
 * alguém ao nível errado.
 */

export const SCHOOL_ROLE_CHOICES = [
  'student',
  'teacher_admin',
  'school_coordinator',
  'school_director',
  'school_admin',
  'admin',
] as const;

export type SchoolRoleChoice = (typeof SCHOOL_ROLE_CHOICES)[number];
export type SchoolTitle = 'direcao' | 'coordenacao' | null;

export const SCHOOL_ROLE_LABEL: Record<SchoolRoleChoice, string> = {
  student: 'Aluno',
  teacher_admin: 'Professor',
  school_coordinator: 'Coordenação',
  school_director: 'Direção',
  school_admin: 'Admin da escola',
  admin: 'Admin geral',
};

export function choiceToProfile(choice: SchoolRoleChoice): {
  role: 'student' | 'teacher_admin' | 'school_admin' | 'admin';
  title: SchoolTitle;
} {
  switch (choice) {
    case 'school_coordinator':
      return { role: 'school_admin', title: 'coordenacao' };
    case 'school_director':
      return { role: 'school_admin', title: 'direcao' };
    case 'school_admin':
      return { role: 'school_admin', title: null };
    default:
      return { role: choice, title: null };
  }
}

export function profileToChoice(role: string, title: string | null | undefined): SchoolRoleChoice {
  if (role === 'school_admin') {
    if (title === 'coordenacao') return 'school_coordinator';
    if (title === 'direcao') return 'school_director';
    return 'school_admin';
  }
  return (SCHOOL_ROLE_CHOICES as readonly string[]).includes(role) ? (role as SchoolRoleChoice) : 'student';
}

/**
 * Papéis que a PLATAFORMA concede: só administração. Direção, coordenação e
 * professores são criados pela própria escola (Contas da escola) — a
 * plataforma não os atribui por fora.
 */
export const PLATFORM_ROLE_CHOICES = ['student', 'admin_limited', 'admin'] as const;
export type PlatformRoleChoice = (typeof PLATFORM_ROLE_CHOICES)[number];

export const PLATFORM_ROLE_LABEL: Record<PlatformRoleChoice | 'managed', string> = {
  student: 'Aluno',
  admin_limited: 'Admin (funções limitadas)',
  admin: 'Admin geral',
  managed: 'Gerenciado pela escola',
};

export function platformChoiceToProfile(choice: PlatformRoleChoice): {
  role: 'student' | 'admin';
  adminScope: 'limited' | null;
} {
  if (choice === 'admin') return { role: 'admin', adminScope: null };
  if (choice === 'admin_limited') return { role: 'admin', adminScope: 'limited' };
  return { role: 'student', adminScope: null };
}

/** O que a tela mostra para uma pessoa. 'managed' = papel que a escola controla. */
export function profileToPlatformChoice(role: string, adminScope: string | null | undefined): PlatformRoleChoice | 'managed' {
  if (role === 'admin') return adminScope === 'limited' ? 'admin_limited' : 'admin';
  if (role === 'student') return 'student';
  return 'managed';
}
