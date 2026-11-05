'use client';

import { useEffect, useState } from 'react';
import type KatexModule from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Fórmula em LaTeX → símbolos de verdade (expoente, raiz, fração, chaves, ±).
 *
 * O KaTeX só é baixado quando aparece a primeira fórmula; até lá (e se a
 * biblioteca falhar) a pessoa vê o texto da fórmula, nunca uma tela vazia.
 *
 * Segurança: o HTML vem do próprio KaTeX com `trust: false` — comandos que
 * criam link, carregam imagem ou inserem HTML/CSS arbitrário ficam desligados
 * e todo texto é escapado. É a única entrada de HTML do Markdown do app; o
 * restante do texto continua virando elementos React (ver markdown.tsx).
 */

type Katex = typeof KatexModule;

let loader: Promise<Katex> | null = null;
function loadKatex(): Promise<Katex> {
  loader ??= import('katex').then((m) => m.default);
  return loader;
}

export const KATEX_OPTIONS = {
  throwOnError: false,
  trust: false,
  strict: 'ignore',
  output: 'htmlAndMathml',
  maxSize: 20,
  maxExpand: 200,
} as const;

export function Math({ tex, display }: { tex: string; display: boolean }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadKatex()
      .then((katex) => {
        if (alive) setHtml(katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: display }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tex, display]);

  if (html === null) {
    return display ? (
      <div data-math="pending" className="my-3 overflow-x-auto font-mono text-[0.95em]">
        {tex}
      </div>
    ) : (
      <span data-math="pending" className="font-mono text-[0.95em]">
        {tex}
      </span>
    );
  }

  return display ? (
    <div className="my-3 overflow-x-auto overflow-y-hidden" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}
