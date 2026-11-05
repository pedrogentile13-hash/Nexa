/**
 * Regra de escrita de fórmulas, repetida no prompt de todos os assistentes.
 *
 * A tela converte LaTeX em símbolos de verdade (expoente, raiz, fração, chaves),
 * mas só reconhece os delimitadores abaixo. Sem esta regra a IA escreve
 * `x^2` solto ou `\( ... \)` e o aluno vê código na tela.
 */
export const MATH_FORMAT_RULES = `Fórmulas e contas (matemática, física, química): escreva em LaTeX entre cifrões. Dentro do texto use $...$, por exemplo $x^2$, $\\sqrt{16}$, $\\frac{a}{b}$, $x = \\pm 3$, $9 \\times 4 = 36$. Para uma conta em destaque, coloque numa linha só dela, entre $$...$$. Conjunto-solução com chaves: $S = \\{-3, -2, 2, 3\\}$.
Nunca escreva potência, raiz ou fração fora dos cifrões (nada de x^2 solto, sqrt(16) ou 1/2 como fórmula). Não use \\( \\), \\[ \\] nem bloco de código para fórmulas. Dinheiro escreve-se normal, "R$ 10", com espaço depois do R$.`;
