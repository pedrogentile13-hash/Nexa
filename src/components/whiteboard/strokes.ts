/**
 * Quadro branco — a parte pura.
 *
 * Os traços são guardados em coordenadas NORMALIZADAS (0 a 1 em relação ao tamanho do quadro), não em pixels:
 * assim o desenho se redesenha igual no celular girado, no tablet ou no desktop.
 */

export type Tool = 'pen' | 'marker' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  tool: Tool;
  color: string;
  /** Espessura relativa à largura do quadro (0.004 ≈ caneta fina). */
  size: number;
  points: Point[];
}

export const COLORS = ['#1f2937', '#2563eb', '#dc2626', '#16a34a'] as const;

/** Espessura por ferramenta, em fração da largura do quadro. */
export const TOOL_SIZE: Record<Tool, number> = { pen: 0.004, marker: 0.018, eraser: 0.03 };

/** No máximo de traços guardados por questão (o desenho de uma questão nunca precisa de mais). */
export const MAX_STROKES = 400;

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Converte um ponto da tela (px) para o quadro (0–1). */
export function toBoard(px: number, py: number, width: number, height: number): Point {
  if (width <= 0 || height <= 0) return { x: 0, y: 0 };
  return { x: clamp01(px / width), y: clamp01(py / height) };
}

/** Acrescenta um traço respeitando o limite (o mais antigo sai primeiro). */
export function addStroke(strokes: Stroke[], stroke: Stroke): Stroke[] {
  if (stroke.points.length === 0) return strokes;
  const next = [...strokes, stroke];
  return next.length > MAX_STROKES ? next.slice(next.length - MAX_STROKES) : next;
}

/** Desfaz o último traço. */
export function undoStroke(strokes: Stroke[]): Stroke[] {
  return strokes.slice(0, -1);
}

/** Um traço de um ponto só (toque sem arrastar) vira um pontinho: repete o ponto para o canvas desenhar. */
export function normalizeStroke(stroke: Stroke): Stroke {
  return stroke.points.length === 1 ? { ...stroke, points: [stroke.points[0]!, { ...stroke.points[0]! }] } : stroke;
}
