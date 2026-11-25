import { describe, expect, it } from 'vitest';
import { MAX_STROKES, addStroke, clamp01, normalizeStroke, toBoard, undoStroke, type Stroke } from './strokes';

const stroke = (n = 2): Stroke => ({ tool: 'pen', color: '#000', size: 0.004, points: Array.from({ length: n }, (_, i) => ({ x: i / 10, y: 0.5 })) });

describe('quadro branco', () => {
  it('normaliza pontos para 0–1 e limita nas bordas', () => {
    expect(toBoard(50, 100, 200, 400)).toEqual({ x: 0.25, y: 0.25 });
    expect(toBoard(-10, 999, 200, 400)).toEqual({ x: 0, y: 1 });
    expect(toBoard(5, 5, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(clamp01(2)).toBe(1);
  });

  it('adiciona, desfaz e ignora traço vazio', () => {
    let s: Stroke[] = [];
    s = addStroke(s, stroke());
    s = addStroke(s, stroke());
    expect(s).toHaveLength(2);
    expect(addStroke(s, { ...stroke(), points: [] })).toHaveLength(2);
    expect(undoStroke(s)).toHaveLength(1);
    expect(undoStroke([])).toEqual([]);
  });

  it('o mais antigo sai quando passa do limite', () => {
    let s: Stroke[] = [];
    for (let i = 0; i < MAX_STROKES + 5; i += 1) s = addStroke(s, { ...stroke(), color: `#${i}` });
    expect(s).toHaveLength(MAX_STROKES);
    expect(s[0]!.color).toBe('#5');
  });

  it('um toque sem arrastar vira um pontinho desenhável', () => {
    expect(normalizeStroke(stroke(1)).points).toHaveLength(2);
    expect(normalizeStroke(stroke(3)).points).toHaveLength(3);
  });
});
