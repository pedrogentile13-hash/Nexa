import { canAccessPath, type AdminScope } from './scope';

/**
 * O menu do painel, agrupado.
 *
 * Eram 17 itens soltos. Agora são poucas seções, e o que combina fica como
 * ABAS dentro de uma seção (Turmas ↔ Professores, Mural ↔ Eventos, Assistente
 * ↔ Bots ↔ Diagnóstico…). Cada pessoa vê só as abas que o escopo dela abre
 * (`canAccessPath`), e a seção some se não sobrar nenhuma.
 */

export type IconKey =
  | 'layout' | 'library' | 'layers' | 'school' | 'megaphone' | 'flag' | 'bot' | 'chart' | 'settings';

export interface Tab {
  href: string;
  label: string;
}

export interface Section {
  key: string;
  label: string;
  icon: IconKey;
  tabs: Tab[];
}

export const ADMIN_SECTIONS: Section[] = [
  { key: 'inicio', label: 'Visão geral', icon: 'layout', tabs: [{ href: '/admin', label: 'Visão geral' }] },
  {
    key: 'biblioteca',
    label: 'Biblioteca',
    icon: 'library',
    tabs: [
      { href: '/admin/conteudo', label: 'Conteúdo' },
      { href: '/admin/trilhas', label: 'Trilhas' },
      { href: '/admin/materias', label: 'Matérias' },
    ],
  },
  {
    key: 'turmas',
    label: 'Turmas e professores',
    icon: 'layers',
    tabs: [
      { href: '/admin/turmas', label: 'Turmas' },
      { href: '/admin/professores', label: 'Professores' },
    ],
  },
  {
    key: 'pessoas',
    label: 'Pessoas e escolas',
    icon: 'school',
    tabs: [
      { href: '/admin/contas', label: 'Contas da escola' },
      { href: '/admin/escolas', label: 'Escolas' },
      { href: '/admin/usuarios', label: 'Usuários' },
    ],
  },
  {
    key: 'comunicacao',
    label: 'Comunicação',
    icon: 'megaphone',
    tabs: [
      { href: '/admin/mural', label: 'Mural de avisos' },
      { href: '/admin/eventos', label: 'Eventos' },
      { href: '/admin/publicacoes', label: 'Pedidos de publicação' },
    ],
  },
  {
    key: 'comunidade',
    label: 'Comunidade',
    icon: 'flag',
    tabs: [
      { href: '/admin/comunidade', label: 'Moderação' },
      { href: '/admin/notificacoes', label: 'Notificações' },
    ],
  },
  {
    key: 'ia',
    label: 'IA',
    icon: 'bot',
    tabs: [
      { href: '/admin/nexaai', label: 'Assistente' },
      { href: '/admin/bots', label: 'Bots dos professores' },
      { href: '/admin/ia', label: 'Diagnóstico' },
    ],
  },
  { key: 'relatorios', label: 'Relatórios', icon: 'chart', tabs: [{ href: '/admin/relatorios', label: 'Relatórios' }] },
  {
    key: 'sistema',
    label: 'Sistema',
    icon: 'settings',
    tabs: [
      { href: '/admin/erros', label: 'Erros' },
      { href: '/admin/configuracoes', label: 'Configurações' },
    ],
  },
];

export interface VisibleSection extends Section {
  /** Para onde o item do menu leva: a primeira aba que esta pessoa pode abrir. */
  href: string;
}

export function sectionsFor(scope: AdminScope): VisibleSection[] {
  return ADMIN_SECTIONS.flatMap((s) => {
    const tabs = s.tabs.filter((t) => canAccessPath(scope, t.href));
    return tabs.length > 0 ? [{ ...s, tabs, href: tabs[0]!.href }] : [];
  });
}

function matches(href: string, pathname: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

export function activeSection(sections: VisibleSection[], pathname: string): VisibleSection | null {
  return sections.find((s) => s.tabs.some((t) => matches(t.href, pathname))) ?? null;
}

export { matches as tabMatches };
