import { q, type PacoteSeed } from './helpers';

export const FISICA: PacoteSeed[] = [
  {
    topic: 'cinematica', grade: '1ª série EM', title: 'Cinemática: movimento uniforme e variado', subtitle: 'Velocidade, aceleração e as equações do movimento',
    resumo: String.raw`## Velocidade média
$$v=\frac{\Delta s}{\Delta t}$$
Converter: $\text{km/h}\div3{,}6=\text{m/s}$. Assim, $72\ \text{km/h}=20\ \text{m/s}$.

## Movimento uniforme (MU)
A velocidade é **constante** e a aceleração é nula.
$$s=s_0+v\,t$$

## Movimento uniformemente variado (MUV)
A **aceleração é constante**.
$$v=v_0+a\,t$$
$$s=s_0+v_0\,t+\frac{a\,t^2}{2}$$
$$v^2=v_0^2+2\,a\,\Delta s\quad\text{(equação de Torricelli)}$$

## Exemplos
- Partindo do repouso com $a=2\ \text{m/s}^2$, após 5 s: $v=10\ \text{m/s}$ e $\Delta s=\frac{2\cdot5^2}{2}=25\ \text{m}$.
- Freando de 20 m/s com $a=-5\ \text{m/s}^2$ até parar: $0=20^2+2(-5)\Delta s\Rightarrow\Delta s=40\ \text{m}$.

## Encontro de móveis
Iguale as posições ($s_A=s_B$). Se andam no mesmo sentido, use a **velocidade relativa** (a diferença).

## Erros comuns
- Misturar km/h com m/s na mesma conta.
- Esquecer o sinal da aceleração ao frear.
- Usar a fórmula do MUV em movimento de velocidade constante.`,
    questoes: [
      q('facil', 'Quanto vale 72 km/h em metros por segundo?', ['20 m/s', '72 m/s', '259 m/s', '2 m/s'], 0, 'Para converter km/h em m/s, divide-se por 3,6: 72 ÷ 3,6 = 20 m/s.'),
      q('facil', 'Um carro percorre 150 km em 2 h. Qual é sua velocidade média?', ['50 km/h', '75 km/h', '150 km/h', '300 km/h'], 1, 'v = Δs/Δt = 150 / 2 = 75 km/h.'),
      q('facil', 'No movimento uniforme, a velocidade é:', ['crescente', 'constante', 'sempre nula', 'decrescente'], 1, 'No movimento uniforme a velocidade não varia, e por isso a aceleração é zero.'),
      q('medio', 'Um móvel obedece à função s = 10 + 5t (SI). Qual é sua posição em t = 4 s?', ['20 m', '30 m', '50 m', '14 m'], 1, 's = 10 + 5·4 = 30 m.'),
      q('medio', 'Um carro parte do repouso com aceleração de 2 m/s². Qual é sua velocidade após 5 s?', ['5 m/s', '7 m/s', '10 m/s', '25 m/s'], 2, 'v = v₀ + a·t = 0 + 2·5 = 10 m/s.'),
      q('medio', 'Um carro parte do repouso com aceleração de 2 m/s². Que distância percorre em 5 s?', ['10 m', '25 m', '50 m', '5 m'], 1, 'Δs = ½ · a · t² = ½ · 2 · 25 = 25 m.'),
      q('dificil', 'Um carro a 20 m/s freia com aceleração constante de −5 m/s² até parar. Que distância percorre na frenagem?', ['4 m', '20 m', '40 m', '80 m'], 2, 'Por Torricelli: 0 = 20² + 2·(−5)·Δs, logo 10·Δs = 400 e Δs = 40 m.'),
      q('dificil', 'O carro A está 100 m atrás do carro B. Os dois seguem no mesmo sentido, A a 30 m/s e B a 20 m/s (ambos constantes). Em quanto tempo A alcança B?', ['5 s', '10 s', '20 s', '100 s'], 1, 'A velocidade relativa é 30 − 20 = 10 m/s. Para recuperar 100 m: t = 100 / 10 = 10 s.'),
    ],
  },
  {
    topic: 'leis-de-newton', grade: '1ª série EM', title: 'Leis de Newton', subtitle: 'Inércia, força resultante e ação e reação',
    resumo: String.raw`## 1ª lei: inércia
Um corpo em repouso tende a ficar em repouso, e um corpo em movimento retilíneo uniforme tende a continuar assim, **a menos que uma força resultante atue** sobre ele. É por isso que o passageiro é "jogado para frente" quando o ônibus freia.

## 2ª lei: princípio fundamental
$$F_R=m\cdot a$$
A força resultante (em newtons, N) é a massa (kg) vezes a aceleração (m/s²). Uma força de 20 N sobre 4 kg causa $a=5\ \text{m/s}^2$.

## 3ª lei: ação e reação
Toda força tem uma **reação** de mesma intensidade e direção, **sentido oposto**, aplicada em **outro corpo**. Por isso elas não se anulam.

## Peso
$$P=m\cdot g$$
Com $g\approx10\ \text{m/s}^2$, um corpo de 10 kg pesa 100 N. **Massa** (kg) não é **peso** (N).

## Força resultante
Some as forças vetorialmente. Forças em sentidos opostos: subtraia. 10 N e 4 N opostas: $F_R=6\ \text{N}$.

## Elevador
A força normal na pessoa é $N=m(g+a)$ quando o elevador **acelera para cima** e $N=m(g-a)$ quando acelera para baixo.

## Erros comuns
- Confundir massa com peso.
- Achar que ação e reação se anulam (elas atuam em corpos diferentes).`,
    questoes: [
      q('facil', 'Um passageiro é projetado para frente quando o ônibus freia bruscamente. Esse fato é explicado pela lei:', ['da inércia (1ª lei de Newton)', 'da ação e reação', 'da gravitação universal', 'de Ohm'], 0, 'O corpo tende a manter seu estado de movimento. O ônibus para, mas o passageiro continua em movimento.'),
      q('facil', 'Qual é a força resultante necessária para dar aceleração de 3 m/s² a um corpo de 5 kg?', ['2 N', '8 N', '15 N', '1,7 N'], 2, 'F = m · a = 5 · 3 = 15 N.'),
      q('facil', 'As forças de ação e reação:', ['atuam no mesmo corpo e se anulam', 'atuam em corpos diferentes', 'têm intensidades diferentes', 'têm o mesmo sentido'], 1, 'Elas têm o mesmo módulo e sentidos opostos, mas atuam em corpos diferentes. Por isso não se anulam.'),
      q('medio', 'Qual é o peso de um corpo de 10 kg, considerando g = 10 m/s²?', ['10 N', '1 N', '100 N', '10 kg'], 2, 'P = m · g = 10 · 10 = 100 N. Peso é uma força, medida em newtons.'),
      q('medio', 'Uma força resultante de 20 N atua sobre um corpo de 4 kg. Qual é a aceleração?', ['5 m/s²', '16 m/s²', '80 m/s²', '0,2 m/s²'], 0, 'a = F / m = 20 / 4 = 5 m/s².'),
      q('medio', 'Um carro em movimento retilíneo uniforme em uma estrada reta e plana tem força resultante:', ['para frente, proporcional à velocidade', 'nula', 'para trás', 'igual ao seu peso'], 1, 'Com velocidade constante, a aceleração é nula e, pela 2ª lei, a força resultante também é nula.'),
      q('dificil', 'Duas forças opostas de 10 N e 4 N atuam sobre um corpo de 3 kg. Qual é a aceleração?', ['2 m/s²', '3 m/s²', '4,7 m/s²', '14 m/s²'], 0, 'A resultante é 10 − 4 = 6 N. Então a = 6 / 3 = 2 m/s².'),
      q('dificil', 'Uma pessoa de 60 kg está em um elevador que acelera para cima a 2 m/s² (g = 10 m/s²). Qual é a força normal que o piso exerce sobre ela?', ['480 N', '600 N', '720 N', '120 N'], 2, 'N − P = m·a, logo N = m(g + a) = 60 · 12 = 720 N. Se o elevador acelerasse para baixo seria 480 N.'),
    ],
  },
  {
    topic: 'lei-de-ohm', grade: '3ª série EM', title: 'Corrente elétrica, Lei de Ohm e circuitos', subtitle: 'Tensão, corrente, resistência, potência e consumo de energia',
    resumo: String.raw`## Grandezas
- **Corrente elétrica ($i$):** fluxo de cargas, em **ampère (A)**.
- **Tensão ($U$):** "empurrão" que move as cargas, em **volt (V)**.
- **Resistência ($R$):** oposição à passagem da corrente, em **ohm (Ω)**.

## Primeira Lei de Ohm
$$U=R\cdot i$$
Com $i=2\ \text{A}$ e $R=5\ \Omega$: $U=10\ \text{V}$. Com $U=12\ \text{V}$ e $R=4\ \Omega$: $i=3\ \text{A}$.

## Associação de resistores
- **Em série:** $R_{eq}=R_1+R_2$ (3 Ω e 6 Ω dão 9 Ω). A corrente é a mesma.
- **Em paralelo:** $\frac{1}{R_{eq}}=\frac{1}{R_1}+\frac{1}{R_2}$. Dois resistores iguais de 6 Ω dão 3 Ω. A tensão é a mesma.

## Potência elétrica
$$P=U\cdot i$$
Um chuveiro de 4 400 W em 220 V: $i=\frac{4400}{220}=20\ \text{A}$.

## Energia consumida
$$E=P\cdot\Delta t$$
Uma lâmpada de 100 W ligada por 5 h consome $0{,}1\ \text{kW}\cdot5\ \text{h}=0{,}5\ \text{kWh}$. A conta de luz cobra o **kWh**.

## Erros comuns
- Somar resistências em paralelo como se fossem em série.
- Misturar W com kWh e minutos com horas.`,
    questoes: [
      q('facil', 'Uma corrente de 2 A passa por um resistor de 5 Ω. Qual é a tensão sobre ele?', ['2,5 V', '7 V', '10 V', '0,4 V'], 2, 'Pela Lei de Ohm, U = R · i = 5 · 2 = 10 V.'),
      q('facil', 'Qual é a unidade de resistência elétrica no SI?', ['Ampère', 'Volt', 'Watt', 'Ohm'], 3, 'A resistência é medida em ohm (Ω). Ampère mede corrente, volt mede tensão e watt mede potência.'),
      q('facil', 'Qual é a unidade de intensidade de corrente elétrica no SI?', ['Ampère', 'Volt', 'Ohm', 'Joule'], 0, 'A corrente é medida em ampère (A).'),
      q('medio', 'Um resistor de 4 Ω está ligado a uma tensão de 12 V. Qual é a corrente?', ['3 A', '48 A', '8 A', '0,33 A'], 0, 'i = U / R = 12 / 4 = 3 A.'),
      q('medio', 'Dois resistores de 3 Ω e 6 Ω são ligados em série. Qual é a resistência equivalente?', ['2 Ω', '4,5 Ω', '9 Ω', '18 Ω'], 2, 'Em série, as resistências somam: 3 + 6 = 9 Ω.'),
      q('medio', 'Dois resistores de 6 Ω cada são ligados em paralelo. Qual é a resistência equivalente?', ['3 Ω', '6 Ω', '12 Ω', '36 Ω'], 0, 'Em paralelo, para resistores iguais, divide-se o valor pelo número deles: 6 / 2 = 3 Ω.'),
      q('dificil', 'Um chuveiro de 4 400 W é ligado em 220 V. Qual é a corrente que passa por ele?', ['10 A', '20 A', '200 A', '968 A'], 1, 'Da potência elétrica P = U · i, tem-se i = P / U = 4 400 / 220 = 20 A.'),
      q('dificil', 'Uma lâmpada de 100 W fica acesa por 5 horas. Qual é a energia consumida?', ['0,5 kWh', '5 kWh', '500 kWh', '0,05 kWh'], 0, 'E = P · Δt = 0,1 kW · 5 h = 0,5 kWh. Atenção à conversão de W para kW.'),
    ],
  },
];
