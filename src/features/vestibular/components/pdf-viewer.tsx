'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, Download, Loader2, Maximize2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;

/**
 * Visualizador de PDF dentro da página (caderno de questões e gabarito).
 *
 * As páginas são desenhadas na tela (PDF.js) só quando chegam perto da área
 * visível, e liberadas quando saem dela: um caderno do ENEM tem dezenas de
 * páginas, e mantê-las todas desenhadas estouraria a memória do celular.
 * O arquivo vem do servidor do Nexa (`/api/provas/arquivo/[id]`).
 */
export function PdfViewer({
  src,
  downloadHref,
  title,
  officialUrl,
}: {
  src: string;
  downloadHref: string;
  title: string;
  officialUrl?: string;
}) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [aspect, setAspect] = useState(1.414);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  /** Aberto direto do site oficial (o servidor do Nexa não alcançou): "Baixar" também vai direto. */
  const [direct, setDirect] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const ratios = useRef(new Map<number, number>());

  // A página "atual" é a que aparece mais na tela.
  const reportVisible = useCallback((n: number, ratio: number) => {
    if (ratio > 0) ratios.current.set(n, ratio);
    else ratios.current.delete(n);
    let best = 0;
    let bestRatio = 0;
    for (const [num, r] of ratios.current) {
      if (r > bestRatio || (r === bestRatio && num < best)) {
        best = num;
        bestRatio = r;
      }
    }
    if (best > 0) setPage(best);
  }, []);

  // Carrega o documento.
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    setDoc(null);
    setError(null);
    setDirect(false);
    setProgress(0);
    ratios.current.clear();
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        const open = async (direct: boolean) => {
          // Direto: o navegador de quem lê busca no site oficial (sem cookie do Nexa e sem pedir trechos).
          const loading = pdfjs.getDocument(
            direct
              ? { url: officialUrl!, withCredentials: false, disableRange: true }
              : { url: src, withCredentials: true },
          );
          task = loading;
          loading.onProgress = (p: { loaded: number; total: number }) => {
            if (!cancelled && p.total > 0)
              setProgress(Math.min(99, Math.round((p.loaded / p.total) * 100)));
          };
          return loading.promise;
        };
        let pdf: PDFDocumentProxy;
        try {
          pdf = await open(false);
        } catch (viaServer) {
          // O servidor do Nexa nem sempre alcança o site da banca (o INEP, por exemplo, recusa alguns servidores).
          // O navegador do aluno, no Brasil, alcança: tenta direto antes de desistir.
          if (cancelled || !officialUrl || !/^https:\/\//.test(officialUrl)) throw viaServer;
          setProgress(0);
          pdf = await open(true);
          if (!cancelled) setDirect(true);
        }
        if (cancelled) return;
        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setAspect(vp.height / vp.width);
        setDoc(pdf);
        setProgress(null);
      } catch {
        if (cancelled) return;
        // Descobre o motivo: o servidor do Nexa responde com uma mensagem quando o site oficial falha.
        let reason = '';
        try {
          const probe = await fetch(src, {
            headers: { Range: 'bytes=0-0' },
            credentials: 'include',
          });
          if (!probe.ok)
            reason =
              ((await probe.json().catch(() => ({}))) as { message?: string }).message ??
              `Erro ${probe.status}.`;
        } catch {
          reason = 'Sem conexão com o servidor.';
        }
        if (!cancelled)
          setError(`Não consegui abrir este arquivo aqui.${reason ? ` ${reason}` : ''}`);
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [src]);

  // Largura disponível (acompanha a janela e a rotação do celular).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(0, el.clientWidth - 24));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((n: number) => {
    const target = scroller.current?.querySelector<HTMLElement>(`[data-page="${n}"]`);
    target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  const total = doc?.numPages ?? 0;
  const pageWidth = Math.round(width * zoom);

  return (
    <div
      ref={root}
      className="border-border bg-surface flex h-[78vh] min-h-[28rem] flex-col overflow-hidden rounded-2xl border"
    >
      {/* Barra de ferramentas */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-2 border-b px-3 py-2 text-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={!doc || page <= 1}
            onClick={() => goTo(page - 1)}
            className="hover:bg-surface-2 grid size-9 place-items-center rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="min-w-24 text-center tabular-nums" aria-live="polite">
            {doc ? `Página ${page} de ${total}` : '—'}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            disabled={!doc || page >= total}
            onClick={() => goTo(page + 1)}
            className="hover:bg-surface-2 grid size-9 place-items-center rounded-lg disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Diminuir zoom"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}
            className="hover:bg-surface-2 grid size-9 place-items-center rounded-lg disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="hover:bg-surface-2 h-9 min-w-14 rounded-lg px-2 tabular-nums"
            aria-label="Ajustar à largura"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Aumentar zoom"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}
            className="hover:bg-surface-2 grid size-9 place-items-center rounded-lg disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Tela cheia"
            onClick={() => void root.current?.requestFullscreen?.()}
            className="hover:bg-surface-2 hidden size-9 place-items-center rounded-lg sm:grid"
          >
            <Maximize2 className="size-4" aria-hidden />
          </button>
          <a
            href={direct && officialUrl ? officialUrl : downloadHref}
            download={direct ? undefined : true}
            target={direct ? '_blank' : undefined}
            rel={direct ? 'noopener noreferrer' : undefined}
            className="text-brand-text hover:bg-brand-soft ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 font-semibold"
          >
            <Download className="size-4" aria-hidden />
            <span className="hidden sm:inline">Baixar</span>
          </a>
        </div>
      </div>

      {/* Páginas */}
      <div
        ref={scroller}
        className="bg-surface-2 flex-1 overflow-auto px-3 py-3"
        aria-label={`Documento: ${title}`}
      >
        {error ? (
          <div
            role="alert"
            className="bg-danger-soft text-danger mx-auto max-w-md rounded-xl p-4 text-sm"
          >
            <p>{error}</p>
            <div className="mt-3 flex flex-wrap gap-3 font-semibold">
              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Abrir no site oficial
                </a>
              )}
              <a href={downloadHref} className="underline">
                Baixar o arquivo
              </a>
            </div>
          </div>
        ) : !doc ? (
          <div className="text-muted grid h-full place-items-center text-sm" role="status">
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Abrindo o arquivo{progress ? ` · ${progress}%` : '…'}
            </span>
          </div>
        ) : (
          <div className="mx-auto flex w-fit flex-col gap-3">
            {Array.from({ length: total }, (_, i) => (
              <PdfPage
                key={`${i + 1}-${pageWidth}`}
                doc={doc}
                number={i + 1}
                width={pageWidth}
                aspect={aspect}
                root={scroller}
                onVisible={reportVisible}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PdfPage({
  doc,
  number,
  width,
  aspect,
  root,
  onVisible,
}: {
  doc: PDFDocumentProxy;
  number: number;
  width: number;
  aspect: number;
  root: React.RefObject<HTMLDivElement | null>;
  onVisible: (n: number, ratio: number) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [height, setHeight] = useState(Math.round(width * aspect));

  // Perto da área visível desenha; longe, libera a memória.
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry && setNear(entry.isIntersecting), {
      root: root.current,
      rootMargin: '1200px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  // Quanto da página aparece de verdade (sem a margem de pré-carga): decide a "página atual".
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry && onVisible(number, entry.isIntersecting ? entry.intersectionRatio : 0),
      { root: root.current, threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      onVisible(number, 0);
    };
  }, [number, onVisible, root]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    if (!near || width <= 0) {
      c.width = 0;
      c.height = 0;
      return;
    }
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      const p = await doc.getPage(number);
      if (cancelled) return;
      const base = p.getViewport({ scale: 1 });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = width / base.width;
      const viewport = p.getViewport({ scale: scale * dpr });
      c.width = Math.floor(viewport.width);
      c.height = Math.floor(viewport.height);
      c.style.width = `${Math.floor(width)}px`;
      c.style.height = `${Math.floor(base.height * scale)}px`;
      setHeight(Math.floor(base.height * scale));
      const ctx = c.getContext('2d');
      if (!ctx) return;
      task = p.render({ canvasContext: ctx, viewport });
      try {
        await task.promise;
      } catch {
        /* cancelado ao sair da tela */
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [near, width, doc, number]);

  return (
    <div
      ref={holder}
      data-page={number}
      className={cn('bg-white shadow-sm')}
      style={{ width, height }}
    >
      <canvas ref={canvas} aria-label={`Página ${number}`} className="block" />
    </div>
  );
}
