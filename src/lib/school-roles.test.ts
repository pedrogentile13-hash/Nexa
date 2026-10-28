import { describe, expect, it } from 'vitest';
import { choiceToProfile, profileToChoice, SCHOOL_ROLE_CHOICES } from './school-roles';

describe('school-roles', () => {
  it('coordenação e direção viram school_admin com título', () => {
    expect(choiceToProfile('school_coordinator')).toEqual({ role: 'school_admin', title: 'coordenacao' });
    expect(choiceToProfile('school_director')).toEqual({ role: 'school_admin', title: 'direcao' });
  });

  it('os outros papéis limpam o título (senão uma coordenadora rebaixada voltaria coordenadora)', () => {
    for (const c of ['student', 'teacher_admin', 'school_admin', 'admin'] as const) {
      expect(choiceToProfile(c).title).toBeNull();
    }
  });

  it('ida e volta é estável para toda escolha', () => {
    for (const c of SCHOOL_ROLE_CHOICES) {
      const { role, title } = choiceToProfile(c);
      expect(profileToChoice(role, title)).toBe(c);
    }
  });

  it('título sem school_admin é ignorado e papel desconhecido vira aluno', () => {
    expect(profileToChoice('student', 'coordenacao')).toBe('student');
    expect(profileToChoice('hacker', null)).toBe('student');
  });
});
