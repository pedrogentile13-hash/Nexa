import { describe, expect, it } from 'vitest';
import { levelForXp, levelProgressPercent, xpForLevel, xpToNextLevel } from './level';

/**
 * O banco é a autoridade sobre o nível. Estes casos são os mesmos que
 * `xp_to_level()` produz — se alguém mexer na curva de um lado só, aqui quebra.
 *
 *   level = greatest(1, 1 + floor(sqrt(xp / 100)))
 */
describe('levelForXp · espelha xp_to_level() do banco', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [399, 2],
    [400, 3],
    [900, 4],
    [1600, 5],
    [2500, 6],
  ])('xp %i → nível %i', (xp, level) => {
    expect(levelForXp(xp)).toBe(level);
  });

  it('não cai abaixo do nível 1 nem com XP negativo', () => {
    expect(levelForXp(-500)).toBe(1);
  });
});

describe('xpToNextLevel', () => {
  it('mede a distância até o início do próximo nível', () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(100)).toBe(300);
    expect(xpToNextLevel(399)).toBe(1);
  });

  it('chegar exatamente no limiar já conta como o nível novo', () => {
    // Com 400 XP o aluno É nível 3; o que falta é para o 4.
    expect(levelForXp(400)).toBe(3);
    expect(xpToNextLevel(400)).toBe(500);
  });

  it('nunca devolve valor negativo', () => {
    expect(xpToNextLevel(-10)).toBe(100);
  });
});

describe('levelProgressPercent', () => {
  it('começa em 0 ao entrar no nível e chega perto de 100 no fim', () => {
    expect(levelProgressPercent(100)).toBe(0);
    expect(levelProgressPercent(399)).toBeCloseTo(99.67, 1);
  });

  it('fica na metade no meio do nível', () => {
    // Nível 2 vai de 100 a 400; o meio é 250.
    expect(levelProgressPercent(250)).toBeCloseTo(50, 5);
  });

  it('a barra e o número contam a mesma história', () => {
    // Se a barra está em 0%, tudo do nível ainda falta.
    const xp = xpForLevel(4);
    expect(levelProgressPercent(xp)).toBe(0);
    expect(xpToNextLevel(xp)).toBe(xpForLevel(5) - xp);
  });
});
