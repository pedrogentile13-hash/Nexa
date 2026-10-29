import { describe, expect, it } from 'vitest';
import { activeSection, sectionsFor } from './sections';

const names = (scope: Parameters<typeof sectionsFor>[0]) => sectionsFor(scope).map((s) => s.label);

describe('sectionsFor', () => {
  it('a direção da escola vê poucas seções, só as da escola', () => {
    expect(names('school')).toEqual(['Visão geral', 'Biblioteca', 'Turmas e professores', 'Pessoas e escolas', 'Comunicação', 'IA', 'Relatórios']);
  });

  it('na direção, "Pessoas e escolas" tem Contas da escola e Usuários (sem Escolas), e "IA" não tem Diagnóstico', () => {
    const pessoas = sectionsFor('school').find((s) => s.key === 'pessoas')!;
    expect(pessoas.tabs.map((t) => t.label)).toEqual(['Contas da escola', 'Usuários']);
    const ia = sectionsFor('school').find((s) => s.key === 'ia')!;
    expect(ia.tabs.map((t) => t.label)).toEqual(['Assistente', 'Bots dos professores']);
  });

  it('o admin geral vê Sistema, Escolas e Diagnóstico; não vê Turmas, Mural nem Eventos', () => {
    const full = sectionsFor('full');
    const all = full.flatMap((s) => s.tabs.map((t) => t.label));
    expect(all).toContain('Escolas');
    expect(all).toContain('Diagnóstico');
    expect(all).toContain('Configurações');
    expect(all).not.toContain('Turmas');
    expect(all).not.toContain('Mural de avisos');
    expect(all).not.toContain('Eventos');
  });

  it('o admin restrito não vê Sistema, Escolas, Usuários nem Diagnóstico', () => {
    const all = sectionsFor('limited').flatMap((s) => s.tabs.map((t) => t.label));
    for (const hidden of ['Erros', 'Configurações', 'Escolas', 'Usuários', 'Diagnóstico']) expect(all).not.toContain(hidden);
    expect(all).toContain('Moderação');
    expect(all).toContain('Conteúdo');
  });

  it('o item do menu leva à primeira aba permitida', () => {
    expect(sectionsFor('school').find((s) => s.key === 'pessoas')!.href).toBe('/admin/contas');
    expect(sectionsFor('full').find((s) => s.key === 'pessoas')!.href).toBe('/admin/contas');
    expect(sectionsFor('limited').find((s) => s.key === 'comunidade')!.href).toBe('/admin/comunidade');
  });

  it('descobre a seção ativa também em subcaminhos', () => {
    const s = sectionsFor('full');
    expect(activeSection(s, '/admin/usuarios/abc')?.key).toBe('pessoas');
    expect(activeSection(s, '/admin')?.key).toBe('inicio');
    expect(activeSection(s, '/admin/conteudo/x/questoes')?.key).toBe('biblioteca');
    expect(activeSection(s, '/fora')).toBeNull();
  });
});
