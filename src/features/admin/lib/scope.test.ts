import { describe, expect, it } from 'vitest';
import { ADMIN_ACCESS, canAccessPath, type AdminScope } from './scope';

const can = (scope: AdminScope, path: string) => canAccessPath(scope, path);

describe('canAccessPath', () => {
  it('a direção da escola NÃO vê o que é só da plataforma', () => {
    for (const path of ['/admin/escolas', '/admin/ia', '/admin/erros', '/admin/configuracoes', '/admin/materias', '/admin/comunidade']) {
      expect(can('school', path), path).toBe(false);
    }
  });

  it('a direção da escola vê o que é da escola', () => {
    for (const path of ['/admin', '/admin/turmas', '/admin/contas', '/admin/usuarios', '/admin/mural', '/admin/eventos', '/admin/professores', '/admin/bots', '/admin/nexaai', '/admin/relatorios', '/admin/conteudo']) {
      expect(can('school', path), path).toBe(true);
    }
  });

  it('eventos, mural, turmas e professores são só da escola (a plataforma não os gerencia)', () => {
    for (const path of ['/admin/eventos', '/admin/mural', '/admin/turmas', '/admin/professores']) {
      expect(can('full', path), path).toBe(false);
      expect(can('limited', path), path).toBe(false);
    }
  });

  it('o admin restrito não mexe em escolas, papéis, configurações nem diagnóstico', () => {
    for (const path of ['/admin/escolas', '/admin/configuracoes', '/admin/ia', '/admin/erros']) {
      expect(can('limited', path), path).toBe(false);
    }
    for (const path of ['/admin/conteudo', '/admin/relatorios', '/admin/comunidade', '/admin/materias', '/admin/bots']) {
      expect(can('limited', path), path).toBe(true);
    }
  });

  it('o admin geral entra no que é da plataforma, e em Contas (para criar a primeira direção)', () => {
    for (const path of ['/admin', '/admin/escolas', '/admin/ia', '/admin/usuarios', '/admin/contas', '/admin/conteudo']) {
      expect(can('full', path), path).toBe(true);
    }
  });

  it('subcaminhos herdam a regra do pai', () => {
    expect(can('school', '/admin/usuarios/abc')).toBe(true);
    expect(can('school', '/admin/escolas/novo')).toBe(false);
    expect(can('school', '/admin/conteudo/abc/questoes')).toBe(true);
    expect(can('limited', '/admin/escolas/novo')).toBe(false);
  });

  it('caminho desconhecido é só do admin geral (esquecer de listar uma tela não abre nada)', () => {
    expect(can('school', '/admin/tela-nova')).toBe(false);
    expect(can('limited', '/admin/tela-nova')).toBe(false);
    expect(can('full', '/admin/tela-nova')).toBe(true);
  });

  it('a tabela cobre todo escopo com ao menos uma tela', () => {
    for (const s of ['full', 'limited', 'school'] as AdminScope[]) {
      expect(Object.values(ADMIN_ACCESS).some((list) => list.includes(s))).toBe(true);
    }
  });
});
