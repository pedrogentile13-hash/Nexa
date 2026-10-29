import { describe, expect, it } from 'vitest';
import {
  choiceToProfile,
  PLATFORM_ROLE_CHOICES,
  platformChoiceToProfile,
  profileToChoice,
  profileToPlatformChoice,
  SCHOOL_ROLE_CHOICES,
} from './school-roles';

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

describe('papéis da plataforma', () => {
  it('a plataforma só concede aluno, admin restrito e admin geral', () => {
    expect([...PLATFORM_ROLE_CHOICES]).toEqual(['student', 'admin_limited', 'admin']);
  });

  it('o admin restrito é role admin com escopo limitado; o geral não tem escopo', () => {
    expect(platformChoiceToProfile('admin_limited')).toEqual({ role: 'admin', adminScope: 'limited' });
    expect(platformChoiceToProfile('admin')).toEqual({ role: 'admin', adminScope: null });
    expect(platformChoiceToProfile('student')).toEqual({ role: 'student', adminScope: null });
  });

  it('ida e volta, e papéis de escola aparecem como gerenciados pela escola', () => {
    for (const c of PLATFORM_ROLE_CHOICES) {
      const { role, adminScope } = platformChoiceToProfile(c);
      expect(profileToPlatformChoice(role, adminScope)).toBe(c);
    }
    for (const role of ['teacher_admin', 'school_admin']) expect(profileToPlatformChoice(role, null)).toBe('managed');
  });
});
