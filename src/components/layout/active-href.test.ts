import { describe, expect, it } from 'vitest';
import { bestActiveHref } from './active-href';

const items = ['/vestibular', '/vestibular/redacao', '/vestibular/redacao/temas', '/revisoes'];

describe('bestActiveHref', () => {
  it('escolhe o item mais específico', () => {
    expect(bestActiveHref('/vestibular/redacao/temas', items)).toBe('/vestibular/redacao/temas');
    expect(bestActiveHref('/vestibular/redacao/abc-123', items)).toBe('/vestibular/redacao');
    expect(bestActiveHref('/vestibular', items)).toBe('/vestibular');
    expect(bestActiveHref('/vestibular/desempenho', items)).toBe('/vestibular');
  });
  it('não casa por prefixo de texto parcial', () => {
    expect(bestActiveHref('/vestibularx', items)).toBeNull();
    expect(bestActiveHref('/perfil', items)).toBeNull();
  });
});
