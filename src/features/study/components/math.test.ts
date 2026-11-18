import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { KATEX_OPTIONS } from './math';

/**
 * O HTML da fórmula entra no documento por `dangerouslySetInnerHTML`; a única
 * defesa é a configuração do KaTeX. Estes testes travam essa configuração.
 */
const render = (tex: string) => katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: false });

describe('Math · comandos em português e de física/química', () => {
  it('não mostra erro vermelho em \\sen, \\ohm, \\celsius, \\SI', () => {
    for (const tex of [
      '\\sen x',
      '\\cossec x',
      '\\arcsen x',
      '10\\,\\ohm',
      '25\\celsius',
      '\\SI{10}{m/s}',
    ]) {
      expect(render(tex), tex).not.toContain('katex-error');
    }
  });
});

describe('Math · KaTeX seguro', () => {
  it('renderiza expoente, raiz e chaves', () => {
    const html = render('x^4 + \\sqrt{16} = \\{-3, 3\\}');
    expect(html).toContain('katex');
    expect(html).toContain('sqrt'); // a raiz é desenhada pelo KaTeX
    expect(html).toContain('msupsub'); // o expoente fica elevado
  });

  it('não cria link nem aceita javascript:', () => {
    const html = render('\\href{javascript:alert(1)}{clique}');
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain('href=');
    expect(html).not.toContain('href="javascript');
  });

  it('não carrega imagem nem injeta HTML/CSS', () => {
    expect(render('\\includegraphics{http://x/y.png}')).not.toContain('<img');
    expect(render('\\htmlClass{a}{b}')).not.toContain('class="a"');
    expect(render('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('erro de sintaxe não derruba a tela', () => {
    expect(() => render('\\frac{1')).not.toThrow();
  });
});
