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
  // mhchem: química com \ce{H2O} e \ce{2H2 + O2 -> 2H2O}; registra-se na mesma instância do KaTeX.
  loader ??= import('katex').then(async (m) => {
    await import('katex/contrib/mhchem').catch(() => {});
    return m.default;
  });
  return loader;
}

export const KATEX_OPTIONS = {
  throwOnError: false,
  trust: false,
  strict: 'ignore',
  output: 'htmlAndMathml',
  maxSize: 20,
  maxExpand: 200,
  // Comandos que a IA escreve em português ou de pacotes do LaTeX que o KaTeX não conhece.
  // Sem eles a fórmula inteira aparecia em vermelho, como erro.
  macros: {
    '\\sen': '\\operatorname{sen}',
    '\\cossec': '\\operatorname{cossec}',
    '\\cosec': '\\operatorname{cosec}',
    '\\arcsen': '\\operatorname{arcsen}',
    '\\arctg': '\\operatorname{arctg}',
    '\\ohm': '\\Omega',
    '\\celsius': '{^\\circ\\mathrm{C}}',
    '\\angstrom': '\\text{Å}',
    '\\micro': '\\mu',
    '\\upmu': '\\mu',
    '\\unit': '\\mathrm{#1}',
    '\\si': '\\mathrm{#1}',
    '\\SI': '#1\\,\\mathrm{#2}',
    '\\qty': '#1\\,\\mathrm{#2}',
  },
} as const;

export function Math({ tex, display }: { tex: string; display: boolean }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadKatex()
      .then((katex) => {
        // cópia das macros: o KaTeX grava nelas quando a fórmula usa \gdef
        const opts = {
          ...KATEX_OPTIONS,
          macros: { ...KATEX_OPTIONS.macros },
          displayMode: display,
        };
        if (alive) setHtml(katex.renderToString(tex, opts));
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
    <div
      className="my-3 overflow-x-auto overflow-y-hidden"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}
