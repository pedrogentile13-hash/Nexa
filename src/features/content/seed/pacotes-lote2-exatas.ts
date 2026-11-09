import { q, type PacoteSeed } from './helpers';

export const LOTE2_EXATAS: PacoteSeed[] = [
  {
    topic: 'trabalho-e-energia', grade: '1ª série EM', title: 'Trabalho, energia e potência', subtitle: 'Energia cinética, potencial e conservação da energia',
    resumo: String.raw`## Trabalho de uma força
Quando uma força desloca um corpo na direção da força:
$$\tau=F\cdot d$$
Em joules (J), com $F$ em newtons e $d$ em metros. Uma força de 10 N ao longo de 5 m realiza $\tau=50\ \text{J}$.

## Energia
- **Cinética:** energia do movimento. $E_c=\frac{m\,v^2}{2}$. Uma massa de 2 kg a 3 m/s: $E_c=\frac{2\cdot9}{2}=9\ \text{J}$.
- **Potencial gravitacional:** energia da altura. $E_p=m\,g\,h$. Massa de 5 kg a 10 m (com $g=10$): $E_p=500\ \text{J}$.

Se a velocidade **dobra**, a energia cinética **quadruplica** (depende de $v^2$).

## Conservação da energia mecânica
Sem atrito, $E_c+E_p$ permanece constante. Um objeto solto de $h=5\ \text{m}$ chega ao solo com $v=\sqrt{2gh}=\sqrt{100}=10\ \text{m/s}$.

## Potência
$$P=\frac{\tau}{\Delta t}$$
Em watts (W). Uma máquina que realiza 600 J em 20 s tem $P=30\ \text{W}$.

## Erros comuns
- Confundir **joule** (energia) com **watt** (potência).
- Esquecer de elevar a velocidade ao quadrado.
- Trocar a massa em gramas por quilogramas.`,
    questoes: [
      q('facil', 'Uma força de 10 N desloca um corpo por 5 m, na direção da força. Qual é o trabalho realizado?', ['2 J', '15 J', '50 J', '5 J'], 2, 'τ = F · d = 10 · 5 = 50 J.'),
      q('facil', 'Qual é a unidade de energia no Sistema Internacional?', ['Watt', 'Newton', 'Joule', 'Pascal'], 2, 'Energia e trabalho são medidos em joules (J). O watt mede potência.'),
      q('facil', 'Qual é a unidade de potência no Sistema Internacional?', ['Joule', 'Watt', 'Newton', 'Ampère'], 1, 'Potência é energia por tempo e é medida em watts (W), isto é, joules por segundo.'),
      q('medio', 'Qual é a energia cinética de um corpo de 2 kg com velocidade de 3 m/s?', ['6 J', '9 J', '18 J', '3 J'], 1, 'Ec = m·v²/2 = 2·9/2 = 9 J. A alternativa 18 esquece de dividir por 2.'),
      q('medio', 'Qual é a energia potencial gravitacional de um corpo de 5 kg a 10 m de altura (g = 10 m/s²)?', ['50 J', '500 J', '5 J', '150 J'], 1, 'Ep = m·g·h = 5 · 10 · 10 = 500 J.'),
      q('medio', 'Uma máquina realiza um trabalho de 600 J em 20 s. Qual é sua potência?', ['30 W', '12 000 W', '3 W', '620 W'], 0, 'P = τ / Δt = 600 / 20 = 30 W.'),
      q('dificil', 'Um objeto de 2 kg é solto do repouso de 5 m de altura (g = 10 m/s², sem atrito). Qual é sua velocidade ao chegar ao solo?', ['5 m/s', '10 m/s', '50 m/s', '100 m/s'], 1, 'Conservação: m·g·h = m·v²/2, então v = √(2·g·h) = √(2·10·5) = 10 m/s. A massa se cancela.'),
      q('dificil', 'Se a velocidade de um corpo dobra, sua energia cinética:', ['dobra', 'quadruplica', 'triplica', 'não muda'], 1, 'Ec é proporcional a v². Com v dobrada, Ec fica 2² = 4 vezes maior.'),
    ],
  },
  {
    topic: 'termologia', grade: '2ª série EM', title: 'Termologia: temperatura e calor', subtitle: 'Escalas, calor sensível e latente, propagação de calor',
    resumo: String.raw`## Temperatura × calor
**Temperatura** mede o grau de agitação das partículas. **Calor** é a energia térmica em trânsito entre corpos com temperaturas diferentes: flui do mais quente para o mais frio.

## Escalas
$$T_K=T_C+273\qquad\frac{T_F-32}{9}=\frac{T_C}{5}$$
A água ferve a 100 °C = 373 K = 212 °F. Em °F, 50 °C valem $\frac{50\cdot9}{5}+32=122$.

## Calor sensível (muda a temperatura)
$$Q=m\cdot c\cdot\Delta T$$
Esquentar 200 g de água (c = 1 cal/g·°C) de 20 °C a 30 °C: $Q=200\cdot1\cdot10=2000\ \text{cal}$.

## Calor latente (muda o estado, sem mudar a temperatura)
$$Q=m\cdot L$$
Fundir 100 g de gelo (L = 80 cal/g): $Q=8000\ \text{cal}$.

## Equilíbrio térmico
Misturando massas iguais de água a 80 °C e a 20 °C, a temperatura final é a **média**: 50 °C.

## Propagação do calor
- **Condução:** em sólidos, de partícula a partícula.
- **Convecção:** em fluidos, por correntes de matéria.
- **Irradiação:** por ondas, inclusive no vácuo (o calor do Sol).

## Erros comuns
- Esquecer de somar 273 (e não 273,15 só em exercícios simples).
- Usar $Q=m\,c\,\Delta T$ durante uma mudança de estado.`,
    questoes: [
      q('facil', 'A água ferve a 100 °C ao nível do mar. Quanto é isso na escala Kelvin?', ['273 K', '373 K', '100 K', '173 K'], 1, 'T(K) = T(°C) + 273 = 100 + 273 = 373 K.'),
      q('facil', 'O calor é:', ['a temperatura de um corpo', 'a energia térmica em trânsito por diferença de temperatura', 'a quantidade de matéria', 'sempre a mesma coisa que o frio'], 1, 'Calor é energia em trânsito. Temperatura é uma medida de agitação das partículas.'),
      q('facil', 'A forma de propagação de calor que ocorre em um sólido, de partícula a partícula, é a:', ['condução', 'convecção', 'irradiação', 'evaporação'], 0, 'Na condução o calor passa de partícula para partícula, como ao longo de uma barra de metal.'),
      q('medio', 'Quanto vale 50 °C na escala Fahrenheit?', ['90 °F', '122 °F', '82 °F', '212 °F'], 1, 'F = C · 9/5 + 32 = 90 + 32 = 122 °F. A alternativa 212 °F é a ebulição da água.'),
      q('medio', 'Quantas calorias são necessárias para aquecer 200 g de água de 20 °C a 30 °C (c = 1 cal/g·°C)?', ['200 cal', '2 000 cal', '6 000 cal', '20 cal'], 1, 'Q = m·c·ΔT = 200 · 1 · 10 = 2 000 cal.'),
      q('medio', 'O calor do Sol chega à Terra, atravessando o vácuo, por:', ['condução', 'convecção', 'irradiação', 'evaporação'], 2, 'Condução e convecção precisam de matéria. A irradiação ocorre por ondas eletromagnéticas e se propaga no vácuo.'),
      q('dificil', 'Misturam-se 100 g de água a 80 °C com 100 g de água a 20 °C, em um recipiente isolado. Qual é a temperatura final de equilíbrio?', ['40 °C', '50 °C', '60 °C', '100 °C'], 1, 'Com massas iguais da mesma substância, a temperatura final é a média: (80 + 20)/2 = 50 °C.'),
      q('dificil', 'Qual é a quantidade de calor necessária para fundir 100 g de gelo a 0 °C (L = 80 cal/g)?', ['800 cal', '8 000 cal', '80 cal', '100 cal'], 1, 'Na mudança de estado, Q = m · L = 100 · 80 = 8 000 cal, sem variação de temperatura.'),
    ],
  },
  {
    topic: 'funcoes-inorganicas', grade: '2ª série EM', title: 'Funções inorgânicas: ácidos, bases, sais e óxidos', subtitle: 'Como identificar e como reagem',
    resumo: String.raw`## Ácidos
Em água, liberam íons $H^+$. Têm sabor azedo e reagem com bases. Exemplos: $HCl$ (ácido clorídrico), $H_2SO_4$ (ácido sulfúrico), $HNO_3$ (ácido nítrico). O vinagre contém ácido acético.

## Bases (hidróxidos)
Em água, liberam íons $OH^-$. Exemplos: $NaOH$ (soda cáustica), $Ca(OH)_2$ (cal). O leite de magnésia, $Mg(OH)_2$, é uma base fraca usada contra azia.

## Sais
Formados quando o cátion de uma base se junta ao ânion de um ácido. Exemplo: $NaCl$ (sal de cozinha).

## Óxidos
Compostos **binários** em que o oxigênio é o elemento mais eletronegativo. Exemplos: $CO_2$, $CaO$, $H_2O$.

## Neutralização
$$\text{ácido}+\text{base}\rightarrow\text{sal}+\text{água}$$
$$HCl+NaOH\rightarrow NaCl+H_2O$$

## Como identificar pela fórmula
- Começa com $H$ (e não é água): em geral, ácido.
- Termina em $OH$: base.
- Metal + ametal (sem $H$ nem $OH$): em geral, sal.
- Dois elementos, um deles oxigênio: óxido.

## Erros comuns
- Confundir o $H_2O$ (óxido) com ácido por começar com $H$.
- Achar que neutralizar produz só água (produz também sal).`,
    questoes: [
      q('facil', 'O HCl (ácido clorídrico) pertence à função:', ['ácido', 'base', 'sal', 'óxido'], 0, 'Em água, o HCl libera íons H⁺, o que o caracteriza como ácido.'),
      q('facil', 'O NaOH (soda cáustica) é classificado como:', ['ácido', 'base', 'sal', 'óxido'], 1, 'Libera íons OH⁻ em água: é uma base (hidróxido).'),
      q('facil', 'O sal de cozinha, NaCl, pertence à função:', ['ácido', 'base', 'sal', 'óxido'], 2, 'O NaCl é um sal: o cátion Na⁺ vem de uma base e o ânion Cl⁻ vem de um ácido.'),
      q('medio', 'A reação entre um ácido e uma base (neutralização) produz:', ['sal e água', 'somente água', 'outro ácido e outra base', 'um óxido e um gás'], 0, 'Ácido + base → sal + água. Por exemplo: HCl + NaOH → NaCl + H₂O.'),
      q('medio', 'O gás carbônico, CO₂, é classificado como:', ['ácido', 'base', 'sal', 'óxido'], 3, 'É um composto binário em que o oxigênio é o elemento mais eletronegativo: um óxido.'),
      q('medio', 'Qual é a fórmula do ácido sulfúrico?', ['HCl', 'H₂SO₄', 'HNO₃', 'NaOH'], 1, 'O ácido sulfúrico é o H₂SO₄. HCl é o clorídrico, HNO₃ é o nítrico e NaOH é uma base.'),
      q('dificil', 'Quais são os produtos da reação HCl + NaOH?', ['NaCl + H₂O', 'NaH + ClOH', 'Na₂O + HCl', 'NaOH + Cl₂'], 0, 'É uma neutralização: o H⁺ do ácido e o OH⁻ da base formam água, e Na⁺ com Cl⁻ formam o sal NaCl.'),
      q('dificil', 'O leite de magnésia, Mg(OH)₂, é usado contra a azia porque tem caráter:', ['ácido, que reforça o suco gástrico', 'básico, que neutraliza parte do ácido do estômago', 'neutro, que não reage', 'oxidante, que destrói bactérias'], 1, 'Mg(OH)₂ é uma base fraca. Ela reage com o ácido clorídrico do estômago e diminui a acidez.'),
    ],
  },
  {
    topic: 'solucoes', grade: '2ª série EM', title: 'Soluções e concentração', subtitle: 'Concentração comum, molaridade e diluição',
    resumo: String.raw`## Solução
Mistura **homogênea** de um **soluto** (o que se dissolve) em um **solvente** (o que dissolve). No cafezinho com açúcar, o açúcar é o soluto e a água é o solvente.

## Concentração comum
$$C=\frac{m_{soluto}}{V_{solução}}\quad(\text{g/L})$$
10 g de soluto em 2 L: $C=5\ \text{g/L}$. E em 500 mL (0,5 L) de uma solução de 4 g/L há $4\cdot0{,}5=2\ \text{g}$.

## Molaridade (concentração em mol/L)
$$M=\frac{n}{V}\qquad n=\frac{m}{M_{molar}}$$
1 mol de NaCl em 2 L: $M=0{,}5\ \text{mol/L}$.

Preparando 500 mL de NaOH 0,2 mol/L ($M_{molar}=40\ \text{g/mol}$): $n=0{,}2\cdot0{,}5=0{,}1\ \text{mol}$ e $m=0{,}1\cdot40=4\ \text{g}$.

## Diluição
Ao acrescentar solvente, o número de mols do soluto **não muda**:
$$M_1V_1=M_2V_2$$
100 mL de solução 2 mol/L levados a 400 mL: $M_2=\frac{2\cdot100}{400}=0{,}5\ \text{mol/L}$.

## Erros comuns
- Usar o volume em **mL** sem converter para litros.
- Confundir o volume do **solvente** com o volume da **solução**.
- Esquecer que na diluição o que se conserva é a quantidade de soluto.`,
    questoes: [
      q('facil', 'Em uma solução de água com açúcar, o soluto é:', ['a água', 'o açúcar', 'o recipiente', 'o ar'], 1, 'O soluto é o que se dissolve (o açúcar). O solvente é quem dissolve (a água).'),
      q('facil', 'Uma solução é uma mistura:', ['heterogênea', 'homogênea', 'sempre sólida', 'sem solvente'], 1, 'Solução é uma mistura homogênea, com uma única fase visível.'),
      q('facil', 'Dissolvem-se 10 g de um sal em água, formando 2 L de solução. Qual é a concentração comum?', ['20 g/L', '5 g/L', '12 g/L', '0,2 g/L'], 1, 'C = m / V = 10 / 2 = 5 g/L.'),
      q('medio', 'Qual é a molaridade de uma solução com 1 mol de NaCl dissolvido em 2 L de solução?', ['2 mol/L', '0,5 mol/L', '1 mol/L', '3 mol/L'], 1, 'M = n / V = 1 / 2 = 0,5 mol/L.'),
      q('medio', 'Quantos gramas de soluto existem em 500 mL de uma solução de concentração 4 g/L?', ['8 g', '2 g', '4 g', '0,5 g'], 1, '500 mL = 0,5 L. m = C · V = 4 · 0,5 = 2 g.'),
      q('medio', '100 mL de uma solução 2 mol/L são diluídos com água até o volume de 400 mL. Qual é a nova molaridade?', ['8 mol/L', '2 mol/L', '0,5 mol/L', '4 mol/L'], 2, 'Na diluição, M₁V₁ = M₂V₂: 2 · 100 = M₂ · 400, então M₂ = 0,5 mol/L.'),
      q('dificil', 'Qual é a massa de NaOH (massa molar 40 g/mol) necessária para preparar 500 mL de solução 0,2 mol/L?', ['8 g', '4 g', '40 g', '0,4 g'], 1, 'n = M · V = 0,2 · 0,5 = 0,1 mol. m = n · massa molar = 0,1 · 40 = 4 g.'),
      q('dificil', 'Uma solução aquosa de NaCl tem concentração 2 mol/L. Que volume dessa solução contém 0,5 mol de NaCl?', ['1 L', '250 mL', '4 L', '100 mL'], 1, 'V = n / M = 0,5 / 2 = 0,25 L = 250 mL.'),
    ],
  },
];
