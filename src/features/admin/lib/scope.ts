/**
 * Quem vê o quê no painel — uma tabela só.
 *
 * Existem três "olhares" sobre o mesmo /admin:
 *   full    — admin GERAL da plataforma (tudo)
 *   limited — admin RESTRITO da plataforma (conteúdo, relatórios, moderação;
 *             sem escolas, sem papéis, sem configurações)
 *   school  — direção/coordenação de UMA escola (só o que é da escola)
 *
 * O menu, o bloqueio das páginas e o das ações leem esta mesma tabela, para
 * não existir "esconde no menu mas a URL abre" nem o contrário.
 *
 * Regra de produto: eventos, mural, turmas e professores são assunto de cada
 * ESCOLA — a plataforma não os gerencia por fora. O que a plataforma faz é
 * criar a primeira conta de direção (em Contas da escola).
 */

export type AdminScope = 'full' | 'limited' | 'school';

export const ADMIN_ACCESS: Record<string, readonly AdminScope[]> = {
  '/admin': ['full', 'limited', 'school'],
  '/admin/conteudo': ['full', 'limited', 'school'],
  '/admin/trilhas': ['full', 'limited', 'school'],
  '/admin/relatorios': ['full', 'limited', 'school'],
  '/admin/nexaai': ['full', 'limited', 'school'],
  '/admin/bots': ['full', 'limited', 'school'],
  '/admin/materias': ['full', 'limited'],
  '/admin/comunidade': ['full', 'limited'],
  '/admin/notificacoes': ['full', 'limited'],
  '/admin/escolas': ['full'],
  '/admin/usuarios': ['full'],
  '/admin/ia': ['full'],
  '/admin/erros': ['full'],
  '/admin/configuracoes': ['full'],
  '/admin/contas': ['full', 'school'],
  '/admin/turmas': ['school'],
  '/admin/professores': ['school'],
  '/admin/mural': ['school'],
  '/admin/eventos': ['school'],
  '/admin/publicacoes': ['school'],
};

/** A regra que vale para um caminho: o prefixo mais específico da tabela. */
export function canAccessPath(scope: AdminScope, pathname: string): boolean {
  if (pathname === '/admin') return ADMIN_ACCESS['/admin']!.includes(scope);

  let best: string | null = null;
  for (const key of Object.keys(ADMIN_ACCESS)) {
    if (key === '/admin') continue;
    if ((pathname === key || pathname.startsWith(`${key}/`)) && (!best || key.length > best.length)) best = key;
  }
  // Caminho que não está na tabela (ex.: uma tela nova esquecida): só o admin geral.
  if (!best) return scope === 'full';
  return ADMIN_ACCESS[best]!.includes(scope);
}

export function scopeLabel(scope: AdminScope): string {
  return scope === 'full' ? 'Admin geral' : scope === 'limited' ? 'Admin' : 'Escola';
}
