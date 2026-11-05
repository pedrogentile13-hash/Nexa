import { Fragment } from 'react';
import Link from 'next/link';
import { Math } from './math';

/**
 * Markdown mínimo, renderizado como elementos React.
 *
 * Nada de `dangerouslySetInnerHTML`. O texto vem do painel, e um painel tem
 * mais de um autor — um school_admin não é o mesmo nível de confiança que o
 * administrador geral. Produzindo nós React, não existe caminho pelo qual uma
 * `<script>` escrita no editor vire script executado: ela sai como texto.
 *
 * Fórmulas em LaTeX (`$x^2$` no texto, `$$...$$` em linha própria) viram símbolos
 * de verdade pelo componente `Math` (KaTeX, com `trust: false`).
 *
 * O subconjunto é o que um resumo de verdade usa — títulos, ênfase, listas,
 * citação e código. Tabela e imagem ficaram de fora porque nenhuma das duas
 * cabe bem em 390px de largura, que é onde este texto é lido.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Uma varredura só, com alternativas na mesma expressão: parsers em camadas
  // (negrito e depois itálico) tropeçam em `**texto*` e produzem marcação solta.
  // Link só para caminho DO PRÓPRIO app (começa com /): nada de http:, javascript: ou outro site.
  // Fórmula vem ANTES de ênfase: `$2 * 3$` não pode virar itálico. O cifrão só abre
  // fórmula se colar no texto ("$x$") e não fecha antes de um dígito — assim
  // "R$ 5 e R$ 10" continua sendo dinheiro.
  const pattern =
    /(\$\$[^$\n]+?\$\$|\$(?=\S)[^$\n]*?\S\$(?!\d)|\\\([^\n]*?\\\)|\[[^\]]+\]\(\/(?!\/)[^)\s]*\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith('$$') || token.startsWith('\\(')) {
      nodes.push(<Math key={key} tex={token.slice(2, -2).trim()} display={false} />);
    } else if (token.startsWith('$')) {
      nodes.push(<Math key={key} tex={token.slice(1, -1).trim()} display={false} />);
    } else if (token.startsWith('[')) {
      const split = token.indexOf('](');
      const href = token.slice(split + 2, -1);
      nodes.push(
        <Link key={key} href={href as '/'} className="text-brand-text font-semibold underline underline-offset-2">
          {token.slice(1, split)}
        </Link>,
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key} className="bg-surface-2 rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];

  let paragraph: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const key = `p-${blocks.length}`;
    blocks.push(
      <p key={key} className="mt-4 first:mt-0">
        {renderInline(paragraph.join(' '), key)}
      </p>,
    );
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    const key = `ul-${blocks.length}`;
    blocks.push(
      <ul key={key} className="marker:text-subtle mt-4 list-disc space-y-1.5 pl-5">
        {list.map((item, index) => (
          <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  }

  function flushQuote() {
    if (quote.length === 0) return;
    const key = `q-${blocks.length}`;
    blocks.push(
      <blockquote
        key={key}
        className="border-brand bg-brand-soft text-brand-text mt-5 rounded-r-md border-l-4 px-4 py-3 text-[0.95em] leading-relaxed"
      >
        {renderInline(quote.join(' '), key)}
      </blockquote>,
    );
    quote = [];
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  // Fórmula em várias linhas ($$ ... $$): junta até o fechamento. Sem fechamento
  // (resposta ainda chegando), o texto aparece como parágrafo comum.
  let mathLines: string[] | null = null;

  function pushMathBlock(tex: string) {
    flushAll();
    blocks.push(<Math key={`m-${blocks.length}`} tex={tex.trim()} display />);
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (mathLines) {
      const close = line.indexOf('$$');
      if (close >= 0) {
        mathLines.push(line.slice(0, close));
        pushMathBlock(mathLines.join('\n'));
        mathLines = null;
      } else {
        mathLines.push(line);
      }
      continue;
    }

    const trimmed = line.trim();

    if (trimmed === '') {
      flushAll();
      continue;
    }

    const oneLineMath = /^\$\$(.+)\$\$$/.exec(trimmed) ?? /^\\\[(.+)\\\]$/.exec(trimmed);
    if (oneLineMath) {
      pushMathBlock(oneLineMath[1] ?? '');
      continue;
    }

    if (trimmed.startsWith('$$')) {
      flushAll();
      mathLines = [trimmed.slice(2)];
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      flushAll();
      blocks.push(<hr key={`hr-${blocks.length}`} className="border-border my-5" />);
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1]?.length ?? 2;
      const text = heading[2] ?? '';
      const key = `h-${blocks.length}`;
      const className =
        level <= 2
          ? 'mt-8 text-xl font-semibold tracking-tight first:mt-0'
          : 'mt-6 text-base font-semibold first:mt-0';
      blocks.push(
        <Fragment key={key}>
          {level <= 2 ? (
            <h2 className={className}>{renderInline(text, key)}</h2>
          ) : (
            <h3 className={className}>{renderInline(text, key)}</h3>
          )}
        </Fragment>,
      );
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushQuote();
      list.push(bullet[1] ?? '');
      continue;
    }

    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (numbered) {
      flushParagraph();
      flushQuote();
      list.push(numbered[1] ?? '');
      continue;
    }

    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1] ?? '');
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  if (mathLines) {
    // Fórmula que nunca fechou: mostra como texto em vez de sumir com o conteúdo.
    paragraph.push(`$$${mathLines.join(' ')}`.trim());
  }
  flushAll();

  return <>{blocks}</>;
}
