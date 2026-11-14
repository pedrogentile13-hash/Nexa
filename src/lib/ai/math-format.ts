/**
 * Regra de escrita de fórmulas, repetida no prompt de todos os assistentes.
 *
 * A tela converte LaTeX em símbolos de verdade (expoente, raiz, fração, chaves),
 * mas só reconhece os delimitadores abaixo. Sem esta regra a IA escreve
 * `x^2` solto ou `\( ... \)` e o aluno vê código na tela.
 */
export const MATH_FORMAT_RULES = `Fórmulas e contas (matemática, física, química): escreva em LaTeX entre cifrões. Dentro do texto use $...$, por exemplo $x^2$, $\\sqrt{16}$, $\\frac{a}{b}$, $x = \\pm 3$, $9 \\times 4 = 36$. Para uma conta em destaque, coloque numa linha só dela, entre $$...$$. Conjunto-solução com chaves: $S = \\{-3, -2, 2, 3\\}$.
Nunca escreva potência, raiz ou fração fora dos cifrões (nada de x^2 solto, sqrt(16) ou 1/2 como fórmula). Não use \\( \\), \\[ \\] nem bloco de código para fórmulas. Dinheiro escreve-se normal, "R$ 10", com espaço depois do R$.
Letras gregas e símbolos: dentro de fórmula use LaTeX ($\\Delta = b^2 - 4ac$, $\\lambda$, $\\pi$); numa frase comum pode escrever o caractere direto (Δ, π, λ, °, →). Nunca deixe comando LaTeX como \\Delta fora dos cifrões.
Física: grandezas e unidades dentro da fórmula, com espaço fino antes da unidade: $v = \\lambda \\cdot f$, $E = h\\nu$, $n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$, $R = 10\\,\\Omega$, $30^\\circ$, $g = 10\\,\\text{m/s}^2$, vetor $\\vec{F} = m\\vec{a}$. Use \\sin, \\cos, \\tan ou \\sen; nunca escreva unidade com \\si ou \\unit.
Química: fórmulas com índice em LaTeX ou com o caractere pronto ($H_2O$ ou H₂O, CO₂); reações com seta: $2H_2 + O_2 \\rightarrow 2H_2O$ ou $\\ce{2H2 + O2 -> 2H2O}$; equilíbrio com $\\rightleftharpoons$.
Genética: escreva alelos como texto simples (AA, Aa, aa; maiúscula = dominante, minúscula = recessivo) e cruzamentos com o sinal ×: Aa × Aa. Para ligado ao sexo use LaTeX: $X^A X^a$, $X^a Y$. Nunca use asterisco (*) como sinal de vezes, porque ele vira itálico na tela.
Tabelas simples em Markdown (| coluna | coluna |, com a linha |---|---|) são permitidas para comparar até 4 colunas, como um quadro de Punnett.`;
