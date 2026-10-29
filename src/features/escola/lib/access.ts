/**
 * Portal da equipe ("Nexa Escola"): quem entra, o que cada função vê.
 * Puro e testável — o menu e as portas das páginas saem desta mesma tabela.
 */

export type StaffRole = 'teacher' | 'coordination' | 'direction' | 'platform';

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  teacher: 'Professor(a)',
  coordination: 'Coordenação',
  direction: 'Direção',
  platform: 'Administração Nexa',
};

/** Papel do portal a partir do perfil. `null` = aluno (ou sem permissão): não entra. */
export function staffRoleOf(profile: { role: string | null; school_title?: string | null }): StaffRole | null {
  if (profile.role === 'teacher_admin') return 'teacher';
  if (profile.role === 'school_admin') return profile.school_title === 'coordenacao' ? 'coordination' : 'direction';
  if (profile.role === 'admin') return 'platform';
  return null;
}

export type NavIcon = 'home' | 'classes' | 'students' | 'megaphone' | 'teachers' | 'plan' | 'chat' | 'inbox' | 'accounts' | 'eye' | 'library';

export interface NavEntry {
  href: string;
  label: string;
  icon: NavIcon;
  roles: StaffRole[];
}

const ALL: StaffRole[] = ['teacher', 'coordination', 'direction', 'platform'];
const LEADERS: StaffRole[] = ['coordination', 'direction', 'platform'];

export const NAV: NavEntry[] = [
  { href: '/escola', label: 'Início', icon: 'home', roles: ALL },
  { href: '/escola/turmas', label: 'Turmas', icon: 'classes', roles: ALL },
  { href: '/escola/alunos', label: 'Alunos', icon: 'students', roles: ALL },
  { href: '/escola/comunicar', label: 'Comunicar', icon: 'megaphone', roles: ALL },
  { href: '/escola/professores', label: 'Professores', icon: 'teachers', roles: LEADERS },
  { href: '/escola/publicacoes', label: 'Publicações', icon: 'inbox', roles: LEADERS },
  { href: '/escola/contas', label: 'Contas', icon: 'accounts', roles: LEADERS },
  { href: '/escola/planejamento', label: 'Planejamento', icon: 'plan', roles: ['teacher'] },
  { href: '/escola/chat', label: 'Chat da turma', icon: 'chat', roles: ['teacher'] },
  { href: '/escola/conteudo', label: 'Conteúdo', icon: 'library', roles: ['teacher', 'coordination', 'direction'] },
  { href: '/escola/visao-aluno', label: 'Visão do aluno', icon: 'eye', roles: ALL },
];

export function navFor(role: StaffRole): NavEntry[] {
  return NAV.filter((n) => n.roles.includes(role));
}

/** A página `/escola/...` pode ser aberta por esta função? Rotas desconhecidas: ninguém. */
export function canOpen(role: StaffRole, pathname: string): boolean {
  const entry = [...NAV].filter((n) => n.href.startsWith('/escola')).sort((a, b) => b.href.length - a.href.length).find((n) => pathname === n.href || (n.href !== '/escola' && pathname.startsWith(`${n.href}/`)));
  return entry ? entry.roles.includes(role) : false;
}

export function isLeader(role: StaffRole): boolean {
  return LEADERS.includes(role);
}
