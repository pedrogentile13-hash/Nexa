'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Grid3x3, Highlighter, PenLine, PencilRuler, Trash2, Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLORS, TOOL_SIZE, addStroke, normalizeStroke, toBoard, undoStroke, type Stroke, type Tool } from './strokes';

/** Guarda o desenho de cada questão enquanto o aluno resolve (some ao sair da prova). */
export function useWhiteboardStore() {
  const [boards, setBoards] = useState<Record<string, Stroke[]>>({});
  const set = useCallback((key: string, strokes: Stroke[]) => setBoards((b) => ({ ...b, [key]: strokes })), []);
  return { boards, set };
}

export type WhiteboardStore = ReturnType<typeof useWhiteboardStore>;

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, strokes: Stroke[]) {
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    if (s.points.length === 0) continue;
    ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.globalAlpha = s.tool === 'marker' ? 0.35 : 1;
    ctx.strokeStyle = s.tool === 'eraser' ? '#000' : s.color;
    ctx.lineWidth = Math.max(1, s.size * w);
    ctx.beginPath();
    ctx.moveTo(s.points[0]!.x * w, s.points[0]!.y * h);
    for (let i = 1; i < s.points.length; i += 1) ctx.lineTo(s.points[i]!.x * w, s.points[i]!.y * h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function Canvas({ strokes, tool, color, onChange }: { strokes: Stroke[]; tool: Tool; color: string; onChange: (s: Stroke[]) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const current = useRef<Stroke | null>(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const redraw = useCallback((extra?: Stroke | null) => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    paint(ctx, canvas.width, canvas.height, extra ? [...strokesRef.current, extra] : strokesRef.current);
  }, []);

  // Ajusta a resolução do canvas ao tamanho na tela (nítido em tela retina) e redesenha.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => redraw(), [strokes, redraw]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return toBoard(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
  }

  return (
    <canvas
      ref={ref}
      aria-label="Área de rascunho: desenhe com o dedo, a caneta ou o mouse"
      className="h-full w-full cursor-crosshair touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        current.current = { tool, color, size: TOOL_SIZE[tool], points: [point(e)] };
        redraw(normalizeStroke(current.current));
      }}
      onPointerMove={(e) => {
        const s = current.current;
        if (!s) return;
        s.points.push(point(e));
        redraw(s);
      }}
      onPointerUp={() => {
        const s = current.current;
        current.current = null;
        if (s) onChange(addStroke(strokesRef.current, normalizeStroke(s)));
      }}
      onPointerCancel={() => {
        current.current = null;
        redraw();
      }}
    />
  );
}

/**
 * Quadro branco da questão: o aluno rascunha o raciocínio com o dedo, a caneta ou o mouse.
 * É só para ele — nada disto é enviado nem corrigido. Cada questão tem o seu quadro.
 */
export function WhiteboardButton({
  boardKey,
  label,
  statement,
  store,
  className,
}: {
  boardKey: string;
  label: string;
  /** Enunciado, para o aluno ler sem fechar o quadro. */
  statement?: string;
  store: WhiteboardStore;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [grid, setGrid] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const strokes = store.boards[boardKey] ?? [];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toolBtn = (t: Tool, Icon: typeof PenLine, name: string) => (
    <button
      type="button"
      onClick={() => setTool(t)}
      aria-pressed={tool === t}
      aria-label={name}
      className={cn('grid size-10 place-items-center rounded-full border', tool === t ? 'border-brand bg-brand-soft text-brand-text' : 'border-border text-muted hover:bg-surface-2')}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Abrir o quadro branco — ${label}`}
        className={cn('border-border bg-surface text-muted hover:bg-surface-2 relative grid size-12 place-items-center rounded-full border shadow-lg', className)}
      >
        <PencilRuler className="size-5" aria-hidden />
        {strokes.length > 0 && <span className="bg-brand absolute top-1 right-1 size-2.5 rounded-full" aria-hidden />}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Quadro branco — ${label}`} className="bg-bg pt-safe pb-safe fixed inset-0 z-[70] flex flex-col">
          <div className="border-border flex items-center gap-2 border-b px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">Quadro · {label}</p>
            {statement && (
              <button type="button" onClick={() => setShowStatement((v) => !v)} className="text-brand-text text-xs font-semibold underline-offset-2 hover:underline">
                {showStatement ? 'Esconder enunciado' : 'Ver enunciado'}
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar o quadro" className="border-border hover:bg-surface-2 grid size-10 place-items-center rounded-full border">
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {showStatement && statement && <p className="bg-surface-2 text-muted max-h-[30dvh] overflow-y-auto px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap">{statement}</p>}

          <div
            className="relative min-h-0 flex-1 bg-white"
            style={grid ? { backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' } : undefined}
          >
            <Canvas strokes={strokes} tool={tool} color={color} onChange={(s) => store.set(boardKey, s)} />
          </div>

          <div className="border-border bg-surface flex flex-wrap items-center justify-center gap-2 border-t px-3 py-2.5">
            {toolBtn('pen', PenLine, 'Caneta')}
            {toolBtn('marker', Highlighter, 'Marca-texto')}
            {toolBtn('eraser', Eraser, 'Borracha')}
            <span className="bg-border mx-1 h-6 w-px" aria-hidden />
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('pen');
                }}
                aria-label={`Cor ${c}`}
                aria-pressed={color === c && tool !== 'eraser'}
                className={cn('size-7 rounded-full border-2', color === c && tool !== 'eraser' ? 'border-text' : 'border-transparent')}
                style={{ background: c }}
              />
            ))}
            <span className="bg-border mx-1 h-6 w-px" aria-hidden />
            <button type="button" onClick={() => setGrid((g) => !g)} aria-pressed={grid} aria-label="Quadriculado" className={cn('grid size-10 place-items-center rounded-full border', grid ? 'border-brand bg-brand-soft text-brand-text' : 'border-border text-muted')}>
              <Grid3x3 className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => store.set(boardKey, undoStroke(strokes))} disabled={strokes.length === 0} aria-label="Desfazer" className="border-border text-muted grid size-10 place-items-center rounded-full border disabled:opacity-40">
              <Undo2 className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => store.set(boardKey, [])} disabled={strokes.length === 0} aria-label="Limpar o quadro" className="border-border text-danger grid size-10 place-items-center rounded-full border disabled:opacity-40">
              <Trash2 className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
