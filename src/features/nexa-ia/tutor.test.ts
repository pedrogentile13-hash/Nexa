import { describe, expect, it } from 'vitest';
import { buildTutorSystemPrompt, parseTutorMode, TUTOR_MODES } from './tutor';

describe('parseTutorMode', () => {
  it('aceita os modos válidos e cai em "explicar" no resto', () => {
    for (const m of TUTOR_MODES) expect(parseTutorMode(m)).toBe(m);
    expect(parseTutorMode('hack')).toBe('explicar');
    expect(parseTutorMode(null)).toBe('explicar');
  });
});

describe('buildTutorSystemPrompt', () => {
  it('o modo socrático proíbe entregar a resposta', () => {
    expect(buildTutorSystemPrompt({ mode: 'socratico' })).toMatch(/NÃO entregue a resposta/);
  });

  it('muda o tom conforme a jornada', () => {
    expect(buildTutorSystemPrompt({ mode: 'explicar', journey: 'vestibular' })).toMatch(/VESTIBULAR/);
    expect(buildTutorSystemPrompt({ mode: 'explicar', journey: 'school' })).toMatch(/ensino regular/);
    expect(buildTutorSystemPrompt({ mode: 'explicar', journey: null })).toMatch(/ensino regular/);
  });

  it('inclui o contexto do aluno só quando existe', () => {
    expect(buildTutorSystemPrompt({ mode: 'dica', studentContext: 'Matemática 4.0' })).toMatch(/Matemática 4\.0/);
    expect(buildTutorSystemPrompt({ mode: 'dica' })).not.toMatch(/Contexto sobre este aluno/);
  });
});
