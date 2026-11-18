import { q, type PacoteSeed } from './helpers';

export const QUIMICA: PacoteSeed[] = [
  {
    topic: 'tabela-periodica', grade: '1ª série EM', title: 'Tabela periódica e propriedades', subtitle: 'Famílias, períodos e propriedades periódicas',
    resumo: String.raw`## Como a tabela é organizada
Os elementos estão em ordem crescente de **número atômico** ($Z$, o número de prótons).
- **Períodos:** as 7 linhas horizontais. Indicam o número de camadas eletrônicas.
- **Grupos (famílias):** as 18 colunas verticais. Elementos do mesmo grupo têm propriedades parecidas.

## Famílias importantes
- **Grupo 1 – metais alcalinos** (Li, Na, K...): muito reativos.
- **Grupo 2 – alcalinoterrosos** (Mg, Ca...).
- **Grupo 17 – halogênios** (F, Cl, Br, I).
- **Grupo 18 – gases nobres** (He, Ne, Ar...): muito estáveis, quase não reagem.

## Propriedades periódicas
- **Raio atômico:** **aumenta** de cima para baixo em um grupo (mais camadas) e **diminui** da esquerda para a direita em um período.
- **Eletronegatividade:** tendência de atrair elétrons. Aumenta da esquerda para a direita e de baixo para cima. O **flúor** é o mais eletronegativo.
- **Energia de ionização:** energia para retirar um elétron. Segue o mesmo sentido da eletronegatividade.

## Metais, ametais e semimetais
Metais (maioria) conduzem eletricidade e são maleáveis. Ametais (C, N, O, S, halogênios) não. O hidrogênio é um caso à parte.

## Erros comuns
- Confundir **período** (linha) com **grupo** (coluna).
- Achar que o raio atômico cresce para a direita.`,
    questoes: [
      q('facil', 'Os elementos da tabela periódica estão organizados em ordem crescente de:', ['massa molar apenas', 'número atômico', 'número de nêutrons', 'ordem alfabética'], 1, 'A organização moderna segue o número atômico (número de prótons).'),
      q('facil', 'As colunas verticais da tabela periódica são chamadas de:', ['períodos', 'grupos ou famílias', 'camadas', 'isótopos'], 1, 'As colunas são os grupos (famílias). As linhas horizontais são os períodos.'),
      q('facil', 'Os gases nobres pertencem a qual grupo da tabela periódica?', ['1', '2', '17', '18'], 3, 'Os gases nobres (He, Ne, Ar, Kr, Xe, Rn) formam o grupo 18.'),
      q('medio', 'O sódio (Na) pertence à família dos:', ['halogênios', 'gases nobres', 'metais alcalinos', 'calcogênios'], 2, 'O sódio está no grupo 1, os metais alcalinos, junto com Li, K, Rb e Cs.'),
      q('medio', 'Quantos períodos (linhas) tem a tabela periódica atual?', ['4', '7', '18', '10'], 1, 'São 7 períodos, que correspondem ao número de camadas eletrônicas dos átomos. Os 18 são os grupos.'),
      q('medio', 'Qual é a lista correta dos halogênios?', ['F, Cl, Br, I', 'Li, Na, K, Rb', 'He, Ne, Ar, Kr', 'Be, Mg, Ca, Sr'], 0, 'Os halogênios formam o grupo 17: flúor, cloro, bromo e iodo.'),
      q('dificil', 'Em um grupo da tabela periódica, de cima para baixo, o raio atômico:', ['diminui', 'aumenta', 'permanece igual', 'varia sem padrão'], 1, 'Descendo no grupo, o átomo ganha camadas eletrônicas, então o raio atômico aumenta.'),
      q('dificil', 'Qual destes elementos é o mais eletronegativo?', ['Flúor (F)', 'Cloro (Cl)', 'Sódio (Na)', 'Césio (Cs)'], 0, 'A eletronegatividade cresce da esquerda para a direita e de baixo para cima. O flúor é o mais eletronegativo de todos.'),
    ],
  },
  {
    topic: 'ligacoes-quimicas', grade: '1ª série EM', title: 'Ligações químicas', subtitle: 'Iônica, covalente e metálica',
    resumo: String.raw`## Por que os átomos se ligam
Os átomos tendem a ficar com a camada de valência completa (geralmente com 8 elétrons: **regra do octeto**), o que os torna mais estáveis.

## Ligação iônica
Há **transferência** de elétrons de um metal para um ametal, formando **íons** (cátions $+$ e ânions $-$) que se atraem. Exemplo: $\text{Na}^+$ e $\text{Cl}^-$ formam o $\text{NaCl}$.
- Sólidos, com **altos pontos de fusão**.
- **Conduzem eletricidade** fundidos ou dissolvidos em água (não no estado sólido).

## Ligação covalente
Há **compartilhamento** de pares de elétrons, entre ametais (e hidrogênio). Exemplos: $\text{H}_2\text{O}$, $\text{CO}_2$, $\text{Cl}_2$.
- **Apolar:** átomos iguais ou sem diferença de eletronegatividade ($\text{Cl}_2$, $\text{O}_2$).
- **Polar:** átomos diferentes, com atração desigual pelos elétrons ($\text{HCl}$, $\text{H}_2\text{O}$).

## Ligação metálica
Entre metais, os elétrons de valência formam uma "nuvem" compartilhada por todos os átomos. Explica a **condutividade** e a **maleabilidade** dos metais.

## Como decidir o tipo
- Metal + ametal: **iônica**.
- Ametal + ametal: **covalente**.
- Metal + metal: **metálica**.

## Erros comuns
- Dizer que sal de cozinha conduz eletricidade no estado sólido.
- Confundir "transferir" (iônica) com "compartilhar" (covalente).`,
    questoes: [
      q('facil', 'O sal de cozinha (NaCl) é formado por qual tipo de ligação?', ['Covalente', 'Iônica', 'Metálica', 'Ponte de hidrogênio'], 1, 'Há transferência de um elétron do sódio (metal) para o cloro (ametal), formando íons que se atraem.'),
      q('facil', 'Na ligação covalente ocorre:', ['transferência total de elétrons', 'compartilhamento de pares de elétrons', 'formação de nuvem de elétrons entre metais', 'perda de prótons'], 1, 'Os átomos compartilham pares de elétrons para completar a camada de valência.'),
      q('facil', 'Qual é o tipo de ligação entre os átomos de hidrogênio e oxigênio na água (H₂O)?', ['Iônica', 'Metálica', 'Covalente', 'Nuclear'], 2, 'O hidrogênio e o oxigênio são ametais e compartilham elétrons: ligação covalente polar.'),
      q('medio', 'A regra do octeto diz que os átomos tendem a ficar com:', ['2 elétrons na última camada, sempre', '8 elétrons na camada de valência', '8 prótons no núcleo', '18 nêutrons'], 1, 'Os átomos buscam a configuração estável dos gases nobres, com 8 elétrons na camada de valência (2 no caso do hélio).'),
      q('medio', 'Qual é o tipo de ligação que une os átomos de um pedaço de cobre?', ['Iônica', 'Covalente polar', 'Metálica', 'Covalente apolar'], 2, 'Entre átomos de metais ocorre a ligação metálica, com elétrons de valência livres.'),
      q('medio', 'Um composto iônico conduz eletricidade quando está:', ['no estado sólido', 'fundido ou dissolvido em água', 'sempre, em qualquer estado', 'nunca'], 1, 'No sólido os íons ficam presos na rede. Fundidos ou dissolvidos, os íons se movem e conduzem corrente.'),
      q('dificil', 'Qual das substâncias abaixo é formada por moléculas (ligações covalentes)?', ['NaCl', 'KBr', 'CO₂', 'MgO'], 2, 'O CO₂ liga carbono e oxigênio, dois ametais, por ligações covalentes. As outras ligam metal e ametal e são iônicas.'),
      q('dificil', 'Em qual das substâncias a ligação entre os átomos é covalente apolar?', ['HCl', 'NaCl', 'Cl₂', 'H₂O'], 2, 'No Cl₂ os dois átomos são iguais, então atraem os elétrons com a mesma força: ligação covalente apolar.'),
    ],
  },
  {
    topic: 'mol-e-estequiometria', grade: '2ª série EM', title: 'Mol e estequiometria', subtitle: 'Massa molar, quantidade de matéria e cálculos com equações',
    resumo: String.raw`## O mol
1 mol de qualquer substância contém $6{,}02\times10^{23}$ entidades (átomos, moléculas, íons). É a "dúzia" dos químicos.

## Massa molar
É a massa de 1 mol, em g/mol. Soma-se a massa atômica de cada átomo (H = 1, C = 12, N = 14, O = 16):
- $\text{H}_2\text{O}=2\cdot1+16=18\ \text{g/mol}$
- $\text{CO}_2=12+2\cdot16=44\ \text{g/mol}$

## Quantidade de matéria
$$n=\frac{m}{M}$$
36 g de água: $n=\frac{36}{18}=2\ \text{mol}$. E $m=n\cdot M$: 0,5 mol de $\text{CO}_2$ tem $0{,}5\cdot44=22\ \text{g}$.

## Estequiometria
Os **coeficientes** da equação balanceada indicam a proporção em mols.
$$2\,H_2+O_2\rightarrow2\,H_2O$$
4 mol de $H_2$ produzem 4 mol de $H_2O$.

$$N_2+3\,H_2\rightarrow2\,NH_3$$
6 mol de $H_2$ produzem 4 mol de $NH_3$ (regra de três: 3 para 2, 6 para x).

## Roteiro para resolver
1. Escreva a equação **balanceada**.
2. Converta o dado em **mols**.
3. Use a **proporção** dos coeficientes.
4. Converta para a unidade pedida.

## Erros comuns
- Usar uma equação sem balancear.
- Aplicar a proporção em **gramas** em vez de mols.`,
    questoes: [
      q('facil', 'Quantas entidades (átomos, moléculas...) existem em 1 mol?', ['6,02 × 10²³', '6,02 × 10²', '1 000', '12'], 0, 'É a constante de Avogadro: 6,02 × 10²³ por mol.'),
      q('facil', 'Qual é a massa molar da água (H = 1, O = 16)?', ['16 g/mol', '17 g/mol', '18 g/mol', '32 g/mol'], 2, 'H₂O = 2 · 1 + 16 = 18 g/mol.'),
      q('facil', 'Qual é a massa molar do gás carbônico, CO₂ (C = 12, O = 16)?', ['28 g/mol', '44 g/mol', '32 g/mol', '60 g/mol'], 1, 'CO₂ = 12 + 2 · 16 = 44 g/mol.'),
      q('medio', 'Quantos mols existem em 36 g de água (M = 18 g/mol)?', ['0,5 mol', '1 mol', '2 mol', '648 mol'], 2, 'n = m / M = 36 / 18 = 2 mol.'),
      q('medio', 'Na reação 2 H₂ + O₂ → 2 H₂O, quantos mols de água se formam a partir de 4 mol de H₂?', ['2 mol', '4 mol', '6 mol', '8 mol'], 1, 'A proporção entre H₂ e H₂O é de 2 para 2, ou 1 para 1. Então 4 mol de H₂ formam 4 mol de H₂O.'),
      q('medio', 'Qual é a massa de 0,5 mol de CO₂ (M = 44 g/mol)?', ['22 g', '44 g', '88 g', '11 g'], 0, 'm = n · M = 0,5 · 44 = 22 g.'),
      q('dificil', 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de NH₃ se formam a partir de 6 mol de H₂?', ['2 mol', '3 mol', '4 mol', '9 mol'], 2, 'A proporção é de 3 mol de H₂ para 2 mol de NH₃. Para 6 mol de H₂, formam-se 4 mol de NH₃.'),
      q('dificil', 'Na reação 2 H₂ + O₂ → 2 H₂O, que massa de água se forma a partir de 4 g de H₂ (H₂ = 2 g/mol; H₂O = 18 g/mol)?', ['18 g', '36 g', '72 g', '4 g'], 1, '4 g de H₂ são 2 mol. Pela proporção 2:2, formam-se 2 mol de H₂O, que pesam 2 · 18 = 36 g.'),
    ],
  },
];
