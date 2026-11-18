import { brl, discQ, fmt, numQ, textQ, type GenDisc, type GenObj, type SerieGen } from './gerador';

/** Física, Química, Ciências (8º e 9º), Educação Financeira e Pensamento Computacional, com contas calculadas. */

const u = (unit: string) => (n: number) => `${fmt(n)} ${unit}`;

// ================================================================= FÍSICA
const cinematica: GenObj[] = [
  (r, w) => {
    const d = r.int(6, 60) * 10,
      t = r.pick([2, 4, 5]);
    return numQ(
      'facil',
      `Um ônibus percorre ${d} km em ${t} h. Qual é a velocidade média?`,
      d / t,
      [d * t, d / t / 3.6, d - t],
      `vm = Δs ÷ Δt = ${d} ÷ ${t} = ${fmt(d / t)} km/h.`,
      w,
      u('km/h'),
    );
  },
  (r, w) => {
    const v = r.pick([36, 54, 72, 90, 108]);
    return numQ(
      'facil',
      `Quanto é ${v} km/h em m/s?`,
      v / 3.6,
      [v * 3.6, v / 60, v / 10],
      `Para passar de km/h para m/s, divida por 3,6: ${v} ÷ 3,6 = ${fmt(v / 3.6)} m/s.`,
      w,
      u('m/s'),
    );
  },
  (r, w) => {
    const v0 = r.int(0, 10),
      a = r.int(1, 5),
      t = r.int(2, 10);
    return numQ(
      'medio',
      `Um carro parte com ${v0} m/s e acelera ${a} m/s² por ${t} s. Qual é a velocidade final?`,
      v0 + a * t,
      [a * t, v0 * a * t, v0 + a],
      `v = v₀ + a·t = ${v0} + ${a}·${t} = ${v0 + a * t} m/s.`,
      w,
      u('m/s'),
    );
  },
  (r, w) => {
    const a = r.pick([2, 4, 6]),
      t = r.int(2, 8);
    return numQ(
      'medio',
      `Partindo do repouso com aceleração de ${a} m/s², quantos metros um móvel percorre em ${t} s?`,
      (a * t * t) / 2,
      [a * t * t, a * t, (a * t) / 2],
      `s = a·t² ÷ 2 = ${a}·${t * t} ÷ 2 = ${(a * t * t) / 2} m.`,
      w,
      u('m'),
    );
  },
  (r, w) => {
    const v = r.int(10, 30),
      d = r.int(2, 12) * 100;
    return numQ(
      'facil',
      `Um ciclista a ${v} m/s constantes leva quanto tempo para percorrer ${d} m?`,
      d / v,
      [d * v, v / d, d / v / 60],
      `t = d ÷ v = ${d} ÷ ${v} = ${fmt(d / v)} s.`,
      w,
      u('s'),
    );
  },
];
const newton: GenObj[] = [
  (r, w) => {
    const m = r.int(2, 50),
      a = r.int(1, 6);
    return numQ(
      'facil',
      `Qual força resultante faz um corpo de ${m} kg acelerar ${a} m/s²?`,
      m * a,
      [m / a, m + a, m * a * 10],
      `2ª Lei de Newton: F = m·a = ${m}·${a} = ${m * a} N.`,
      w,
      u('N'),
    );
  },
  (r, w) => {
    const m = r.int(3, 90);
    return numQ(
      'facil',
      `Qual é o peso de um objeto de ${m} kg na Terra (g = 10 m/s²)?`,
      m * 10,
      [m, m / 10, m * 9.8 * 10],
      `P = m·g = ${m}·10 = ${m * 10} N. Massa (kg) e peso (N) são grandezas diferentes.`,
      w,
      u('N'),
    );
  },
  (r, w) => {
    const F = r.int(20, 100),
      fat = r.int(5, 19),
      m = r.pick([2, 5]);
    return numQ(
      'medio',
      `Uma caixa de ${m} kg é puxada com ${F} N e o atrito vale ${fat} N. Qual é a aceleração?`,
      (F - fat) / m,
      [F / m, (F + fat) / m, F - fat],
      `Fr = ${F} − ${fat} = ${F - fat} N. a = Fr ÷ m = ${F - fat} ÷ ${m} = ${fmt((F - fat) / m)} m/s².`,
      w,
      u('m/s²'),
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Num ônibus que freia de repente, os passageiros são "jogados" para a frente. Isso é explicado pela:',
      '1ª Lei de Newton (inércia)',
      [
        '2ª Lei de Newton (F = m·a)',
        '3ª Lei de Newton (ação e reação)',
        'Lei da Gravitação Universal',
        'Lei de Ohm',
      ],
      'Pela inércia, o corpo tende a manter o movimento que tinha quando o ônibus freia.',
      w,
    ),
  (_r, w) =>
    textQ(
      'medio',
      'Ao remar, a pessoa empurra a água para trás e o barco vai para a frente. Isso ilustra a:',
      '3ª Lei de Newton (ação e reação)',
      [
        '1ª Lei de Newton (inércia)',
        '2ª Lei de Newton (F = m·a)',
        'Lei de Hooke',
        'conservação da massa',
      ],
      'O remo empurra a água (ação) e a água empurra o remo e o barco no sentido oposto (reação).',
      w,
    ),
];
const energia: GenObj[] = [
  (r, w) => {
    const m = r.int(1, 10) * 2,
      v = r.int(2, 10);
    return numQ(
      'medio',
      `Qual é a energia cinética de um corpo de ${m} kg a ${v} m/s?`,
      (m * v * v) / 2,
      [m * v * v, m * v, (m * v) / 2],
      `Ec = m·v² ÷ 2 = ${m}·${v * v} ÷ 2 = ${(m * v * v) / 2} J.`,
      w,
      u('J'),
    );
  },
  (r, w) => {
    const m = r.int(1, 20),
      h = r.int(2, 30);
    return numQ(
      'facil',
      `Qual é a energia potencial gravitacional de ${m} kg a ${h} m de altura (g = 10 m/s²)?`,
      m * 10 * h,
      [m * h, (m * 10 * h) / 2, m * 10 + h],
      `Ep = m·g·h = ${m}·10·${h} = ${m * 10 * h} J.`,
      w,
      u('J'),
    );
  },
  (r, w) => {
    const F = r.int(10, 80),
      d = r.int(2, 20);
    return numQ(
      'facil',
      `Uma força de ${F} N desloca um objeto ${d} m na mesma direção. Qual é o trabalho?`,
      F * d,
      [F / d, F + d, (F * d) / 2],
      `τ = F·d = ${F}·${d} = ${F * d} J.`,
      w,
      u('J'),
    );
  },
  (r, w) => {
    const E = r.int(6, 60) * 100,
      t = r.pick([10, 20, 30, 60]);
    return numQ(
      'medio',
      `Um motor realiza ${E} J de trabalho em ${t} s. Qual é a potência?`,
      E / t,
      [E * t, E / t / 60, t / E],
      `P = τ ÷ Δt = ${E} ÷ ${t} = ${fmt(E / t)} W.`,
      w,
      u('W'),
    );
  },
  (r, w) => {
    const h = r.pick([5, 20, 45, 80]);
    return numQ(
      'dificil',
      `Uma pedra cai do repouso de ${h} m de altura. Desprezando o ar (g = 10 m/s²), com que velocidade chega ao chão?`,
      Math.sqrt(20 * h),
      [20 * h, 10 * h, Math.sqrt(10 * h)],
      `Conservação da energia: m·g·h = m·v²/2 → v = √(2·g·h) = √(${20 * h}) = ${Math.sqrt(20 * h)} m/s.`,
      w,
      u('m/s'),
    );
  },
];
const termologia: GenObj[] = [
  (r, w) => {
    const m = r.int(1, 10) * 100,
      dt = r.int(5, 60);
    return numQ(
      'medio',
      `Quanto calor é preciso para aquecer ${m} g de água em ${dt} °C? (c = 1 cal/g·°C)`,
      m * dt,
      [m + dt, m / dt, m * dt * 4.2],
      `Q = m·c·ΔT = ${m}·1·${dt} = ${(m * dt).toLocaleString('pt-BR')} cal.`,
      w,
      (n) => `${n.toLocaleString('pt-BR')} cal`,
    );
  },
  (r, w) => {
    const c = r.pick([0, 10, 20, 25, 30, 35, 40, 100]);
    return numQ(
      'facil',
      `Quanto é ${c} °C na escala Fahrenheit?`,
      (c * 9) / 5 + 32,
      [c + 32, (c * 5) / 9 + 32, c * 1.8],
      `F = 1,8·C + 32 = 1,8·${c} + 32 = ${fmt((c * 9) / 5 + 32)} °F.`,
      w,
      u('°F'),
    );
  },
  (r, w) => {
    const c = r.int(-20, 100);
    return numQ(
      'facil',
      `Quanto é ${c} °C em kelvin?`,
      c + 273,
      [c - 273, c, c + 373],
      `K = C + 273 = ${c} + 273 = ${c + 273} K.`,
      w,
      u('K'),
    );
  },
  (_r, w) =>
    textQ(
      'medio',
      'No inverno, a maçaneta de metal parece mais fria que a porta de madeira, embora estejam na mesma temperatura. Isso acontece porque o metal:',
      'conduz calor melhor e retira calor da mão mais rápido',
      [
        'está realmente mais frio que a madeira',
        'emite frio',
        'é isolante térmico',
        'tem calor específico zero',
      ],
      'Ambos estão em equilíbrio térmico com o ambiente; o metal é bom condutor e "rouba" calor da pele mais depressa.',
      w,
    ),
  (_r, w) =>
    textQ(
      'facil',
      'O calor do Sol chega à Terra principalmente por:',
      'radiação',
      ['condução', 'convecção', 'dilatação', 'atrito'],
      'Entre o Sol e a Terra há vácuo; só a radiação (ondas eletromagnéticas) atravessa o vácuo.',
      w,
    ),
];
const ondas: GenObj[] = [
  (r, w) => {
    const lambda = r.pick([0.5, 1, 2, 4]),
      f = r.pick([10, 50, 100, 170, 340]);
    return numQ(
      'facil',
      `Uma onda tem comprimento ${fmt(lambda)} m e frequência ${f} Hz. Qual é a velocidade?`,
      lambda * f,
      [f / lambda, lambda / f, lambda + f],
      `v = λ·f = ${fmt(lambda)}·${f} = ${fmt(lambda * f)} m/s.`,
      w,
      u('m/s'),
    );
  },
  (r, w) => {
    const f = r.pick([2, 4, 5, 10, 20]);
    return numQ(
      'facil',
      `Qual é o período de uma onda de ${f} Hz?`,
      1 / f,
      [f, f / 2, 2 / f],
      `T = 1 ÷ f = 1 ÷ ${f} = ${fmt(1 / f, 3)} s.`,
      w,
      (n) => `${fmt(n, 3)} s`,
    );
  },
  (r, w) => {
    const t = r.int(2, 6);
    return numQ(
      'medio',
      `Você vê um relâmpago e ouve o trovão ${t} s depois. Sendo o som 340 m/s, a que distância caiu o raio?`,
      340 * t,
      [340 / t, 340 * t * 2, 300000 * t],
      `A luz chega quase na hora; o som leva ${t} s. d = 340·${t} = ${340 * t} m.`,
      w,
      u('m'),
    );
  },
  (_r, w) =>
    textQ(
      'medio',
      'O som NÃO se propaga no vácuo porque:',
      'é uma onda mecânica e precisa de um meio material',
      [
        'é uma onda eletromagnética',
        'é rápido demais',
        'tem frequência baixa',
        'só se propaga na água',
      ],
      'Ondas mecânicas (como o som) dependem de partículas do meio para se propagar.',
      w,
    ),
  (r, w) => {
    const d = r.int(1, 5);
    return numQ(
      'facil',
      `Uma pessoa está a ${d} m de um espelho plano. Qual é a distância entre ela e a imagem dela?`,
      2 * d,
      [d, d / 2, d + 1],
      `No espelho plano a imagem fica à mesma distância atrás do espelho: ${d} + ${d} = ${2 * d} m.`,
      w,
      u('m'),
    );
  },
];
const circuitos: GenObj[] = [
  (r, w) => {
    const R = r.int(2, 50),
      i = r.int(1, 5);
    return numQ(
      'facil',
      `Um resistor de ${R} Ω é percorrido por ${i} A. Qual é a tensão nele?`,
      R * i,
      [R / i, R + i, i / R],
      `Lei de Ohm: U = R·i = ${R}·${i} = ${R * i} V.`,
      w,
      u('V'),
    );
  },
  (r, w) => {
    const U = r.pick([110, 127, 220]),
      i = r.int(2, 10);
    return numQ(
      'facil',
      `Um aparelho ligado em ${U} V puxa ${i} A. Qual é a potência?`,
      U * i,
      [U / i, U + i, U * i * 2],
      `P = U·i = ${U}·${i} = ${U * i} W.`,
      w,
      u('W'),
    );
  },
  (r, w) => {
    const r1 = r.int(2, 20),
      r2 = r.int(2, 20),
      r3 = r.int(2, 20);
    return numQ(
      'facil',
      `Três resistores de ${r1} Ω, ${r2} Ω e ${r3} Ω estão em SÉRIE. Qual é a resistência equivalente?`,
      r1 + r2 + r3,
      [(r1 * r2 * r3) / (r1 * r2 + r2 * r3 + r1 * r3), r1 * r2 * r3, (r1 + r2 + r3) / 3],
      `Em série, somam-se: ${r1} + ${r2} + ${r3} = ${r1 + r2 + r3} Ω.`,
      w,
      u('Ω'),
    );
  },
  (r, w) => {
    const R = r.pick([4, 6, 10, 12, 20]);
    return numQ(
      'medio',
      `Dois resistores iguais de ${R} Ω estão em PARALELO. Qual é a resistência equivalente?`,
      R / 2,
      [2 * R, R, R / 4],
      `Em paralelo, dois iguais: Req = R ÷ 2 = ${R / 2} Ω.`,
      w,
      u('Ω'),
    );
  },
  (r, w) => {
    const r1 = r.pick([3, 6, 12]),
      r2 = r.pick([4, 6, 12]);
    const eq = (r1 * r2) / (r1 + r2);
    return numQ(
      'dificil',
      `Resistores de ${r1} Ω e ${r2} Ω em paralelo têm resistência equivalente de:`,
      eq,
      [r1 + r2, (r1 + r2) / 2, r1 * r2],
      `Req = (R₁·R₂) ÷ (R₁ + R₂) = ${r1 * r2} ÷ ${r1 + r2} = ${fmt(eq)} Ω.`,
      w,
      u('Ω'),
    );
  },
];
const consumo: GenObj[] = [
  (r, w) => {
    const P = r.pick([1000, 2000, 4000, 5500]),
      h = r.pick([0.25, 0.5, 1]),
      dias = 30;
    const kwh = (P / 1000) * h * dias;
    return numQ(
      'medio',
      `Um chuveiro de ${P.toLocaleString('pt-BR')} W é usado ${fmt(h)} h por dia. Quanto consome em 30 dias?`,
      kwh,
      [P * h * dias, (P / 1000) * h, kwh * 10],
      `E = P·t = ${fmt(P / 1000)} kW × ${fmt(h * dias)} h = ${fmt(kwh)} kWh.`,
      w,
      u('kWh'),
    );
  },
  (r, w) => {
    const kwh = r.int(80, 400),
      tarifa = r.pick([0.7, 0.8, 0.9, 1]);
    return numQ(
      'facil',
      `Uma casa gastou ${kwh} kWh no mês e a tarifa é ${brl(tarifa)} por kWh. Quanto custou a energia (sem impostos)?`,
      kwh * tarifa,
      [kwh / tarifa, kwh + tarifa, kwh * tarifa * 10],
      `${kwh} × ${brl(tarifa)} = ${brl(kwh * tarifa)}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const P = r.pick([10, 15, 60, 100]),
      h = r.int(4, 10);
    return numQ(
      'medio',
      `Uma lâmpada de ${P} W fica acesa ${h} h por dia durante 30 dias. Qual é o consumo?`,
      (P * h * 30) / 1000,
      [P * h * 30, (P * h) / 1000, (P * 30) / 1000],
      `E = ${P} W × ${h * 30} h = ${P * h * 30} Wh = ${fmt((P * h * 30) / 1000)} kWh.`,
      w,
      u('kWh'),
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Trocar uma lâmpada incandescente de 60 W por uma LED de 9 W com luz parecida:',
      'reduz o consumo, porque a LED usa menos potência pelo mesmo tempo',
      [
        'aumenta o consumo',
        'não muda nada, porque a luz é igual',
        'só reduz se a tensão mudar',
        'reduz o consumo porque a LED fica acesa menos tempo',
      ],
      'Consumo = potência × tempo. Mesma luz e mesmo tempo, com 9 W em vez de 60 W: gasta bem menos.',
      w,
    ),
];
const discFis: GenDisc[] = [
  (r) => {
    const v0 = r.int(0, 5),
      a = r.int(2, 4),
      t = r.int(3, 8);
    return discQ(
      'medio',
      `Um carro parte de ${v0} m/s com aceleração constante de ${a} m/s². Calcule a velocidade após ${t} s e a distância percorrida nesse tempo, mostrando as fórmulas.`,
      `v = v₀ + a·t = ${v0} + ${a}·${t} = ${v0 + a * t} m/s. s = v₀·t + a·t²/2 = ${v0 * t} + ${(a * t * t) / 2} = ${v0 * t + (a * t * t) / 2} m.`,
      [
        'Usa v = v₀ + a·t',
        `Calcula ${v0 + a * t} m/s`,
        `Usa s = v₀t + at²/2 e chega a ${v0 * t + (a * t * t) / 2} m`,
      ],
    );
  },
  (r) => {
    const P = r.pick([4000, 5500]),
      min = r.pick([10, 15, 20]),
      tarifa = 0.8;
    const kwh = (P / 1000) * (min / 60) * 30;
    return discQ(
      'medio',
      `Numa casa, o chuveiro de ${P} W é usado ${min} min por dia. Calcule o consumo em 30 dias e o custo com tarifa de R$ 0,80/kWh. Sugira uma forma de economizar.`,
      `E = ${fmt(P / 1000)} kW × (${min}/60 h × 30) = ${fmt(kwh)} kWh. Custo ≈ ${brl(kwh * tarifa)}. Economia: banhos mais curtos ou posição "verão".`,
      [
        'Converte W em kW e minutos em horas',
        `Chega a ${fmt(kwh)} kWh`,
        'Calcula o custo e sugere economia coerente',
      ],
    );
  },
  (r) => {
    const h = r.pick([5, 20, 45]);
    return discQ(
      'dificil',
      `Uma bola cai do repouso de ${h} m. Usando conservação da energia (g = 10 m/s², sem resistência do ar), calcule a velocidade ao chegar ao chão e explique a transformação de energia.`,
      `Ep vira Ec: m·g·h = m·v²/2 → v = √(2·10·${h}) = ${Math.sqrt(20 * h)} m/s. A energia potencial gravitacional se transforma em energia cinética.`,
      [
        'Explica a transformação Ep → Ec',
        'Monta a igualdade m·g·h = m·v²/2',
        `Chega a ${Math.sqrt(20 * h)} m/s`,
      ],
    );
  },
  (r) => {
    const R1 = r.pick([10, 20]),
      R2 = r.pick([30, 40]),
      U = 12;
    return discQ(
      'medio',
      `Dois resistores de ${R1} Ω e ${R2} Ω são ligados em série numa bateria de ${U} V. Calcule a resistência equivalente, a corrente e a tensão em cada resistor.`,
      `Req = ${R1 + R2} Ω. i = ${U} ÷ ${R1 + R2} = ${fmt(U / (R1 + R2), 3)} A. U₁ = ${R1}·i = ${fmt((R1 * U) / (R1 + R2))} V; U₂ = ${fmt((R2 * U) / (R1 + R2))} V (somam ${U} V).`,
      [
        'Soma as resistências em série',
        'Calcula a corrente pela Lei de Ohm',
        'Calcula a tensão de cada resistor e confere a soma',
      ],
    );
  },
];

// ================================================================= QUÍMICA
const ATOMOS = [
  ['sódio', 'Na', 11, 23],
  ['cloro', 'Cl', 17, 35],
  ['oxigênio', 'O', 8, 16],
  ['carbono', 'C', 6, 12],
  ['ferro', 'Fe', 26, 56],
  ['cálcio', 'Ca', 20, 40],
  ['alumínio', 'Al', 13, 27],
  ['magnésio', 'Mg', 12, 24],
  ['enxofre', 'S', 16, 32],
  ['potássio', 'K', 19, 39],
] as const;
const atomistica: GenObj[] = [
  (r, w) => {
    const [nome, sim, Z, A] = r.pick(ATOMOS);
    return numQ(
      'facil',
      `O ${nome} (${sim}) tem número atômico ${Z} e número de massa ${A}. Quantos nêutrons tem?`,
      A - Z,
      [A + Z, Z, A],
      `N = A − Z = ${A} − ${Z} = ${A - Z}.`,
      w,
    );
  },
  (r, w) => {
    const [nome, sim, Z] = r.pick(ATOMOS);
    return numQ(
      'facil',
      `Quantos prótons tem um átomo de ${nome} (${sim}, Z = ${Z})?`,
      Z,
      [Z * 2, Z + 1, Z - 1],
      `O número atômico (Z) é o número de prótons: ${Z}.`,
      w,
    );
  },
  (r, w) => {
    const [nome, sim, Z] = r.pick(
      ATOMOS.filter((a) => ['Na', 'K', 'Ca', 'Mg', 'Al'].includes(a[1])),
    );
    const carga = { Na: 1, K: 1, Ca: 2, Mg: 2, Al: 3 }[sim as 'Na']!;
    return numQ(
      'medio',
      `O cátion ${sim}${carga > 1 ? carga : ''}+ (${nome}, Z = ${Z}) tem quantos elétrons?`,
      Z - carga,
      [Z + carga, Z, carga],
      `Cátion perde elétrons: ${Z} − ${carga} = ${Z - carga} elétrons.`,
      w,
    );
  },
  (r, w) => {
    const [nome, sim, Z] = r.pick(ATOMOS.filter((a) => ['Cl', 'O', 'S'].includes(a[1])));
    const carga = { Cl: 1, O: 2, S: 2 }[sim as 'Cl']!;
    return numQ(
      'medio',
      `O ânion ${sim}${carga > 1 ? carga : ''}− (${nome}, Z = ${Z}) tem quantos elétrons?`,
      Z + carga,
      [Z - carga, Z, carga],
      `Ânion ganha elétrons: ${Z} + ${carga} = ${Z + carga} elétrons.`,
      w,
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Átomos de um mesmo elemento com números de massa diferentes (como o carbono-12 e o carbono-14) são chamados de:',
      'isótopos',
      ['isóbaros', 'isótonos', 'íons', 'alótropos'],
      'Isótopos têm o mesmo número de prótons (mesmo elemento) e números de nêutrons diferentes.',
      w,
    ),
];
const MOLEC = [
  ['água (H₂O)', 18],
  ['gás carbônico (CO₂)', 44],
  ['cloreto de sódio (NaCl)', 58.5],
  ['glicose (C₆H₁₂O₆)', 180],
  ['metano (CH₄)', 16],
  ['amônia (NH₃)', 17],
  ['ácido sulfúrico (H₂SO₄)', 98],
  ['hidróxido de sódio (NaOH)', 40],
] as const;
const mol: GenObj[] = [
  (r, w) => {
    const [nome, M] = r.pick(MOLEC);
    const n = r.pick([0.5, 1, 2, 3, 4]);
    return numQ(
      'medio',
      `Quantos gramas há em ${fmt(n)} mol de ${nome}? (M = ${fmt(M)} g/mol)`,
      n * M,
      [M / n, n + M, M],
      `m = n·M = ${fmt(n)}·${fmt(M)} = ${fmt(n * M)} g.`,
      w,
      u('g'),
    );
  },
  (r, w) => {
    const [nome, M] = r.pick(MOLEC);
    const n = r.pick([0.5, 1, 2, 5]);
    return numQ(
      'medio',
      `Quantos mols há em ${fmt(n * M)} g de ${nome}? (M = ${fmt(M)} g/mol)`,
      n,
      [n * M, n * 2, (M / (n * M)) * 10],
      `n = m ÷ M = ${fmt(n * M)} ÷ ${fmt(M)} = ${fmt(n)} mol.`,
      w,
      u('mol'),
    );
  },
  (r, w) => {
    const n = r.pick([2, 3, 0.5, 5]);
    return textQ(
      'medio',
      `Quantas moléculas há em ${fmt(n)} mol de água? (constante de Avogadro ≈ 6 × 10²³)`,
      `${fmt(n * 6)} × 10²³`,
      [`${fmt(n)} × 10²³`, `${fmt(n * 6)} × 10²⁴`, `6 × 10²³`, `${fmt(n + 6)} × 10²³`],
      `N = n × 6 × 10²³ = ${fmt(n * 6)} × 10²³ moléculas.`,
      w,
    );
  },
  (r, w) => {
    const [nome, c, h, ox] = r.pick([
      ['metanal (CH₂O)', 1, 2, 1],
      ['etanol (C₂H₆O)', 2, 6, 1],
      ['metanol (CH₄O)', 1, 4, 1],
      ['ácido acético (C₂H₄O₂)', 2, 4, 2],
      ['acetona (C₃H₆O)', 3, 6, 1],
    ] as const);
    const M = 12 * c + h + 16 * ox;
    return numQ(
      'facil',
      `Com H = 1, C = 12 e O = 16, qual é a massa molar do ${nome}?`,
      M,
      [12 + h + 16 * ox, 12 * c + 16 * ox, M * 2],
      `M = ${c}·12 + ${h}·1 + ${ox}·16 = ${M} g/mol.`,
      w,
      u('g/mol'),
    );
  },
];
const solucoes: GenObj[] = [
  (r, w) => {
    const m = r.int(2, 40) * 5,
      V = r.pick([0.25, 0.5, 1, 2]);
    return numQ(
      'facil',
      `Dissolvem-se ${m} g de açúcar em água até ${fmt(V)} L de solução. Qual é a concentração em g/L?`,
      m / V,
      [m * V, V / m, m],
      `C = m ÷ V = ${m} ÷ ${fmt(V)} = ${fmt(m / V)} g/L.`,
      w,
      u('g/L'),
    );
  },
  (r, w) => {
    const n = r.pick([0.1, 0.2, 0.5, 1, 2]),
      V = r.pick([0.5, 1, 2]);
    return numQ(
      'medio',
      `Uma solução tem ${fmt(n)} mol de soluto em ${fmt(V)} L. Qual é a concentração em mol/L?`,
      n / V,
      [n * V, V / n, n],
      `M = n ÷ V = ${fmt(n)} ÷ ${fmt(V)} = ${fmt(n / V)} mol/L.`,
      w,
      u('mol/L'),
    );
  },
  (r, w) => {
    const C1 = r.pick([2, 4, 6, 10]),
      V1 = r.pick([100, 200, 250]),
      V2 = V1 * r.pick([2, 4, 5]);
    return numQ(
      'medio',
      `Diluem-se ${V1} mL de uma solução ${C1} mol/L até ${V2} mL. Qual é a nova concentração?`,
      (C1 * V1) / V2,
      [(C1 * V2) / V1, C1, C1 / 2],
      `C₁·V₁ = C₂·V₂ → ${C1}·${V1} = C₂·${V2} → C₂ = ${fmt((C1 * V1) / V2)} mol/L.`,
      w,
      u('mol/L'),
    );
  },
  (r, w) => {
    const C = r.pick([0.9, 5, 10]),
      V = r.pick([100, 500, 1000]);
    return numQ(
      'facil',
      `O soro fisiológico tem ${fmt(C)} g de sal a cada 100 mL. Quanto sal há em ${V} mL?`,
      (C * V) / 100,
      [C * V, C, (C * 100) / V],
      `${fmt(C)} g → 100 mL; ${V} mL → ${fmt((C * V) / 100)} g.`,
      w,
      u('g'),
    );
  },
];
const ph: GenObj[] = [
  (r, w) => {
    const n = r.int(1, 13);
    return numQ(
      'facil',
      `Uma solução tem [H⁺] = 10⁻${n} mol/L (a 25 °C). Qual é o pH?`,
      n,
      [-n, 14 - n, n + 1],
      `pH = −log[H⁺] = −log 10⁻${n} = ${n}.`,
      w,
    );
  },
  (r, w) => {
    const p = r.int(1, 13);
    const cls = p < 7 ? 'ácida' : p > 7 ? 'básica' : 'neutra';
    return textQ(
      'facil',
      `A 25 °C, uma solução de pH ${p} é:`,
      cls,
      ['ácida', 'básica', 'neutra', 'sempre um sal'],
      `pH < 7 é ácido, 7 é neutro e > 7 é básico.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(2, 6);
    return numQ(
      'medio',
      `A 25 °C, uma solução tem pOH = ${n}. Qual é o pH?`,
      14 - n,
      [n, n - 14, 7 + n],
      `pH + pOH = 14 → pH = 14 − ${n} = ${14 - n}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(2, 4),
      b = a + r.int(1, 3);
    return numQ(
      'dificil',
      `Quantas vezes a solução de pH ${a} é mais ácida que a de pH ${b}?`,
      10 ** (b - a),
      [b - a, 10 * (b - a), 2 ** (b - a)],
      `Cada unidade de pH muda [H⁺] 10 vezes: 10^${b - a} = ${(10 ** (b - a)).toLocaleString('pt-BR')} vezes.`,
      w,
      (n) => n.toLocaleString('pt-BR'),
    );
  },
];
const estequiometria: GenObj[] = [
  (r, w) => {
    const mol = r.pick([1, 2, 3, 4]);
    return numQ(
      'medio',
      `Na reação 2 H₂ + O₂ → 2 H₂O, quantos gramas de água se formam com ${mol * 2} mol de H₂? (H₂O = 18 g/mol)`,
      mol * 2 * 18,
      [mol * 18, mol * 2 * 9, mol * 4 * 18],
      `2 mol H₂ → 2 mol H₂O (proporção 1:1). ${mol * 2} mol de H₂O × 18 = ${mol * 2 * 18} g.`,
      w,
      u('g'),
    );
  },
  (r, w) => {
    const m = r.pick([16, 32, 48, 80]);
    return numQ(
      'medio',
      `Na combustão CH₄ + 2 O₂ → CO₂ + 2 H₂O, quantos gramas de CO₂ saem de ${m} g de metano? (CH₄ = 16; CO₂ = 44 g/mol)`,
      (m / 16) * 44,
      [m, (m / 16) * 22, (m / 16) * 88],
      `${m} g ÷ 16 = ${m / 16} mol de CH₄ → ${m / 16} mol de CO₂ × 44 = ${(m / 16) * 44} g.`,
      w,
      u('g'),
    );
  },
  (r, w) => {
    const n = r.pick([2, 4, 6]);
    return numQ(
      'facil',
      `Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de NH₃ se formam com ${n} mol de N₂ (H₂ em excesso)?`,
      2 * n,
      [n, 3 * n, n / 2],
      `1 N₂ : 2 NH₃ → ${n} mol de N₂ formam ${2 * n} mol de NH₃.`,
      w,
      u('mol'),
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Segundo a Lei de Lavoisier, numa reação em sistema fechado:',
      'a massa total dos reagentes é igual à dos produtos',
      [
        'a massa dos produtos é sempre maior',
        'a massa se perde como calor',
        'o número de moléculas nunca muda',
        'os átomos são destruídos e recriados',
      ],
      '"Na natureza nada se cria, nada se perde, tudo se transforma": a massa se conserva.',
      w,
    ),
];
const gases: GenObj[] = [
  (r, w) => {
    const P1 = r.pick([1, 2, 3]),
      V1 = r.pick([6, 12, 24]),
      P2 = P1 * r.pick([2, 3]);
    return numQ(
      'medio',
      `Um gás a ${P1} atm ocupa ${V1} L. Comprimido a temperatura constante até ${P2} atm, qual é o novo volume?`,
      (P1 * V1) / P2,
      [(P2 * V1) / P1, V1, V1 / 2 + 1],
      `Boyle: P₁V₁ = P₂V₂ → ${P1}·${V1} = ${P2}·V₂ → V₂ = ${fmt((P1 * V1) / P2)} L.`,
      w,
      u('L'),
    );
  },
  (r, w) => {
    const V1 = r.pick([2, 3, 4]),
      T1 = 300,
      T2 = r.pick([450, 600, 900]);
    return numQ(
      'medio',
      `Um gás ocupa ${V1} L a 300 K. Aquecido a ${T2} K com pressão constante, qual é o novo volume?`,
      (V1 * T2) / T1,
      [(V1 * T1) / T2, V1, V1 + T2 / 100],
      `Charles: V₁/T₁ = V₂/T₂ → V₂ = ${V1}·${T2} ÷ 300 = ${fmt((V1 * T2) / T1)} L.`,
      w,
      u('L'),
    );
  },
  (r, w) => {
    const n = r.pick([0.5, 1, 2]);
    return numQ(
      'facil',
      `Nas CNTP, 1 mol de gás ideal ocupa cerca de 22,4 L. Quanto ocupam ${fmt(n)} mol?`,
      22.4 * n,
      [22.4 / n, 22.4, 22.4 * n * 2],
      `${fmt(n)} × 22,4 = ${fmt(22.4 * n)} L.`,
      w,
      u('L'),
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Para usar as leis dos gases (Boyle, Charles), a temperatura deve estar em:',
      'kelvin',
      ['graus Celsius', 'graus Fahrenheit', 'qualquer escala', 'calorias'],
      'As leis dos gases usam a temperatura absoluta (kelvin); com Celsius as proporções dão errado.',
      w,
    ),
];
const discQui: GenDisc[] = [
  (r) => {
    const [nome, sim, Z, A] = r.pick(ATOMOS);
    return discQ(
      'facil',
      `O ${nome} (${sim}) tem Z = ${Z} e A = ${A}. Informe prótons, nêutrons e elétrons do átomo neutro e explique o que é Z e o que é A.`,
      `Prótons = ${Z}; nêutrons = ${A} − ${Z} = ${A - Z}; elétrons = ${Z} (átomo neutro). Z = número de prótons; A = prótons + nêutrons.`,
      [`Prótons = ${Z} e elétrons = ${Z}`, `Nêutrons = ${A - Z}`, 'Define corretamente Z e A'],
    );
  },
  (r) => {
    const C1 = r.pick([2, 5, 10]),
      V1 = r.pick([50, 100]),
      V2 = V1 * r.pick([2, 5, 10]);
    return discQ(
      'medio',
      `Um técnico dilui ${V1} mL de uma solução ${C1} mol/L até ${V2} mL. Calcule a nova concentração e explique por que a quantidade de soluto não muda na diluição.`,
      `Na diluição só se acrescenta solvente: n do soluto é constante. C₁V₁ = C₂V₂ → C₂ = ${C1}·${V1} ÷ ${V2} = ${fmt((C1 * V1) / V2)} mol/L.`,
      [
        'Explica que só se adiciona solvente',
        'Usa C₁V₁ = C₂V₂',
        `Chega a ${fmt((C1 * V1) / V2)} mol/L`,
      ],
    );
  },
  (r) => {
    const m = r.pick([32, 64, 160]);
    return discQ(
      'medio',
      `Na queima do metano (CH₄ + 2 O₂ → CO₂ + 2 H₂O), calcule a massa de CO₂ produzida por ${m} g de CH₄ (CH₄ = 16 g/mol; CO₂ = 44 g/mol). Mostre a proporção em mol.`,
      `${m} ÷ 16 = ${m / 16} mol de CH₄. Proporção 1 CH₄ : 1 CO₂ → ${m / 16} mol de CO₂ × 44 = ${(m / 16) * 44} g.`,
      [
        'Converte massa em mol',
        'Usa a proporção 1:1 da equação',
        `Chega a ${(m / 16) * 44} g de CO₂`,
      ],
    );
  },
];

// ================================================================= CIÊNCIAS (8º e 9º)
const densidade: GenObj[] = [
  (r, w) => {
    const m = r.int(2, 30) * 10,
      V = r.pick([10, 20, 25, 50]);
    return numQ(
      'facil',
      `Um objeto tem massa de ${m} g e volume de ${V} cm³. Qual é a densidade?`,
      m / V,
      [m * V, V / m, m - V],
      `d = m ÷ V = ${m} ÷ ${V} = ${fmt(m / V)} g/cm³.`,
      w,
      u('g/cm³'),
    );
  },
  (r, w) => {
    const d = r.pick([0.5, 0.8, 0.9, 2.7, 7.8, 11.3]);
    return textQ(
      'facil',
      `Um material de densidade ${fmt(d)} g/cm³, colocado em água (1 g/cm³):`,
      d < 1 ? 'flutua' : 'afunda',
      ['flutua', 'afunda', 'dissolve sempre', 'fica exatamente no meio sempre'],
      `Menos denso que a água flutua; mais denso afunda. ${fmt(d)} ${d < 1 ? '<' : '>'} 1.`,
      w,
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Para separar a areia da água de uma mistura, o método mais simples é a:',
      'filtração',
      ['destilação', 'evaporação da areia', 'imantação', 'catação de cada grão'],
      'A areia não se dissolve e fica retida no filtro; a água passa.',
      w,
    ),
  (_r, w) =>
    textQ(
      'medio',
      'Para obter água pura a partir de água salgada, usa-se a:',
      'destilação',
      ['filtração', 'decantação', 'peneiração', 'imantação'],
      'Na destilação, a água evapora, é condensada e recolhida; o sal fica no recipiente.',
      w,
    ),
];
const discCien: GenDisc[] = [
  (r) => {
    const m = r.int(5, 20) * 10,
      V = r.pick([10, 20, 50]);
    return discQ(
      'facil',
      `Um bloco tem ${m} g e ${V} cm³. Calcule a densidade e diga se ele flutua na água (1 g/cm³). Explique.`,
      `d = ${m} ÷ ${V} = ${fmt(m / V)} g/cm³. ${m / V > 1 ? 'Afunda, porque é mais denso que a água.' : m / V < 1 ? 'Flutua, porque é menos denso que a água.' : 'Tem a mesma densidade da água: fica em equilíbrio, sem afundar nem subir.'}`,
      ['Usa d = m ÷ V', `Calcula ${fmt(m / V)} g/cm³`, 'Compara com a água e conclui corretamente'],
    );
  },
  (r) => {
    const P = r.pick([1000, 1500, 2000]),
      h = r.pick([1, 2]);
    return discQ(
      'medio',
      `Um aquecedor de ${P} W fica ligado ${h} h por dia durante 30 dias. Calcule o consumo em kWh e proponha uma atitude para reduzir o gasto.`,
      `E = ${fmt(P / 1000)} kW × ${h * 30} h = ${fmt((P / 1000) * h * 30)} kWh. Atitudes: usar menos tempo, desligar quando sair, isolar o ambiente.`,
      [
        'Converte W em kW',
        `Calcula ${fmt((P / 1000) * h * 30)} kWh`,
        'Propõe atitude coerente de economia',
      ],
    );
  },
];

// ================================================================= EDUCAÇÃO FINANCEIRA
const finConsumo: GenObj[] = [
  (r, w) => {
    const preco = r.int(10, 60) * 10,
      p = r.pick([5, 10, 15]);
    return numQ(
      'facil',
      `Um celular custa ${brl(preco)}. À vista há ${p}% de desconto. Quanto se paga à vista?`,
      preco * (1 - p / 100),
      [(preco * p) / 100, preco - p, preco * (1 + p / 100)],
      `${p}% de ${brl(preco)} = ${brl((preco * p) / 100)}. À vista: ${brl(preco * (1 - p / 100))}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const renda = r.int(10, 50) * 100,
      p = r.pick([10, 20, 30]);
    return numQ(
      'facil',
      `Quem ganha ${brl(renda)} e quer guardar ${p}% por mês guarda quanto?`,
      (renda * p) / 100,
      [renda * p, renda / p, renda - (renda * p) / 100],
      `${p}% de ${brl(renda)} = ${brl((renda * p) / 100)}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const a = r.int(2, 4),
      pa = r.int(5, 12),
      b = a * 2,
      pb = Math.round(pa * 2 * (0.85 + r.next() * 0.25) * 100) / 100;
    const ua = pa / a,
      ub = pb / b;
    return textQ(
      'medio',
      `Pacote A: ${a} kg por ${brl(pa)}. Pacote B: ${b} kg por ${brl(pb)}. Qual é mais vantajoso?`,
      ua < ub
        ? 'A, porque o quilo sai mais barato'
        : ua > ub
          ? 'B, porque o quilo sai mais barato'
          : 'Tanto faz: o preço do quilo é igual',
      [
        'A, porque o quilo sai mais barato',
        'B, porque o quilo sai mais barato',
        'Tanto faz: o preço do quilo é igual',
        'A, porque o pacote é mais barato',
      ],
      `Preço por kg: A = ${brl(ua)}; B = ${brl(ub)}. Compare o preço por unidade, não o do pacote.`,
      w,
    );
  },
  (r, w) => {
    const vista = r.int(5, 20) * 100,
      n = r.pick([10, 12]),
      parc = Math.round((vista * 1.2) / n);
    return numQ(
      'medio',
      `Uma bicicleta custa ${brl(vista)} à vista ou ${n} × ${brl(parc)}. Quanto custa a mais parcelar?`,
      parc * n - vista,
      [parc * n, parc, vista * 0.2 + parc],
      `Parcelado: ${n} × ${brl(parc)} = ${brl(parc * n)}. Diferença: ${brl(parc * n - vista)}.`,
      w,
      brl,
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Uma reserva de emergência serve principalmente para:',
      'cobrir imprevistos sem precisar fazer dívidas',
      [
        'comprar o que está em promoção',
        'investir em ações arriscadas',
        'pagar só o mínimo do cartão',
        'emprestar para amigos',
      ],
      'Ela evita recorrer a crédito caro (cartão, cheque especial) quando surge um imprevisto.',
      w,
    ),
];
const finCredito: GenObj[] = [
  (r, w) => {
    const c = r.int(2, 20) * 100,
      i = r.pick([2, 3, 5]),
      t = r.int(2, 6);
    return numQ(
      'medio',
      `Uma dívida de ${brl(c)} com juros compostos de ${i}% ao mês, sem pagamento, vira quanto após ${t} meses?`,
      c * (1 + i / 100) ** t,
      [c * (1 + (i * t) / 100), c + i * t, c * (1 + i / 100)],
      `M = C·(1 + i)^t = ${brl(c)} × ${fmt(1 + i / 100, 2)}^${t} = ${brl(c * (1 + i / 100) ** t)}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const fatura = r.int(5, 30) * 100,
      min = 0.15;
    return numQ(
      'medio',
      `A fatura do cartão é ${brl(fatura)} e o pagamento mínimo é 15%. Pagando só o mínimo, quanto fica para o mês seguinte (antes dos juros)?`,
      fatura * (1 - min),
      [fatura * min, fatura, fatura * 1.15],
      `Pagou ${brl(fatura * min)}; sobram ${brl(fatura * (1 - min))}, sobre os quais incidem juros altos do rotativo.`,
      w,
      brl,
    );
  },
  (_r, w) =>
    textQ(
      'medio',
      'Entre as opções, a que costuma ter os juros MAIS altos no Brasil é:',
      'o rotativo do cartão de crédito',
      ['a poupança', 'um financiamento imobiliário', 'o Tesouro Selic', 'o pagamento à vista'],
      'O rotativo do cartão e o cheque especial estão entre os créditos mais caros do país; poupança e Tesouro são investimentos, não dívidas.',
      w,
    ),
  (r, w) => {
    const c = r.int(10, 50) * 100,
      i = r.pick([1, 2]),
      t = 12;
    return numQ(
      'facil',
      `Quanto rendem ${brl(c)} em juros simples de ${i}% ao mês em um ano?`,
      (c * i * t) / 100,
      [(c * i) / 100, c + (c * i * t) / 100, c * i * t],
      `J = ${brl(c)} × ${i}% × 12 = ${brl((c * i * t) / 100)}.`,
      w,
      brl,
    );
  },
];
const finInvest: GenObj[] = [
  (r, w) => {
    const rend = r.pick([8, 10, 12]),
      inf = r.pick([4, 5, 6]);
    return numQ(
      'medio',
      `Um investimento rendeu ${rend}% no ano e a inflação foi ${inf}%. Aproximadamente, qual foi o ganho real?`,
      rend - inf,
      [rend + inf, rend, inf],
      `Ganho real ≈ rendimento − inflação = ${rend}% − ${inf}% = ${rend - inf}% (a conta exata dá um pouco menos).`,
      w,
      (n) => `${fmt(n)}%`,
    );
  },
  (r, w) => {
    const c = r.int(10, 50) * 100,
      i = r.pick([1, 1.5]);
    return numQ(
      'medio',
      `Quanto vira ${brl(c)} aplicados a ${fmt(i)}% ao mês (juros compostos) por 2 meses?`,
      c * (1 + i / 100) ** 2,
      [c * (1 + (2 * i) / 100), c * (1 + i / 100), c + i * 2],
      `M = ${brl(c)} × ${fmt(1 + i / 100, 3)}² = ${brl(c * (1 + i / 100) ** 2)}.`,
      w,
      brl,
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Diversificar investimentos significa:',
      'distribuir o dinheiro em aplicações diferentes para reduzir o risco',
      [
        'colocar tudo na aplicação que mais rendeu no ano passado',
        'trocar de banco todo mês',
        'investir só em um tipo de ativo',
        'sacar tudo quando cair',
      ],
      'Espalhar o dinheiro reduz o impacto de uma aplicação que vá mal.',
      w,
    ),
  (_r, w) =>
    textQ(
      'medio',
      'Uma promessa de "rendimento garantido de 10% ao mês, sem risco" é sinal típico de:',
      'possível golpe (pirâmide financeira)',
      ['investimento conservador', 'poupança', 'título público', 'previdência privada'],
      'Nenhum investimento legal garante retornos tão altos sem risco; é característica de pirâmides e golpes.',
      w,
    ),
];
const discFin: GenDisc[] = [
  (r) => {
    const vista = r.int(10, 30) * 100,
      n = 10,
      parc = Math.round((vista * 1.15) / n);
    return discQ(
      'medio',
      `Uma geladeira custa ${brl(vista)} à vista ou ${n} parcelas de ${brl(parc)}. Calcule quanto se paga a mais no parcelado e diga em que situação parcelar pode fazer sentido.`,
      `Parcelado: ${n} × ${brl(parc)} = ${brl(parc * n)}. A mais: ${brl(parc * n - vista)}. Parcelar faz sentido sem juros, ou quando não há reserva e a compra é essencial, cabendo no orçamento.`,
      [
        'Calcula o total parcelado',
        `Chega a ${brl(parc * n - vista)} a mais`,
        'Argumenta com bom senso (juros, orçamento, necessidade)',
      ],
    );
  },
  (r) => {
    const renda = r.int(15, 40) * 100;
    return discQ(
      'medio',
      `Monte um orçamento simples para quem ganha ${brl(renda)}: 50% necessidades, 30% desejos e 20% poupança. Calcule cada parte e explique a importância da parte guardada.`,
      `Necessidades: ${brl(renda * 0.5)}; desejos: ${brl(renda * 0.3)}; poupança: ${brl(renda * 0.2)}. Guardar forma reserva de emergência e permite metas sem dívidas.`,
      [
        'Calcula as três partes corretamente',
        'Confere que somam a renda',
        'Explica a importância de poupar',
      ],
    );
  },
  (r) => {
    const c = 1000,
      i = r.pick([2, 3]);
    return discQ(
      'dificil',
      `Uma dívida de R$ 1.000,00 cresce ${i}% ao mês em juros compostos. Calcule o valor após 3 meses e explique por que dívidas em juros compostos crescem cada vez mais rápido.`,
      `M = 1000 × ${fmt(1 + i / 100, 2)}³ = ${brl(c * (1 + i / 100) ** 3)}. Os juros de cada mês incidem sobre o valor já corrigido (juros sobre juros).`,
      [
        'Aplica a fórmula dos juros compostos',
        `Chega a ${brl(c * (1 + i / 100) ** 3)}`,
        'Explica juros sobre juros',
      ],
    );
  },
];

// ================================================================= PENSAMENTO COMPUTACIONAL
const binario: GenObj[] = [
  (r, w) => {
    const n = r.int(5, 63);
    return numQ(
      'facil',
      `Qual é o número decimal correspondente ao binário ${n.toString(2)}?`,
      n,
      [parseInt(n.toString(2), 10) % 100, n + 1, n * 2],
      `Some as potências de 2 onde há 1: ${n
        .toString(2)
        .split('')
        .reverse()
        .map((b, i) => (b === '1' ? 2 ** i : 0))
        .filter(Boolean)
        .reverse()
        .join(' + ')} = ${n}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(5, 40);
    return textQ(
      'medio',
      `Como se escreve ${n} em binário?`,
      n.toString(2),
      [
        (n + 1).toString(2),
        (n - 1).toString(2),
        n.toString(2).split('').reverse().join(''),
        (n * 2).toString(2),
      ],
      `Divisões sucessivas por 2 (lendo os restos de baixo para cima): ${n} = ${n.toString(2)}₂.`,
      w,
    );
  },
  (r, w) => {
    const bits = r.pick([4, 8, 10]);
    return numQ(
      'facil',
      `Quantos valores diferentes podem ser representados com ${bits} bits?`,
      2 ** bits,
      [bits * 2, 2 ** bits - 1, bits ** 2],
      `Cada bit tem 2 estados: 2^${bits} = ${2 ** bits} valores.`,
      w,
    );
  },
  (r, w) => {
    const mb = r.pick([2, 4, 8]);
    return numQ(
      'medio',
      `Quantos kilobytes há em ${mb} MB (usando 1 MB = 1.024 KB)?`,
      mb * 1024,
      [mb * 1000, mb * 8, mb * 1024 * 8],
      `${mb} × 1.024 = ${(mb * 1024).toLocaleString('pt-BR')} KB.`,
      w,
      (n) => `${n.toLocaleString('pt-BR')} KB`,
    );
  },
];
const algoritmos: GenObj[] = [
  (r, w) => {
    const n = r.int(4, 12);
    return numQ(
      'facil',
      `Qual é o valor final de "soma" após o algoritmo: soma ← 0; para i de 1 até ${n}: soma ← soma + i?`,
      (n * (n + 1)) / 2,
      [n, n * n, (n * (n - 1)) / 2],
      `Soma 1 + 2 + … + ${n} = ${(n * (n + 1)) / 2}.`,
      w,
    );
  },
  (r, w) => {
    const x = r.int(1, 9),
      k = r.int(3, 6);
    return numQ(
      'medio',
      `x ← ${x}; repita ${k} vezes: x ← x × 2. Qual é o valor final de x?`,
      x * 2 ** k,
      [x * 2 * k, x + 2 * k, x * 2 ** (k - 1)],
      `Dobra ${k} vezes: ${x} × 2^${k} = ${x * 2 ** k}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(1, 20),
      b = r.int(1, 20);
    return numQ(
      'facil',
      `se ${a} > ${b} então mostre ${a} − ${b}, senão mostre ${b} − ${a}. O que aparece?`,
      Math.abs(a - b),
      [a - b === 0 ? 1 : -Math.abs(a - b), a + b, Math.max(a, b)],
      `${a} > ${b} é ${a > b ? 'verdadeiro' : 'falso'}; o resultado é ${Math.abs(a - b)}.`,
      w,
    );
  },
  (_r, w) =>
    textQ(
      'facil',
      'Dividir um problema grande em partes menores, mais fáceis de resolver, é chamado de:',
      'decomposição',
      ['abstração', 'reconhecimento de padrões', 'criptografia', 'compilação'],
      'Decomposição é um dos pilares do pensamento computacional, junto com padrões, abstração e algoritmos.',
      w,
    ),
  (r, w) => {
    const n = r.pick([8, 16, 32, 64, 128]);
    return numQ(
      'dificil',
      `Na busca binária numa lista ORDENADA de ${n} itens, quantas comparações bastam, no pior caso, para achar um item (ou saber que não está)?`,
      Math.log2(n) + 1,
      [n, n / 2, Math.log2(n) - 1],
      `Cada passo corta a lista pela metade: ${n} → … → 1 leva ${Math.log2(n)} cortes, mais a comparação final: ${Math.log2(n) + 1}.`,
      w,
    );
  },
];
const logica: GenObj[] = [
  (r, w) => {
    const a = r.next() < 0.5,
      b = r.next() < 0.5;
    const t = (v: boolean) => (v ? 'verdadeiro' : 'falso');
    return textQ(
      'facil',
      `Sendo A = ${t(a)} e B = ${t(b)}, quanto vale "A E B"?`,
      t(a && b),
      ['verdadeiro', 'falso', 'depende', 'erro'],
      `"E" só é verdadeiro se os dois forem verdadeiros.`,
      w,
    );
  },
  (r, w) => {
    const a = r.next() < 0.5,
      b = r.next() < 0.5;
    const t = (v: boolean) => (v ? 'verdadeiro' : 'falso');
    return textQ(
      'facil',
      `Sendo A = ${t(a)} e B = ${t(b)}, quanto vale "A OU B"?`,
      t(a || b),
      ['verdadeiro', 'falso', 'depende', 'erro'],
      `"OU" é verdadeiro se pelo menos um for verdadeiro.`,
      w,
    );
  },
  (r, w) => {
    const x = r.int(1, 30);
    return textQ(
      'medio',
      `Para x = ${x}, a expressão (x > 10) E (x < 20) é:`,
      x > 10 && x < 20 ? 'verdadeira' : 'falsa',
      ['verdadeira', 'falsa', 'indefinida', 'sempre verdadeira'],
      `x > 10 é ${x > 10 ? 'V' : 'F'}; x < 20 é ${x < 20 ? 'V' : 'F'}. "E" exige as duas.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(10, 99);
    return textQ(
      'medio',
      `Em muitas linguagens, "${n} % 2" dá o resto da divisão por 2. Para ${n}, o resultado indica que o número é:`,
      n % 2 === 0 ? 'par (resto 0)' : 'ímpar (resto 1)',
      ['par (resto 0)', 'ímpar (resto 1)', 'primo', 'negativo'],
      `${n} ÷ 2 deixa resto ${n % 2}.`,
      w,
    );
  },
];
const discPC: GenDisc[] = [
  (r) => {
    const n = r.int(10, 60);
    return discQ(
      'medio',
      `Converta ${n} para binário mostrando as divisões por 2, e depois confira convertendo o binário de volta para decimal.`,
      `${n} em binário é ${n.toString(2)}. Conferência: ${n
        .toString(2)
        .split('')
        .reverse()
        .map((b, i) => (b === '1' ? 2 ** i : 0))
        .filter(Boolean)
        .reverse()
        .join(' + ')} = ${n}.`,
      [
        'Faz as divisões sucessivas por 2',
        `Chega a ${n.toString(2)}`,
        'Confere voltando para decimal',
      ],
    );
  },
  (r) => {
    const n = r.int(5, 10);
    return discQ(
      'medio',
      `Escreva um algoritmo (em passos ou pseudocódigo) que some os números pares de 2 até ${2 * n} e diga qual é o resultado.`,
      `soma ← 0; para i de 2 até ${2 * n} de 2 em 2: soma ← soma + i; mostre soma. Resultado: ${n * (n + 1)}.`,
      [
        'Usa variável acumuladora iniciada em 0',
        'Usa repetição só com os pares (ou teste de par)',
        `Chega a ${n * (n + 1)}`,
      ],
    );
  },
];

export const EXATAS_G2: SerieGen[] = [
  {
    subject: 'fisica',
    grade: '1ª série EM',
    disc: discFis,
    temas: [
      { id: 'cinematica', tema: 'Cinemática', gens: cinematica },
      { id: 'newton', tema: 'Leis de Newton', gens: newton },
      { id: 'energia', tema: 'Trabalho, energia e potência', gens: energia },
    ],
  },
  {
    subject: 'fisica',
    grade: '2ª série EM',
    disc: [discFis[2]!, discFis[0]!],
    temas: [
      { id: 'termologia', tema: 'Termologia', gens: termologia },
      { id: 'ondas', tema: 'Ondas, som e espelhos', gens: ondas },
    ],
  },
  {
    subject: 'fisica',
    grade: '3ª série EM',
    disc: [discFis[3]!, discFis[1]!],
    temas: [
      { id: 'circuitos', tema: 'Circuitos elétricos', gens: circuitos },
      { id: 'consumo', tema: 'Potência e consumo de energia elétrica', gens: consumo },
    ],
  },
  {
    subject: 'quimica',
    grade: '1ª série EM',
    disc: [discQui[0]!, discQui[2]!],
    temas: [
      { id: 'atomistica', tema: 'Átomos, íons e isótopos', gens: atomistica },
      { id: 'mol', tema: 'Mol e massa molar', gens: mol },
    ],
  },
  {
    subject: 'quimica',
    grade: '2ª série EM',
    disc: [discQui[1]!, discQui[1]!],
    temas: [
      { id: 'solucoes', tema: 'Soluções e concentração', gens: solucoes },
      { id: 'ph', tema: 'Ácidos, bases e pH', gens: ph },
    ],
  },
  {
    subject: 'quimica',
    grade: '3ª série EM',
    disc: [discQui[2]!, discQui[1]!],
    temas: [
      { id: 'estequiometria', tema: 'Estequiometria', gens: estequiometria },
      { id: 'gases', tema: 'Estudo dos gases', gens: gases },
    ],
  },
  {
    subject: 'ciencias',
    grade: '8º ano',
    disc: [discCien[1]!],
    temas: [
      {
        id: 'energia-em-casa',
        tema: 'Energia elétrica em casa',
        gens: [...consumo, circuitos[0]!, circuitos[1]!],
      },
    ],
  },
  {
    subject: 'ciencias',
    grade: '9º ano',
    disc: [discCien[0]!],
    temas: [
      {
        id: 'materia-e-movimento',
        tema: 'Densidade, misturas e movimento',
        gens: [...densidade, cinematica[0]!, cinematica[4]!],
      },
    ],
  },
  {
    subject: 'educacao-financeira',
    grade: '7º ano',
    disc: [discFin[1]!],
    temas: [{ id: 'consumo', tema: 'Consumo consciente e descontos', gens: finConsumo }],
  },
  {
    subject: 'educacao-financeira',
    grade: '9º ano',
    disc: [discFin[0]!],
    temas: [{ id: 'credito', tema: 'Juros, crédito e dívidas', gens: finCredito }],
  },
  {
    subject: 'educacao-financeira',
    grade: '1ª série EM',
    disc: [discFin[2]!],
    temas: [{ id: 'investimentos', tema: 'Investimentos e inflação', gens: finInvest }],
  },
  {
    subject: 'educacao-financeira',
    grade: '3ª série EM',
    disc: [discFin[1]!],
    temas: [
      {
        id: 'vida-adulta',
        tema: 'Orçamento e vida financeira',
        gens: [...finConsumo.slice(1), ...finCredito.slice(0, 2), ...finInvest.slice(0, 1)],
      },
    ],
  },
  {
    subject: 'pensamento-computacional',
    grade: '7º ano',
    disc: [discPC[1]!],
    temas: [{ id: 'algoritmos', tema: 'Algoritmos e decomposição', gens: algoritmos }],
  },
  {
    subject: 'pensamento-computacional',
    grade: '9º ano',
    disc: [discPC[0]!],
    temas: [{ id: 'binario', tema: 'Sistema binário e dados', gens: binario }],
  },
  {
    subject: 'pensamento-computacional',
    grade: '1ª série EM',
    disc: [discPC[1]!],
    temas: [
      {
        id: 'logica',
        tema: 'Lógica booleana e programação',
        gens: [...logica, ...algoritmos.slice(1, 3)],
      },
    ],
  },
];

/** Geradores reaproveitados nos simulados de vestibular. */
export const GEN_EXATAS = {
  cinematica,
  newton,
  energia,
  termologia,
  ondas,
  circuitos,
  consumo,
  atomistica,
  mol,
  solucoes,
  ph,
  estequiometria,
  gases,
  discFis,
  discQui,
};
