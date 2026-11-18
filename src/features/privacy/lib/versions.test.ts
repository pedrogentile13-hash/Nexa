import { describe, expect, it } from 'vitest';
import { ageOn, needsGuardianConsent } from './versions';

/**
 * A conta de idade decide se o cadastro exige consentimento de responsável.
 * Errar por um dia aqui é tratar um menor como maior — que é o erro que a
 * LGPD pune.
 */
describe('ageOn', () => {
  const ref = new Date('2026-10-02T12:00:00');

  it('conta anos completos', () => {
    expect(ageOn('2008-10-02', ref)).toBe(18);
  });

  it('não arredonda para cima quem faz aniversário amanhã', () => {
    expect(ageOn('2008-10-03', ref)).toBe(17);
  });

  it('conta certo logo depois do aniversário', () => {
    expect(ageOn('2008-10-01', ref)).toBe(18);
  });

  it('lida com 29 de fevereiro sem estourar', () => {
    expect(ageOn('2008-02-29', ref)).toBe(18);
  });
});

describe('needsGuardianConsent', () => {
  const ref = new Date('2026-10-02T12:00:00');

  it('exige para menor de 18', () => {
    expect(needsGuardianConsent('2010-05-01', ref)).toBe(true);
  });

  it('não exige para maior de 18', () => {
    expect(needsGuardianConsent('2000-05-01', ref)).toBe(false);
  });

  it('exige no dia exato dos 18 só até a véspera', () => {
    expect(needsGuardianConsent('2008-10-02', ref)).toBe(false);
    expect(needsGuardianConsent('2008-10-03', ref)).toBe(true);
  });

  it('sem data de nascimento, erra para o lado seguro e exige', () => {
    expect(needsGuardianConsent(null, ref)).toBe(true);
  });
});
