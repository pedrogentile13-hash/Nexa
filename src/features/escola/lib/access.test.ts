import { describe, expect, it } from 'vitest';
import { canOpen, navFor, staffRoleOf } from './access';

describe('staffRoleOf', () => {
  it('traduz o perfil em função do portal; aluno fica de fora', () => {
    expect(staffRoleOf({ role: 'teacher_admin' })).toBe('teacher');
    expect(staffRoleOf({ role: 'school_admin', school_title: 'coordenacao' })).toBe('coordination');
    expect(staffRoleOf({ role: 'school_admin', school_title: 'direcao' })).toBe('direction');
    expect(staffRoleOf({ role: 'admin' })).toBe('platform');
    expect(staffRoleOf({ role: 'student' })).toBeNull();
    expect(staffRoleOf({ role: null })).toBeNull();
  });
});

describe('menu e portas', () => {
  it('professor não vê Contas, Publicações nem Professores; vê Planejamento e Chat da turma', () => {
    const labels = navFor('teacher').map((n) => n.label);
    expect(labels).toEqual(expect.arrayContaining(['Início', 'Turmas', 'Alunos', 'Comunicar', 'Planejamento', 'Chat da turma', 'Visão do aluno']));
    expect(labels).not.toEqual(expect.arrayContaining(['Contas']));
    expect(canOpen('teacher', '/escola/contas')).toBe(false);
    expect(canOpen('teacher', '/escola/publicacoes')).toBe(false);
    expect(canOpen('teacher', '/escola/turmas/abc')).toBe(true);
  });

  it('coordenação e direção veem Contas, Publicações e Professores, e não o Planejamento do professor', () => {
    for (const role of ['coordination', 'direction'] as const) {
      expect(canOpen(role, '/escola/contas')).toBe(true);
      expect(canOpen(role, '/escola/professores')).toBe(true);
      expect(canOpen(role, '/escola/planejamento')).toBe(false);
    }
  });

  it('rota desconhecida ninguém abre', () => {
    expect(canOpen('direction', '/escola/segredo')).toBe(false);
  });
});
