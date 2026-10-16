import { Fragment } from 'react';

/**
 * Markdown mínimo, renderizado como elementos React.
 *
 * Nada de `dangerouslySetInnerHTML`. O texto vem do painel, e um painel tem
 * mais de um autor — um school_admin não é o mesmo nível de confiança que o
 * administrador geral. Produzindo nós React, não existe caminho pelo qual uma
 * `<script>` escrita no editor vire script executado: ela sai como texto.
 *
 * O subconjunto é o que um resumo de verdade usa — títulos, ênfase, listas,
 * citação e código. Tabela e imagem ficaram de fora porque nenhuma das duas
 * cabe bem em 390px de largura, que é onde este texto é lido.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Uma varredura só, com alternativas na mesma expressão: parsers em camadas
  // (negrito e depois itálico) tropeçam em `**texto*` e produzem marcação solta.
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith('**')) {
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

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === '') {
      flushAll();
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

  flushAll();

  return <>{blocks}</>;
}
