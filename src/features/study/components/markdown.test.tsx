import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from './markdown';

/**
 * O que estes testes protegem
 *
 * O texto renderizado aqui vem do painel, e o painel tem mais de um autor: um
 * school_admin não tem o mesmo nível de confiança do administrador geral. Se
 * uma `<script>` escrita no editor de resumo virasse script executado, um
 * único autor comprometeria a sessão de todos os alunos que abrissem o resumo.
 */

function render(source: string): string {
  return renderToStaticMarkup(<Markdown source={source} />);
}

describe('Markdown · segurança', () => {
  it('escapa HTML em vez de executá-lo', () => {
    const html = render('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('não deixa passar atributo de evento', () => {
    const html = render('<img src=x onerror="alert(1)">');
    // `onerror` continua aparecendo — como TEXTO escapado, que é o ponto. O que
    // não pode existir é a tag: sem `<img`, não há atributo para o navegador
    // interpretar.
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&quot;alert(1)&quot;');
  });

  it('trata javascript: como texto, não como link', () => {
    const html = render('[clique](javascript:alert(1))');
    expect(html).not.toContain('href');
  });
});

describe('Markdown · formatação', () => {
  it('renderiza títulos em dois níveis', () => {
    expect(render('## Equações')).toContain('<h2');
    expect(render('### Detalhe')).toContain('<h3');
  });

  it('junta linhas soltas num parágrafo e separa por linha em branco', () => {
    const html = render('primeira linha\nsegunda linha\n\noutro parágrafo');
    expect((html.match(/<p/g) ?? []).length).toBe(2);
  });

  it('renderiza lista com marcador e lista numerada', () => {
    expect(render('- um\n- dois')).toContain('<li>um</li>');
    expect(render('1. um\n2. dois')).toContain('<li>um</li>');
  });

  it('renderiza citação', () => {
    expect(render('> pegadinha de prova')).toContain('<blockquote');
  });

  it('aplica negrito, itálico e código na mesma varredura', () => {
    const html = render('**forte** e *suave* e `v = v0 + a·t`');
    expect(html).toContain('<strong');
    expect(html).toContain('<em>suave</em>');
    expect(html).toContain('<code');
  });

  it('não confunde negrito com itálico quando os dois se tocam', () => {
    // Um parser em camadas transforma `**a**` em `*<em>a</em>*` e deixa
    // asterisco solto na tela.
    const html = render('**a** *b*');
    expect(html).toContain('<strong class="font-semibold">a</strong>');
    expect(html).toContain('<em>b</em>');
    expect(html).not.toContain('*');
  });

  it('devolve vazio para texto vazio, sem parágrafo fantasma', () => {
    expect(render('')).toBe('');
    expect(render('\n\n')).toBe('');
  });
});
