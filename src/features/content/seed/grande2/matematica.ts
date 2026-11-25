import {
  brl,
  discQ,
  fmt,
  fracQ,
  fracao,
  numQ,
  textQ,
  type GenDisc,
  type GenObj,
  type SerieGen,
} from './gerador';

/** Matemática do 6º ano ao 3º ano do Médio: 4 temas por série, todas as contas calculadas pelo código. */

const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b));
const mmc = (a: number, b: number) => (a * b) / mdc(a, b);
const fat = (n: number): number => (n <= 1 ? 1 : n * fat(n - 1));
const comb = (n: number, k: number) => fat(n) / (fat(k) * fat(n - k));
const arr = (n: number, k: number) => fat(n) / fat(n - k);

// ---------------------------------------------------------------- 6º ano
const expressoes: GenObj[] = [
  (r, w) => {
    const a = r.int(5, 40),
      b = r.int(2, 9),
      c = r.int(2, 9);
    return numQ(
      'facil',
      `Qual é o valor da expressão ${a} + ${b} × ${c}?`,
      a + b * c,
      [(a + b) * c, a + b + c, a * b + c],
      `Primeiro a multiplicação: ${b} × ${c} = ${b * c}. Depois a soma: ${a} + ${b * c} = ${a + b * c}.`,
      w,
    );
  },
  (r, w) => {
    const b = r.int(3, 9),
      q = r.int(4, 15),
      a = r.int(10, 60);
    const d = b * q;
    return numQ(
      'medio',
      `Calcule: ${a} − ${d} ÷ ${b}.`,
      a - q,
      [(a - d) / b, a - d, a + q],
      `A divisão vem antes: ${d} ÷ ${b} = ${q}. Depois: ${a} − ${q} = ${a - q}.`,
      w,
    );
  },
  (r, w) => {
    const b = r.int(2, 5),
      n = r.int(2, 4);
    return numQ(
      'facil',
      `Quanto vale ${b}${['', '', '²', '³', '⁴'][n]}?`,
      b ** n,
      [b * n, b + n, b ** (n + 1)],
      `${b}${['', '', '²', '³', '⁴'][n]} é ${b} multiplicado por ele mesmo ${n} vezes: ${Array(n).fill(b).join(' × ')} = ${b ** n}.`,
      w,
    );
  },
  (r, w) => {
    const caixas = r.int(6, 25),
      por = r.int(12, 48);
    return numQ(
      'facil',
      `Uma escola recebeu ${caixas} caixas com ${por} livros cada uma. Quantos livros chegaram?`,
      caixas * por,
      [caixas + por, caixas * por - por, caixas * (por + 1)],
      `Multiplicação: ${caixas} × ${por} = ${caixas * por} livros.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(4, 9) * 3,
      b = r.int(2, 7) * 3;
    return numQ(
      'medio',
      `Qual é o MDC (máximo divisor comum) de ${a} e ${b}?`,
      mdc(a, b),
      [mmc(a, b), Math.min(a, b), 1, mdc(a, b) * 2],
      `O maior número que divide ${a} e ${b} ao mesmo tempo é ${mdc(a, b)}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(2, 9),
      b = r.int(3, 12);
    return numQ(
      'medio',
      `Um ônibus passa a cada ${a} minutos e outro a cada ${b} minutos. Se passaram juntos agora, daqui a quantos minutos passam juntos de novo?`,
      mmc(a, b),
      [a * b === mmc(a, b) ? a + b : a * b, a + b, mdc(a, b)],
      `É o MMC de ${a} e ${b}: o menor múltiplo comum, ${mmc(a, b)} minutos.`,
      w,
    );
  },
];
const fracoes6: GenObj[] = [
  (r, w) => {
    const den = r.pick([3, 4, 5, 6, 8, 10]),
      num = r.int(1, den - 1),
      k = r.int(2, 9);
    const total = den * k;
    return numQ(
      'facil',
      `Quanto é ${num}/${den} de ${total}?`,
      num * k,
      [total / num, k, num + k, total - num * k],
      `Divida ${total} em ${den} partes (${k} cada) e pegue ${num}: ${num} × ${k} = ${num * k}.`,
      w,
    );
  },
  (r, w) => {
    const den = r.pick([5, 7, 9, 11]),
      a = r.int(1, 4),
      b = r.int(1, den - a - 1);
    return textQ(
      'facil',
      `Quanto é ${a}/${den} + ${b}/${den}?`,
      `${a + b}/${den}`,
      [`${a + b}/${den * 2}`, `${a * b}/${den}`, `${a + b}/${den + 1}`, `${den}/${a + b}`],
      `Com denominadores iguais, somam-se os numeradores e mantém-se o denominador: ${a + b}/${den}.`,
      w,
    );
  },
  (r, w) => {
    const k = r.int(2, 6),
      n = r.pick([2, 3, 5]),
      d = r.pick([7, 9, 11]);
    return textQ(
      'medio',
      `Qual é a forma simplificada (irredutível) da fração ${n * k}/${d * k}?`,
      `${n}/${d}`,
      [`${n * k}/${d}`, `${n}/${d * k}`, `${d}/${n}`, `${n + 1}/${d}`],
      `Divida numerador e denominador por ${k}: ${n * k} ÷ ${k} = ${n} e ${d * k} ÷ ${k} = ${d}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.pick([2, 3, 4]),
      b = a * 2;
    return textQ(
      'medio',
      `Quanto é 1/${a} + 1/${b}?`,
      `3/${b}`,
      [`2/${a + b}`, `2/${b}`, `1/${a + b}`, `3/${a + b}`],
      `Iguale os denominadores: 1/${a} = 2/${b}. Então 2/${b} + 1/${b} = 3/${b}.`,
      w,
    );
  },
  (r, w) => {
    const pizza = r.pick([8, 6, 12]),
      comeu = r.int(2, pizza - 2);
    return textQ(
      'facil',
      `Uma pizza foi cortada em ${pizza} pedaços iguais e ${comeu} foram comidos. Que fração da pizza SOBROU?`,
      `${pizza - comeu}/${pizza}`,
      [`${comeu}/${pizza}`, `${pizza - comeu}/${comeu}`, `${pizza}/${pizza - comeu}`, `1/${pizza}`],
      `Sobraram ${pizza - comeu} dos ${pizza} pedaços: ${pizza - comeu}/${pizza}.`,
      w,
    );
  },
];
const decimais6: GenObj[] = [
  (r, w) => {
    const a = r.int(11, 89) / 10,
      b = r.int(105, 499) / 100;
    return numQ(
      'facil',
      `Quanto é ${fmt(a)} + ${fmt(b)}?`,
      a + b,
      [a + b + 0.9, a + b - 1, round1(a) + b * 10, a * b],
      `Alinhe as vírgulas e some: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(12, 999) / 100,
      m = r.pick([10, 100, 1000]);
    return numQ(
      'facil',
      `Quanto é ${fmt(a)} × ${fmt(m)}?`,
      a * m,
      [a * (m / 10), a * m * 10, a / m],
      `Multiplicar por ${fmt(m)} desloca a vírgula ${String(m).length - 1} casa(s) para a direita: ${fmt(a * m)}.`,
      w,
    );
  },
  (r, w) => {
    const preco = r.int(250, 1890) / 100,
      nota = preco < 10 ? 10 : preco < 20 ? 20 : 50;
    return numQ(
      'facil',
      `Um lanche custa ${brl(preco)}. Pagando com uma nota de ${brl(nota)}, qual é o troco?`,
      nota - preco,
      [nota - preco + 1, nota - preco - 1, nota - Math.floor(preco)],
      `Troco = ${brl(nota)} − ${brl(preco)} = ${brl(nota - preco)}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const kg = r.int(2, 5),
      preco = r.int(350, 990) / 100;
    return numQ(
      'medio',
      `O quilo da banana custa ${brl(preco)}. Quanto custam ${kg} kg e meio?`,
      preco * (kg + 0.5),
      [preco * kg, preco * (kg + 1), preco * kg + 0.5],
      `${fmt(kg + 0.5)} × ${brl(preco)} = ${brl(preco * (kg + 0.5))}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const n = r.int(3, 9);
    return textQ(
      'facil',
      `Como se escreve ${n}/10 na forma decimal?`,
      `0,${n}`,
      [`0,0${n}`, `${n},0`, `${n},10`, `0,${n}0${n}`],
      `Décimos ficam na 1ª casa depois da vírgula: ${n}/10 = 0,${n}.`,
      w,
    );
  },
];
const round1 = (n: number) => Math.round(n * 10) / 10;
const area6: GenObj[] = [
  (r, w) => {
    const a = r.int(4, 20),
      b = r.int(3, 15);
    return numQ(
      'facil',
      `Um terreno retangular mede ${a} m por ${b} m. Qual é a sua área?`,
      a * b,
      [2 * (a + b), a + b, a * b * 2],
      `Área do retângulo = comprimento × largura = ${a} × ${b} = ${a * b} m².`,
      w,
      (n) => `${fmt(n)} m²`,
    );
  },
  (r, w) => {
    const a = r.int(4, 30),
      b = r.int(3, 20);
    return numQ(
      'facil',
      `Quantos metros de cerca são precisos para contornar um jardim retangular de ${a} m por ${b} m?`,
      2 * (a + b),
      [a * b, a + b, 4 * a],
      `Perímetro = soma dos lados = 2 × (${a} + ${b}) = ${2 * (a + b)} m.`,
      w,
      (n) => `${fmt(n)} m`,
    );
  },
  (r, w) => {
    const l = r.int(3, 15);
    return numQ(
      'facil',
      `Um quadrado tem lado de ${l} cm. Qual é a área dele?`,
      l * l,
      [4 * l, 2 * l, l * l * 2],
      `Área do quadrado = lado × lado = ${l} × ${l} = ${l * l} cm².`,
      w,
      (n) => `${fmt(n)} cm²`,
    );
  },
  (r, w) => {
    const b = r.int(3, 12) * 2,
      h = r.int(3, 14);
    return numQ(
      'medio',
      `Um triângulo tem base ${b} cm e altura ${h} cm. Qual é a área?`,
      (b * h) / 2,
      [b * h, b + h, (b + h) / 2],
      `Área do triângulo = (base × altura) ÷ 2 = (${b} × ${h}) ÷ 2 = ${(b * h) / 2} cm².`,
      w,
      (n) => `${fmt(n)} cm²`,
    );
  },
  (r, w) => {
    const lado = r.int(3, 8),
      caixa = r.pick([2, 3, 4, 5]);
    const area = lado * lado;
    return numQ(
      'medio',
      `Uma sala quadrada de ${lado} m de lado será coberta com piso. Cada caixa cobre ${caixa} m². Quantas caixas, no mínimo, são necessárias?`,
      Math.ceil(area / caixa),
      [
        Math.floor(area / caixa) === Math.ceil(area / caixa)
          ? area / caixa + 1
          : Math.floor(area / caixa),
        (4 * lado) / caixa,
        area,
      ],
      `Área = ${lado} × ${lado} = ${area} m². ${area} ÷ ${caixa} = ${fmt(area / caixa)}; arredondando PARA CIMA (não se compra parte de caixa): ${Math.ceil(area / caixa)} caixas.`,
      w,
    );
  },
];
const disc6: GenDisc[] = [
  (r) => {
    const a = r.int(6, 15),
      b = r.int(4, 10),
      c = r.int(2, 4);
    return discQ(
      'medio',
      `Um jardim retangular mede ${a} m por ${b} m. Um canteiro quadrado de ${c} m de lado, no meio dele, será de flores; o resto, de grama. Quantos metros quadrados de grama são necessários? Mostre as contas.`,
      `Área do jardim: ${a} × ${b} = ${a * b} m². Área do canteiro: ${c} × ${c} = ${c * c} m². Grama: ${a * b} − ${c * c} = ${a * b - c * c} m².`,
      [
        'Calcula a área do retângulo',
        'Calcula a área do quadrado',
        `Subtrai e chega a ${a * b - c * c} m², com a unidade`,
      ],
    );
  },
  (r) => {
    const preco = r.int(3, 9),
      qtd = r.int(3, 8),
      nota = 50;
    return discQ(
      'facil',
      `Ana comprou ${qtd} cadernos de R$ ${preco},00 cada e pagou com uma nota de R$ 50,00. Quanto recebeu de troco? Explique como calculou.`,
      `Total: ${qtd} × ${preco} = R$ ${qtd * preco},00. Troco: 50 − ${qtd * preco} = R$ ${nota - qtd * preco},00.`,
      [
        'Multiplica a quantidade pelo preço',
        `Subtrai de R$ 50,00 e chega a R$ ${nota - qtd * preco},00`,
        'Explica os passos com clareza',
      ],
    );
  },
  (r) => {
    const den = r.pick([4, 5, 8]),
      num = r.int(1, den - 1),
      total = den * r.int(3, 9);
    return discQ(
      'medio',
      `Uma turma tem ${total} alunos e ${num}/${den} deles vão de ônibus para a escola. Quantos alunos NÃO vão de ônibus? Mostre o raciocínio.`,
      `${num}/${den} de ${total} = ${(total / den) * num} alunos vão de ônibus. Não vão: ${total} − ${(total / den) * num} = ${total - (total / den) * num}.`,
      [
        `Calcula ${num}/${den} de ${total} (divide por ${den} e multiplica por ${num})`,
        `Chega a ${total - (total / den) * num} alunos que não vão de ônibus`,
        'Mostra as etapas',
      ],
    );
  },
];

// ---------------------------------------------------------------- 7º ano
const inteiros7: GenObj[] = [
  (r, w) => {
    const a = -r.int(2, 15),
      b = r.int(3, 20);
    return numQ(
      'facil',
      `Quanto é (${a}) + (+${b})?`,
      a + b,
      [-(a + b), a - b, b - a + 2],
      `Sinais diferentes: subtraia os módulos (${b} − ${-a}) e mantenha o sinal do maior módulo: ${a + b}.`,
      w,
    );
  },
  (r, w) => {
    const a = -r.int(2, 9),
      b = -r.int(2, 9);
    return numQ(
      'facil',
      `Quanto é (${a}) × (${b})?`,
      a * b,
      [-(a * b), a + b, a - b],
      `Menos vezes menos dá mais: (${a}) × (${b}) = +${a * b}.`,
      w,
    );
  },
  (r, w) => {
    const min = -r.int(3, 12),
      max = r.int(5, 30);
    return numQ(
      'facil',
      `Numa cidade, a mínima foi ${min} °C e a máxima ${max} °C. Qual foi a variação de temperatura?`,
      max - min,
      [max + min, max, -min],
      `Variação = máxima − mínima = ${max} − (${min}) = ${max} + ${-min} = ${max - min} °C.`,
      w,
      (n) => `${fmt(n)} °C`,
    );
  },
  (r, w) => {
    const saldo = r.int(50, 300),
      gasto = saldo + r.int(20, 150);
    return numQ(
      'medio',
      `Pedro tinha ${brl(saldo)} na conta e fez uma compra de ${brl(gasto)} no débito com cheque especial. Qual ficou o saldo?`,
      saldo - gasto,
      [gasto - saldo, saldo + gasto, -saldo],
      `${saldo} − ${gasto} = ${saldo - gasto}: o saldo fica negativo em ${brl(gasto - saldo)}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const a = -r.int(12, 40),
      b = r.pick([2, 4]);
    const a2 = a - (a % b);
    return numQ(
      'medio',
      `Quanto é (${a2}) ÷ (+${b})?`,
      a2 / b,
      [-a2 / b, a2 * b, a2 + b],
      `Sinais diferentes na divisão dão resultado negativo: ${a2} ÷ ${b} = ${a2 / b}.`,
      w,
    );
  },
];
const equacoes7: GenObj[] = [
  (r, w) => {
    const a = r.int(2, 9),
      x = r.int(-6, 12),
      b = r.int(1, 20);
    const c = a * x + b;
    return numQ(
      'facil',
      `Resolva: ${a}x + ${b} = ${c}.`,
      x,
      [(c + b) / a, c - b, x + 1],
      `${a}x = ${c} − ${b} = ${c - b}; x = ${c - b} ÷ ${a} = ${x}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(2, 6),
      x = r.int(1, 10),
      b = r.int(1, 8);
    const c = a * (x + b);
    return numQ(
      'medio',
      `Resolva: ${a}(x + ${b}) = ${c}.`,
      x,
      [c / a, c - b, (c - b) / a],
      `Divida os dois lados por ${a}: x + ${b} = ${c / a}. Então x = ${c / a} − ${b} = ${x}.`,
      w,
    );
  },
  (r, w) => {
    const x = r.int(5, 40);
    return numQ(
      'facil',
      `O dobro de um número mais 7 é igual a ${2 * x + 7}. Qual é o número?`,
      x,
      [2 * x + 7 - 7, (2 * x + 7 + 7) / 2, x + 7],
      `2x + 7 = ${2 * x + 7} → 2x = ${2 * x} → x = ${x}.`,
      w,
    );
  },
  (r, w) => {
    const x = r.int(3, 20),
      d = r.int(2, 9);
    return numQ(
      'medio',
      `Somando a idade de Lia com a de seu irmão, que é ${d} anos mais velho, dá ${2 * x + d}. Qual é a idade de Lia?`,
      x,
      [x + d, (2 * x + d) / 2, 2 * x],
      `x + (x + ${d}) = ${2 * x + d} → 2x = ${2 * x} → x = ${x} anos.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(4, 9),
      b = r.int(1, 3),
      x = r.int(2, 10),
      c = r.int(1, 15);
    const d = (a - b) * x + c;
    return numQ(
      'dificil',
      `Resolva: ${a}x + ${c} = ${b}x + ${d}.`,
      x,
      [(d - c) / (a + b), d - c, x + 2],
      `${a}x − ${b}x = ${d} − ${c} → ${a - b}x = ${d - c} → x = ${x}.`,
      w,
    );
  },
];
const razao7: GenObj[] = [
  (r, w) => {
    const q1 = r.int(2, 6),
      p1 = q1 * r.int(3, 8),
      q2 = q1 * r.int(2, 4);
    return numQ(
      'facil',
      `Se ${q1} cadernos custam R$ ${p1},00, quanto custam ${q2} cadernos?`,
      (p1 / q1) * q2,
      [p1 * q2, p1 + q2, (q1 * q2) / p1],
      `Cada caderno custa ${p1} ÷ ${q1} = R$ ${p1 / q1},00. ${q2} × ${p1 / q1} = R$ ${(p1 / q1) * q2},00.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const esc = r.pick([1000, 50000, 100000, 200000]),
      cm = r.int(2, 9);
    const km = (cm * esc) / 100000;
    return numQ(
      'medio',
      `Num mapa de escala 1:${esc.toLocaleString('pt-BR')}, duas cidades estão a ${cm} cm. Qual é a distância real?`,
      km,
      [km * 10, km / 10, cm * esc],
      `1 cm no mapa = ${esc.toLocaleString('pt-BR')} cm reais. ${cm} × ${esc.toLocaleString('pt-BR')} = ${(cm * esc).toLocaleString('pt-BR')} cm = ${fmt(km, 3)} km.`,
      w,
      (n) => `${fmt(n, 3)} km`,
    );
  },
  (r, w) => {
    const p1 = r.pick([2, 3, 4, 6]),
      d1 = r.pick([6, 12, 24]),
      p2 = p1 * 2;
    return numQ(
      'medio',
      `${p1} pedreiros fazem um muro em ${d1} dias. Em quantos dias ${p2} pedreiros, no mesmo ritmo, fazem o mesmo muro?`,
      (p1 * d1) / p2,
      [d1 * 2, d1, (p2 * d1) / p1],
      `Grandezas INVERSAMENTE proporcionais: mais pedreiros, menos dias. ${p1} × ${d1} = ${p2} × x → x = ${(p1 * d1) / p2} dias.`,
      w,
    );
  },
  (r, w) => {
    const m = r.int(2, 9),
      h = r.int(2, 9);
    return textQ(
      'facil',
      `Numa turma há ${m * 2} meninas e ${h * 2} meninos. Qual é a razão entre meninas e meninos, na forma simplificada?`,
      `${m / mdc(m, h)}/${h / mdc(m, h)}`,
      [
        `${h / mdc(m, h)}/${m / mdc(m, h)}`,
        `${m * 2}/${(m + h) * 2}`,
        `${m}/${m + h}`,
        `${m + 1}/${h}`,
      ],
      `Razão = ${m * 2}/${h * 2}; simplificando: ${m / mdc(m, h)}/${h / mdc(m, h)}.`,
      w,
    );
  },
  (r, w) => {
    const v = r.pick([60, 80, 90, 100]),
      t = r.int(2, 5);
    return numQ(
      'facil',
      `Um carro a ${v} km/h constantes percorre quanto em ${t} horas?`,
      v * t,
      [v + t, v / t, v * (t + 1)],
      `Distância = velocidade × tempo = ${v} × ${t} = ${v * t} km.`,
      w,
      (n) => `${fmt(n)} km`,
    );
  },
];
const porcentagem7: GenObj[] = [
  (r, w) => {
    const p = r.pick([10, 20, 25, 30, 40, 50, 15]),
      n = r.int(2, 30) * 20;
    return numQ(
      'facil',
      `Quanto é ${p}% de ${n}?`,
      (p * n) / 100,
      [p * n, n / p, (p * n) / 10],
      `${p}% = ${p}/100. ${p}/100 × ${n} = ${(p * n) / 100}.`,
      w,
    );
  },
  (r, w) => {
    const preco = r.int(4, 40) * 10,
      p = r.pick([10, 15, 20, 25, 30]);
    return numQ(
      'facil',
      `Uma blusa de ${brl(preco)} está com ${p}% de desconto. Qual é o novo preço?`,
      preco * (1 - p / 100),
      [(preco * p) / 100, preco - p, preco * (1 + p / 100)],
      `Desconto: ${p}% de ${preco} = ${brl((preco * p) / 100)}. Preço final: ${brl(preco * (1 - p / 100))}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const sal = r.int(15, 40) * 100,
      p = r.pick([5, 8, 10, 12]);
    return numQ(
      'medio',
      `Um salário de ${brl(sal)} teve aumento de ${p}%. Qual é o novo salário?`,
      sal * (1 + p / 100),
      [(sal * p) / 100, sal + p, sal * (1 - p / 100)],
      `Aumento: ${brl((sal * p) / 100)}. Novo salário: ${brl(sal)} + ${brl((sal * p) / 100)} = ${brl(sal * (1 + p / 100))}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const total = r.pick([20, 25, 40, 50]),
      acertos = r.int(Math.ceil(total * 0.4), total);
    return numQ(
      'medio',
      `Numa prova de ${total} questões, Lucas acertou ${acertos}. Qual foi o percentual de acertos?`,
      (acertos / total) * 100,
      [acertos, total - acertos, (acertos / total) * 10],
      `${acertos} ÷ ${total} = ${fmt(acertos / total, 3)} = ${fmt((acertos / total) * 100)}%.`,
      w,
      (n) => `${fmt(n)}%`,
    );
  },
  (r, w) => {
    const p = r.pick([20, 25, 40]),
      parte = r.int(3, 30);
    const total = (parte * 100) / p;
    return numQ(
      'dificil',
      `${parte} alunos correspondem a ${p}% de uma escola. Quantos alunos tem a escola?`,
      total,
      [(parte * p) / 100, parte * p, parte + p],
      `Se ${p}% são ${parte}, 1% é ${fmt(parte / p, 3)} e 100% é ${fmt(total)}.`,
      w,
    );
  },
];
const disc7: GenDisc[] = [
  (r) => {
    const x = r.int(8, 30),
      d = r.int(3, 9);
    return discQ(
      'medio',
      `A soma de dois números é ${2 * x + d} e um deles é ${d} unidades maior que o outro. Monte a equação e encontre os dois números.`,
      `Menor: x; maior: x + ${d}. x + x + ${d} = ${2 * x + d} → 2x = ${2 * x} → x = ${x}. Os números são ${x} e ${x + d}.`,
      ['Monta a equação com uma incógnita', 'Resolve corretamente', `Chega a ${x} e ${x + d}`],
    );
  },
  (r) => {
    const preco = r.int(10, 40) * 10,
      p = r.pick([10, 20, 25]);
    return discQ(
      'facil',
      `Uma loja dá ${p}% de desconto à vista num tênis de R$ ${preco},00. Quanto se paga à vista? Mostre o cálculo do desconto.`,
      `Desconto: ${p}% de ${preco} = ${(preco * p) / 100}. Preço à vista: ${preco} − ${(preco * p) / 100} = R$ ${preco - (preco * p) / 100}.`,
      [
        'Calcula a porcentagem do preço',
        `Subtrai e chega a R$ ${preco - (preco * p) / 100}`,
        'Mostra as etapas',
      ],
    );
  },
  (r) => {
    const q1 = r.pick([3, 4, 5]),
      dias = r.pick([12, 20, 30]),
      q2 = q1 * 2;
    return discQ(
      'dificil',
      `${q1} torneiras iguais enchem um tanque em ${dias} horas. Em quanto tempo ${q2} torneiras iguais enchem o mesmo tanque? Diga se as grandezas são direta ou inversamente proporcionais e justifique.`,
      `Inversamente proporcionais: dobrar as torneiras reduz o tempo à metade. ${q1} × ${dias} = ${q2} × t → t = ${(q1 * dias) / q2} horas.`,
      [
        'Identifica proporção inversa e justifica',
        `Calcula ${(q1 * dias) / q2} horas`,
        'Mostra a regra de três',
      ],
    );
  },
];

// ---------------------------------------------------------------- 8º ano
const potencias8: GenObj[] = [
  (r, w) => {
    const b = r.pick([2, 3, 5, 10]),
      m = r.int(2, 4),
      n = r.int(2, 4);
    return textQ(
      'facil',
      `Pela propriedade das potências, ${b}^${m} × ${b}^${n} é igual a:`,
      `${b}^${m + n}`,
      [`${b}^${m * n}`, `${b * b}^${m + n}`, `${b}^${m - n}`, `${2 * b}^${m * n}`],
      `Multiplicação de potências de mesma base: conserva a base e SOMA os expoentes: ${b}^${m + n}.`,
      w,
    );
  },
  (r, w) => {
    const b = r.pick([2, 4, 5, 10]);
    return numQ(
      'medio',
      `Quanto vale ${b}^(−1)?`,
      1 / b,
      [-b, b, -1 / b],
      `Expoente negativo inverte a base: ${b}^(−1) = 1/${b} = ${fmt(1 / b, 3)}.`,
      w,
      (n) => fmt(n, 3),
    );
  },
  (r, w) => {
    const m = r.int(12, 98) / 10,
      e = r.int(3, 8);
    const n = m * 10 ** e;
    return textQ(
      'medio',
      `Como se escreve ${n.toLocaleString('pt-BR')} em notação científica?`,
      `${fmt(m)} × 10^${e}`,
      [
        `${fmt(m)} × 10^${e + 1}`,
        `${fmt(m * 10)} × 10^${e}`,
        `${fmt(m)} × 10^${e - 1}`,
        `${fmt(m / 10)} × 10^${e}`,
      ],
      `Notação científica: um número entre 1 e 10 vezes potência de 10. A vírgula andou ${e} casas: ${fmt(m)} × 10^${e}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.pick([16, 25, 36, 49, 64, 81, 100, 121, 144]);
    return numQ(
      'facil',
      `Qual é a raiz quadrada de ${n}?`,
      Math.sqrt(n),
      [n / 2, Math.sqrt(n) + 1, n / 4],
      `${Math.sqrt(n)} × ${Math.sqrt(n)} = ${n}.`,
      w,
    );
  },
  (r, w) => {
    const b = r.int(2, 9);
    return numQ(
      'facil',
      `Quanto é (−${b})²?`,
      b * b,
      [-b * b, -2 * b, 2 * b],
      `(−${b})² = (−${b}) × (−${b}) = +${b * b}. Atenção: −${b}² seria −${b * b}.`,
      w,
    );
  },
];
const algebra8: GenObj[] = [
  (r, w) => {
    const a = r.int(2, 9);
    return textQ(
      'medio',
      `Desenvolvendo (x + ${a})², obtém-se:`,
      `x² + ${2 * a}x + ${a * a}`,
      [`x² + ${a * a}`, `x² + ${a}x + ${a * a}`, `x² + ${2 * a}x + ${2 * a}`, `2x + ${2 * a}`],
      `Quadrado da soma: (a + b)² = a² + 2ab + b² → x² + 2·${a}·x + ${a * a}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(11, 40),
      b = r.int(1, 9);
    return numQ(
      'medio',
      `Usando a diferença de quadrados, calcule ${a}² − ${b}².`,
      a * a - b * b,
      [(a - b) ** 2, a * a + b * b, (a + b) ** 2],
      `${a}² − ${b}² = (${a} + ${b})(${a} − ${b}) = ${a + b} × ${a - b} = ${a * a - b * b}.`,
      w,
    );
  },
  (r, w) => {
    const x = r.int(-4, 6),
      a = r.int(2, 5),
      b = r.int(1, 9);
    return numQ(
      'facil',
      `Qual é o valor numérico de ${a}x² − ${b} para x = ${x}?`,
      a * x * x - b,
      [a * x - b, (a * x) ** 2 - b, a * x * x + b],
      `${a} × (${x})² − ${b} = ${a} × ${x * x} − ${b} = ${a * x * x - b}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(2, 9);
    return textQ(
      'medio',
      `A fatoração de x² − ${a * a} é:`,
      `(x + ${a})(x − ${a})`,
      [`(x − ${a})²`, `(x + ${a})²`, `x(x − ${a * a})`, `(x − ${a * a})(x + 1)`],
      `Diferença de quadrados: a² − b² = (a + b)(a − b).`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(2, 6),
      b = r.int(2, 6);
    return textQ(
      'facil',
      `Simplifique: ${a}x + ${b}x − x.`,
      `${a + b - 1}x`,
      [`${a + b}x`, `${a * b}x`, `${a + b - 1}x²`, `${a + b + 1}x`],
      `Termos semelhantes: some os coeficientes: ${a} + ${b} − 1 = ${a + b - 1}.`,
      w,
    );
  },
];
const sistemas8: GenObj[] = [
  (r, w) => {
    const x = r.int(3, 20),
      y = r.int(1, x - 1);
    return numQ(
      'facil',
      `Se x + y = ${x + y} e x − y = ${x - y}, quanto vale x?`,
      x,
      [y, x + y, (x + y) / 2 + 1],
      `Somando as equações: 2x = ${2 * x} → x = ${x} (e y = ${y}).`,
      w,
    );
  },
  (r, w) => {
    const c = r.int(5, 20),
      m = r.int(3, 15);
    return numQ(
      'medio',
      `Num estacionamento há ${c + m} veículos entre carros e motos, com ${4 * c + 2 * m} rodas no total. Quantos são os carros?`,
      c,
      [m, c + m, (4 * c + 2 * m) / 4],
      `c + m = ${c + m} e 4c + 2m = ${4 * c + 2 * m}. Multiplicando a 1ª por 2 e subtraindo: 2c = ${2 * c} → c = ${c}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(2, 6),
      b = r.int(2, 8);
    return numQ(
      'medio',
      `Um lanche e um suco custam juntos R$ ${a + b},00. Dois lanches e um suco custam R$ ${2 * a + b},00. Quanto custa o lanche?`,
      a,
      [b, a + b, 2 * a],
      `Subtraindo as equações: (2L + S) − (L + S) = ${2 * a + b} − ${a + b} → L = R$ ${a},00.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const x = r.int(1, 9),
      y = r.int(1, 9);
    return textQ(
      'dificil',
      `Qual par (x, y) resolve o sistema 2x + y = ${2 * x + y} e x + 3y = ${x + 3 * y}?`,
      `(${x}, ${y})`,
      [`(${y}, ${x})`, `(${x + 1}, ${y - 1})`, `(${x}, ${y + 2})`, `(${2 * x}, ${y})`],
      `Isole y na 1ª: y = ${2 * x + y} − 2x. Substitua na 2ª e resolva: x = ${x}, y = ${y}.`,
      w,
    );
  },
];
const estatistica8: GenObj[] = [
  (r, w) => {
    const ns = [r.int(4, 10), r.int(4, 10), r.int(4, 10), r.int(4, 10)];
    const soma = ns.reduce((a, b) => a + b, 0);
    return numQ(
      'facil',
      `As notas de Bia foram ${ns.join(', ')}. Qual é a média?`,
      soma / 4,
      [soma, soma / 3, Math.max(...ns)],
      `Média = soma ÷ quantidade = ${soma} ÷ 4 = ${fmt(soma / 4)}.`,
      w,
    );
  },
  (r, w) => {
    const alvo = r.int(2, 12);
    const casos = 6 - Math.abs(7 - alvo);
    return fracQ(
      'medio',
      `Lançando dois dados comuns, qual é a probabilidade de a soma ser ${alvo}?`,
      [casos, 36],
      [
        [1, alvo],
        [casos, 12],
        [1, 6],
        [casos + 1, 36],
        [1, 11],
        [alvo, 36],
        [1, 36],
      ],
      `São 36 resultados possíveis e ${casos} deles somam ${alvo}: P = ${casos}/36 = ${fracao(casos, 36)}.`,
      w,
    );
  },
  (r, w) => {
    const v = r.int(2, 8),
      a = r.int(2, 10),
      az = r.int(2, 10);
    const t = v + a + az;
    return fracQ(
      'facil',
      `Uma caixa tem ${v} bolas vermelhas, ${a} amarelas e ${az} azuis. Tirando uma ao acaso, qual é a probabilidade de ser vermelha?`,
      [v, t],
      [
        [v, a + az],
        [1, 3],
        [a + az, t],
        [v, t + 1],
        [a, t],
        [1, v],
      ],
      `Casos favoráveis ÷ casos possíveis = ${v}/${t}${fracao(v, t) !== `${v}/${t}` ? ` = ${fracao(v, t)}` : ''}.`,
      w,
    );
  },
  (r, w) => {
    const moda = r.int(3, 9),
      outros = [moda + 1, moda - 1, moda + 3];
    const lista = [moda, outros[0], moda, outros[1], moda, outros[2]];
    return numQ(
      'facil',
      `Qual é a moda do conjunto ${lista.join(', ')}?`,
      moda,
      outros,
      `Moda é o valor que mais aparece: ${moda} (3 vezes).`,
      w,
    );
  },
];
const disc8: GenDisc[] = [
  (r) => {
    const c = r.int(8, 25),
      m = r.int(4, 15);
    return discQ(
      'medio',
      `Numa garagem há ${c + m} veículos (carros e motos) e ${4 * c + 2 * m} rodas. Monte um sistema e descubra quantos carros e quantas motos há.`,
      `c + m = ${c + m}; 4c + 2m = ${4 * c + 2 * m}. Da 1ª, m = ${c + m} − c. Substituindo: 4c + 2(${c + m} − c) = ${4 * c + 2 * m} → 2c = ${2 * c} → c = ${c}, m = ${m}.`,
      [
        'Monta as duas equações',
        'Resolve por substituição ou adição',
        `Conclui ${c} carros e ${m} motos`,
      ],
    );
  },
  (r) => {
    const ns = [r.int(5, 10), r.int(3, 10), r.int(4, 9)];
    const falta = Math.max(0, 7 * 4 - ns.reduce((a, b) => a + b, 0));
    return discQ(
      'dificil',
      `Para passar, Caio precisa de média 7 em 4 provas. Ele tirou ${ns.join(', ')} nas três primeiras. Quanto precisa tirar na 4ª? Explique.`,
      `Soma necessária: 7 × 4 = 28. Já tem ${ns.reduce((a, b) => a + b, 0)}. Precisa de ${28 - ns.reduce((a, b) => a + b, 0)}${falta > 10 ? ' (mais que 10: não é possível só com a 4ª prova)' : falta === 0 ? ' (já atingiu: qualquer nota serve)' : ''}.`,
      [
        'Usa média × quantidade = soma',
        'Subtrai a soma das três notas',
        'Interpreta o resultado (inclusive se for impossível ou já atingido)',
      ],
    );
  },
];

// ---------------------------------------------------------------- 9º ano
const segundoGrau9: GenObj[] = [
  (r, w) => {
    const p = r.int(1, 7),
      q = r.int(-6, -1);
    return textQ(
      'medio',
      `Quais são as raízes de x² ${-(p + q) >= 0 ? '+' : '−'} ${Math.abs(p + q)}x ${p * q >= 0 ? '+' : '−'} ${Math.abs(p * q)} = 0?`,
      `${q} e ${p}`,
      [`${-q} e ${-p}`, `${p} e ${-q}`, `${q} e ${-p}`, `${p + q} e ${p * q}`],
      `Soma das raízes = ${p + q} e produto = ${p * q}: os números são ${q} e ${p}. (Bhaskara dá o mesmo resultado.)`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(1, 3),
      b = r.int(-8, 8),
      c = r.int(-10, 10);
    return numQ(
      'facil',
      `Qual é o discriminante (Δ) de ${a}x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)} = 0?`,
      b * b - 4 * a * c,
      [b * b + 4 * a * c, b * b - 2 * a * c, -b * b - 4 * a * c],
      `Δ = b² − 4ac = ${b * b} − 4·${a}·(${c}) = ${b * b - 4 * a * c}.`,
      w,
    );
  },
  (r, w) => {
    const k = r.int(2, 12);
    return textQ(
      'facil',
      `Quais são as soluções de x² = ${k * k}?`,
      `${k} e −${k}`,
      [`só ${k}`, `${k * 2} e −${k * 2}`, `${k * k}`, `não tem solução`],
      `x² = ${k * k} → x = ±${k}.`,
      w,
    );
  },
  (r, w) => {
    const p = r.int(2, 9);
    return textQ(
      'medio',
      `Quais são as raízes de x² − ${p}x = 0?`,
      `0 e ${p}`,
      [`só ${p}`, `0 e −${p}`, `${p} e −${p}`, `1 e ${p}`],
      `Coloque x em evidência: x(x − ${p}) = 0 → x = 0 ou x = ${p}.`,
      w,
    );
  },
  (r, w) => {
    const l = r.int(3, 12);
    return numQ(
      'dificil',
      `Um terreno retangular tem comprimento ${3} m maior que a largura e área de ${l * (l + 3)} m². Qual é a largura?`,
      l,
      [l + 3, l * 2, l - 3],
      `x(x + 3) = ${l * (l + 3)} → x² + 3x − ${l * (l + 3)} = 0 → x = ${l} (a raiz negativa não serve para medida).`,
      w,
      (n) => `${fmt(n)} m`,
    );
  },
];
const TRIPLAS = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [6, 8, 10],
  [7, 24, 25],
  [9, 12, 15],
] as const;
const pitagoras9: GenObj[] = [
  (r, w) => {
    const [a, b, c] = r.pick(TRIPLAS);
    return numQ(
      'facil',
      `Um triângulo retângulo tem catetos ${a} cm e ${b} cm. Quanto mede a hipotenusa?`,
      c,
      [a + b, c + 1, Math.abs(b - a) + 1],
      `h² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} → h = ${c} cm.`,
      w,
      (n) => `${fmt(n)} cm`,
    );
  },
  (r, w) => {
    const [a, b, c] = r.pick(TRIPLAS);
    return numQ(
      'medio',
      `Uma escada de ${c} m está apoiada num muro, com o pé a ${a} m da parede. A que altura ela toca o muro?`,
      b,
      [c - a, c + a, a + 2],
      `${c}² = ${a}² + h² → h² = ${c * c - a * a} → h = ${b} m.`,
      w,
      (n) => `${fmt(n)} m`,
    );
  },
  (r, w) => {
    const [a, b, c] = r.pick(TRIPLAS);
    const k = r.int(2, 3);
    return numQ(
      'medio',
      `Uma tela retangular mede ${a * k} por ${b * k} polegadas. Quanto mede a diagonal?`,
      c * k,
      [(a + b) * k, c, c * k + k],
      `d² = ${a * k}² + ${b * k}² = ${(c * k) ** 2} → d = ${c * k} polegadas.`,
      w,
    );
  },
  (r, w) => {
    const l = r.int(2, 9);
    return textQ(
      'dificil',
      `A diagonal de um quadrado de lado ${l} cm mede:`,
      `${l}√2 cm`,
      [`${2 * l} cm`, `${l}√3 cm`, `${l * l} cm`, `${l / 2}√2 cm`],
      `d² = ${l}² + ${l}² = 2·${l * l} → d = ${l}√2 cm.`,
      w,
    );
  },
];
const trigo9: GenObj[] = [
  (r, w) => {
    const h = r.int(2, 12) * 2;
    return numQ(
      'medio',
      `Num triângulo retângulo, a hipotenusa mede ${h} cm e um ângulo agudo mede 30°. Quanto mede o cateto oposto a esse ângulo?`,
      h / 2,
      [h, (h * 3) / 4, h * 2],
      `sen 30° = cateto oposto ÷ hipotenusa = 1/2. Cateto = ${h} × 1/2 = ${h / 2} cm.`,
      w,
      (n) => `${fmt(n)} cm`,
    );
  },
  (r, w) => {
    const d = r.int(5, 40);
    return numQ(
      'medio',
      `De um ponto a ${d} m da base de uma árvore, vê-se o topo sob ângulo de 45°. Qual é a altura da árvore (desprezando a altura dos olhos)?`,
      d,
      [d / 2, d * 2, d + 10],
      `tg 45° = altura ÷ distância = 1 → altura = ${d} m.`,
      w,
      (n) => `${fmt(n)} m`,
    );
  },
  (r, w) => {
    const [a, b, c] = r.pick(TRIPLAS);
    return textQ(
      'facil',
      `Num triângulo retângulo de catetos ${a} e ${b} e hipotenusa ${c}, o seno do ângulo oposto ao cateto ${a} é:`,
      `${a}/${c}`,
      [`${b}/${c}`, `${a}/${b}`, `${c}/${a}`, `${b}/${a}`],
      `Seno = cateto oposto ÷ hipotenusa = ${a}/${c}.`,
      w,
    );
  },
  (r, w) => {
    const ang = r.pick([30, 45, 60]);
    const val = { 30: '1/2', 45: '√2/2', 60: '√3/2' }[ang]!;
    return textQ(
      'facil',
      `Qual é o valor de sen ${ang}°?`,
      val,
      ['1/2', '√2/2', '√3/2', '√3', '1'].filter((x) => x !== val),
      `Ângulos notáveis: sen 30° = 1/2, sen 45° = √2/2, sen 60° = √3/2.`,
      w,
    );
  },
];
const juros9: GenObj[] = [
  (r, w) => {
    const c = r.int(5, 40) * 100,
      i = r.pick([1, 2, 3, 5]),
      t = r.int(2, 12);
    return numQ(
      'facil',
      `Quanto rendem ${brl(c)} a juros simples de ${i}% ao mês durante ${t} meses?`,
      (c * i * t) / 100,
      [(c * i) / 100, c + (c * i * t) / 100, (c * i * t) / 10],
      `J = C × i × t = ${c} × ${i / 100} × ${t} = ${brl((c * i * t) / 100)}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const c = r.int(10, 50) * 100;
    return numQ(
      'medio',
      `Aplicando ${brl(c)} a juros compostos de 10% ao mês, qual é o montante após 2 meses?`,
      c * 1.21,
      [c * 1.2, c * 1.1, c * 0.21],
      `M = C × (1,1)² = ${c} × 1,21 = ${brl(c * 1.21)}. Os juros do 2º mês incidem sobre os juros do 1º.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const c = r.int(5, 20) * 100,
      i = r.pick([2, 4, 5]),
      t = r.int(3, 10);
    return numQ(
      'medio',
      `Qual é o montante de ${brl(c)} a juros simples de ${i}% ao mês por ${t} meses?`,
      c * (1 + (i * t) / 100),
      [(c * i * t) / 100, c * (1 + i / 100), c * (1 + (i * t) / 1000)],
      `J = ${c} × ${i}% × ${t} = ${brl((c * i * t) / 100)}. M = C + J = ${brl(c * (1 + (i * t) / 100))}.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const vista = r.int(10, 30) * 100,
      parcela = Math.round((vista * 1.15) / 10);
    return numQ(
      'dificil',
      `Uma TV custa ${brl(vista)} à vista ou 10 parcelas de ${brl(parcela)}. Quanto se paga a mais no parcelado?`,
      parcela * 10 - vista,
      [parcela * 10, parcela, vista * 0.1],
      `Parcelado: 10 × ${brl(parcela)} = ${brl(parcela * 10)}. Diferença: ${brl(parcela * 10 - vista)}.`,
      w,
      brl,
    );
  },
];
const disc9: GenDisc[] = [
  (r) => {
    const [a, b, c] = r.pick(TRIPLAS);
    return discQ(
      'medio',
      `Uma rampa sobe ${a} m de altura e avança ${b} m na horizontal. Qual é o comprimento da rampa? Mostre o uso do Teorema de Pitágoras.`,
      `Comprimento² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} → comprimento = ${c} m.`,
      ['Identifica catetos e hipotenusa', 'Aplica a² + b² = c²', `Chega a ${c} m`],
    );
  },
  (r) => {
    const p = r.int(1, 8),
      q = -r.int(1, 6);
    return discQ(
      'medio',
      `Resolva x² ${-(p + q) >= 0 ? '+' : '−'} ${Math.abs(p + q)}x ${p * q >= 0 ? '+' : '−'} ${Math.abs(p * q)} = 0 por Bhaskara, mostrando Δ e as raízes.`,
      `Δ = ${(p + q) ** 2} − 4·1·(${p * q}) = ${(p - q) ** 2}. √Δ = ${Math.abs(p - q)}. x = (${p + q} ± ${Math.abs(p - q)})/2 → x = ${p} ou x = ${q}.`,
      ['Calcula Δ corretamente', 'Aplica a fórmula de Bhaskara', `Chega às raízes ${p} e ${q}`],
    );
  },
  (r) => {
    const c = r.int(10, 30) * 100;
    return discQ(
      'dificil',
      `Compare: aplicar ${brl(c)} por 2 meses a 10% ao mês em juros simples e em juros compostos. Qual rende mais e por quê?`,
      `Simples: J = ${c} × 0,10 × 2 = ${brl(c * 0.2)}. Compostos: M = ${c} × 1,21 = ${brl(c * 1.21)}, J = ${brl(c * 0.21)}. Compostos rendem ${brl(c * 0.01)} a mais, porque o juro do 2º mês incide também sobre o juro do 1º.`,
      [
        'Calcula os juros simples',
        'Calcula os juros compostos',
        'Explica a diferença (juros sobre juros)',
      ],
    );
  },
];

// ---------------------------------------------------------------- 1ª série EM
const afim1: GenObj[] = [
  (r, w) => {
    const a = r.int(-5, 6) || 2,
      b = r.int(-9, 9),
      x = r.int(-4, 6);
    return numQ(
      'facil',
      `Dada f(x) = ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}, quanto vale f(${x})?`,
      a * x + b,
      [a + x + b, a * x - b, a * (x + b)],
      `f(${x}) = ${a}·(${x}) ${b >= 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x + b}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.pick([2, 3, 4, 5, -2, -4]),
      raiz = r.int(-5, 6);
    const b = -a * raiz;
    return numQ(
      'medio',
      `Qual é o zero (raiz) da função f(x) = ${a}x ${b >= 0 ? '+' : '−'} ${Math.abs(b)}?`,
      raiz,
      [-raiz, b, b / 2],
      `f(x) = 0 → ${a}x = ${-b} → x = ${raiz}.`,
      w,
    );
  },
  (r, w) => {
    const x1 = r.int(0, 3),
      y1 = r.int(-3, 5),
      a = r.int(-3, 4) || 1,
      x2 = x1 + r.int(1, 4);
    const y2 = y1 + a * (x2 - x1);
    return numQ(
      'medio',
      `Uma reta passa por (${x1}, ${y1}) e (${x2}, ${y2}). Qual é o coeficiente angular?`,
      a,
      [-a, (x2 - x1) / (y2 - y1 || 1), y2 - y1],
      `a = Δy ÷ Δx = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${a}.`,
      w,
    );
  },
  (r, w) => {
    const fixo = r.int(3, 8),
      km = r.int(2, 5),
      d = r.int(5, 25);
    return numQ(
      'facil',
      `Um táxi cobra R$ ${fixo},00 de bandeirada mais R$ ${km},00 por km. Quanto custa uma corrida de ${d} km?`,
      fixo + km * d,
      [km * d, (fixo + km) * d, fixo * d + km],
      `Preço = ${fixo} + ${km} × ${d} = R$ ${fixo + km * d},00.`,
      w,
      brl,
    );
  },
  (r, w) => {
    const a = r.pick([-3, -2, 2, 3]);
    return textQ(
      'facil',
      `A função f(x) = ${a}x + 1 é:`,
      a > 0 ? 'crescente, porque a > 0' : 'decrescente, porque a < 0',
      [
        'crescente, porque a > 0',
        'decrescente, porque a < 0',
        'constante',
        'crescente, porque b > 0',
      ],
      `O sinal do coeficiente angular decide: a = ${a} ${a > 0 ? '> 0 → crescente' : '< 0 → decrescente'}.`,
      w,
    );
  },
];
const quadratica1: GenObj[] = [
  (r, w) => {
    const xv = r.int(-4, 5),
      k = r.int(-6, 6);
    const b = -2 * xv,
      c = xv * xv + k;
    return numQ(
      'medio',
      `Qual é o x do vértice da parábola f(x) = x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}?`,
      xv,
      [-xv, b, k],
      `xv = −b ÷ 2a = ${-b} ÷ 2 = ${xv}.`,
      w,
    );
  },
  (r, w) => {
    const xv = r.int(-4, 5),
      k = r.int(-6, 6);
    const b = -2 * xv,
      c = xv * xv + k;
    return numQ(
      'dificil',
      `Qual é o valor mínimo de f(x) = x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}?`,
      k,
      [c, xv, -k],
      `Mínimo = yv = f(xv). xv = −b ÷ 2a = ${xv}; f(${xv}) = (${xv})² + (${b})·(${xv}) + (${c}) = ${k}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.pick([-1, 1, 2, -2]);
    return textQ(
      'facil',
      `O gráfico de f(x) = ${a}x² + 3x − 1 é uma parábola com concavidade voltada para:`,
      a > 0 ? 'cima' : 'baixo',
      ['cima', 'baixo', 'a direita', 'a esquerda'],
      `a = ${a} ${a > 0 ? '> 0: concavidade para cima' : '< 0: concavidade para baixo'}.`,
      w,
    );
  },
  (r, w) => {
    const x = r.int(-3, 4),
      b = r.int(-5, 5),
      c = r.int(-6, 6);
    return numQ(
      'facil',
      `Para f(x) = x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)}, quanto vale f(${x})?`,
      x * x + b * x + c,
      [-(x * x) + b * x + c, x * x - b * x + c, 2 * x + b + c],
      `f(${x}) = (${x})² + (${b})·(${x}) + (${c}) = ${x * x + b * x + c}.`,
      w,
    );
  },
];
const explog1: GenObj[] = [
  (r, w) => {
    const b = r.pick([2, 3, 5, 10]),
      n = r.int(2, 5);
    return numQ(
      'facil',
      `Quanto vale log de ${(b ** n).toLocaleString('pt-BR')} na base ${b}?`,
      n,
      [b ** n / b, n + 1, b * n],
      `${b}^${n} = ${(b ** n).toLocaleString('pt-BR')}, então o logaritmo é ${n}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(3, 10);
    return numQ(
      'facil',
      `Resolva 2^x = ${2 ** n}.`,
      n,
      [2 ** n / 2, n - 1, n + 1],
      `${2 ** n} = 2^${n}, então x = ${n}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(1, 4),
      b = r.int(1, 4);
    return numQ(
      'medio',
      `Sabendo que log 2 ≈ 0,30 e log 3 ≈ 0,48, quanto vale log ${2 ** a * 3 ** b}?`,
      a * 0.3 + b * 0.48,
      [0.3 * 0.48 * a * b, a * 0.3 * b * 0.48 + 1, (a + b) * 0.3],
      `${2 ** a * 3 ** b} = 2^${a} × 3^${b}. log = ${a}·0,30 + ${b}·0,48 = ${fmt(a * 0.3 + b * 0.48)}.`,
      w,
    );
  },
  (r, w) => {
    const ini = r.int(2, 9) * 100,
      h = r.int(2, 5);
    return numQ(
      'medio',
      `Uma cultura de bactérias dobra a cada hora. Começando com ${ini}, quantas haverá após ${h} horas?`,
      ini * 2 ** h,
      [ini * 2 * h, ini + 2 ** h, ini * 2 ** (h - 1)],
      `N = ${ini} × 2^${h} = ${(ini * 2 ** h).toLocaleString('pt-BR')}. (Crescimento exponencial, não linear.)`,
      w,
      (n) => n.toLocaleString('pt-BR'),
    );
  },
];
const progressoes1: GenObj[] = [
  (r, w) => {
    const a1 = r.int(-5, 10),
      q = r.int(2, 7),
      n = r.int(8, 25);
    return numQ(
      'facil',
      `Numa PA, o 1º termo é ${a1} e a razão é ${q}. Qual é o ${n}º termo?`,
      a1 + (n - 1) * q,
      [a1 + n * q, a1 * q * n, (n - 1) * q],
      `aₙ = a₁ + (n − 1)·r = ${a1} + ${n - 1}·${q} = ${a1 + (n - 1) * q}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(10, 100);
    return numQ(
      'medio',
      `Quanto é a soma 1 + 2 + 3 + ... + ${n}?`,
      (n * (n + 1)) / 2,
      [n * n, (n * (n - 1)) / 2, n * (n + 1)],
      `Soma da PA: (a₁ + aₙ)·n ÷ 2 = (1 + ${n})·${n} ÷ 2 = ${((n * (n + 1)) / 2).toLocaleString('pt-BR')}.`,
      w,
      (x) => x.toLocaleString('pt-BR'),
    );
  },
  (r, w) => {
    const a1 = r.int(1, 5),
      q = r.pick([2, 3]),
      n = r.int(4, 7);
    return numQ(
      'medio',
      `Numa PG, a₁ = ${a1} e a razão é ${q}. Qual é o ${n}º termo?`,
      a1 * q ** (n - 1),
      [a1 * q ** n, a1 + (n - 1) * q, a1 * q * n],
      `aₙ = a₁·q^(n−1) = ${a1}·${q}^${n - 1} = ${a1 * q ** (n - 1)}.`,
      w,
    );
  },
  (r, w) => {
    const a1 = r.int(20, 50),
      q = r.int(3, 8);
    return textQ(
      'facil',
      `A sequência ${a1}, ${a1 + q}, ${a1 + 2 * q}, ${a1 + 3 * q}, … é uma:`,
      `PA de razão ${q}`,
      [`PG de razão ${q}`, `PA de razão ${a1}`, `PG de razão 2`, `sequência sem padrão`],
      `Cada termo soma ${q} ao anterior: PA de razão ${q}.`,
      w,
    );
  },
];
const disc1: GenDisc[] = [
  (r) => {
    const fixo = r.int(20, 60),
      por = r.int(2, 6);
    return discQ(
      'medio',
      `Uma academia cobra R$ ${fixo},00 de matrícula mais R$ ${por * 10},00 por mês. Escreva a função do gasto total G(m) em m meses e calcule o gasto em um ano.`,
      `G(m) = ${fixo} + ${por * 10}m. G(12) = ${fixo} + ${por * 10 * 12} = R$ ${fixo + por * 120},00.`,
      [
        'Escreve a função afim corretamente',
        'Substitui m = 12',
        `Chega a R$ ${fixo + por * 120},00`,
      ],
    );
  },
  (r) => {
    const a1 = r.int(2, 6) * 5,
      q = r.int(2, 5) * 5;
    return discQ(
      'medio',
      `Uma pessoa guarda R$ ${a1},00 no 1º mês e, a cada mês, R$ ${q},00 a mais que no mês anterior. Quanto terá guardado ao fim de 12 meses? Use a soma da PA.`,
      `a₁₂ = ${a1} + 11·${q} = ${a1 + 11 * q}. S₁₂ = (${a1} + ${a1 + 11 * q})·12 ÷ 2 = R$ ${((a1 + a1 + 11 * q) * 12) / 2},00.`,
      [
        'Identifica PA (a₁ e razão)',
        'Calcula o 12º termo',
        `Usa a fórmula da soma e chega a R$ ${((a1 + a1 + 11 * q) * 12) / 2},00`,
      ],
    );
  },
  (r) => {
    const xv = r.int(2, 6);
    return discQ(
      'dificil',
      `A altura de uma bola, em metros, é h(t) = −t² + ${2 * xv}t, com t em segundos. Em que instante ela atinge a altura máxima e qual é essa altura? Justifique.`,
      `É uma parábola com a < 0 (máximo no vértice). tv = −b ÷ 2a = ${2 * xv} ÷ 2 = ${xv} s. h(${xv}) = −${xv * xv} + ${2 * xv * xv} = ${xv * xv} m.`,
      ['Justifica que o máximo está no vértice', `Calcula t = ${xv} s`, `Calcula h = ${xv * xv} m`],
    );
  },
];

// ---------------------------------------------------------------- 2ª série EM
const combinatoria2: GenObj[] = [
  (r, w) => {
    const n = r.int(4, 7);
    return numQ(
      'facil',
      `De quantas maneiras ${n} pessoas podem se sentar em ${n} cadeiras enfileiradas?`,
      fat(n),
      [n * n, n * (n - 1), fat(n - 1)],
      `Permutação simples: ${n}! = ${fat(n)}.`,
      w,
      (x) => x.toLocaleString('pt-BR'),
    );
  },
  (r, w) => {
    const n = r.int(6, 12),
      k = r.pick([2, 3]);
    return numQ(
      'medio',
      `Numa corrida com ${n} atletas, de quantas formas pode ficar o pódio (1º, 2º${k === 3 ? ' e 3º' : ''} lugares)?`,
      arr(n, k),
      [comb(n, k), n * k, n ** k],
      `A ordem importa: arranjo A(${n},${k}) = ${arr(n, k)}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(6, 12),
      k = r.pick([2, 3]);
    return numQ(
      'medio',
      `De quantas formas se escolhe uma comissão de ${k} pessoas entre ${n}?`,
      comb(n, k),
      [arr(n, k), n * k, comb(n, k) * 2],
      `A ordem NÃO importa: C(${n},${k}) = ${n}! ÷ (${k}!·${n - k}!) = ${comb(n, k)}.`,
      w,
    );
  },
  (r, w) => {
    const word = r.pick(['AMOR', 'LIVRO', 'NEXA', 'PROVA', 'CAMPO']);
    return numQ(
      'facil',
      `Quantos anagramas tem a palavra ${word}?`,
      fat(word.length),
      [word.length ** 2, fat(word.length - 1), word.length * 2],
      `${word.length} letras distintas: ${word.length}! = ${fat(word.length)}.`,
      w,
    );
  },
  (r, w) => {
    const c = r.int(2, 5),
      s = r.int(2, 4),
      t = r.int(2, 4);
    return numQ(
      'facil',
      `Uma pessoa tem ${c} camisetas, ${s} calças e ${t} tênis. Quantos looks diferentes pode montar com uma peça de cada?`,
      c * s * t,
      [c + s + t, c * s + t, c * s],
      `Princípio multiplicativo: ${c} × ${s} × ${t} = ${c * s * t}.`,
      w,
    );
  },
];
const probabilidade2: GenObj[] = [
  (r, w) => {
    const v = r.int(2, 6),
      a = r.int(2, 6);
    const t = v + a;
    return fracQ(
      'dificil',
      `Uma urna tem ${v} bolas vermelhas e ${a} azuis. Retirando 2 SEM reposição, qual é a probabilidade de ambas serem vermelhas?`,
      [v * (v - 1), t * (t - 1)],
      [
        [v * v, t * t],
        [v, t],
        [v - 1, t - 1],
        [2 * v, t * (t - 1)],
        [1, t],
      ],
      `P = (${v}/${t}) × (${v - 1}/${t - 1}) = ${v * (v - 1)}/${t * (t - 1)} = ${fracao(v * (v - 1), t * (t - 1))}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(2, 4);
    return fracQ(
      'medio',
      `Lançando uma moeda ${n} vezes, qual é a probabilidade de sair cara em todas?`,
      [1, 2 ** n],
      [
        [1, 2 * n],
        [n, 2 ** n],
        [1, 2],
        [1, 2 ** (n + 1)],
        [1, n],
      ],
      `Eventos independentes: (1/2)^${n} = 1/${2 ** n}.`,
      w,
    );
  },
  (r, w) => {
    const total = r.pick([20, 25, 40, 50]),
      x = r.int(2, total / 2);
    return fracQ(
      'facil',
      `Num sorteio entre os números de 1 a ${total}, qual é a probabilidade de sair um número menor ou igual a ${x}?`,
      [x, total],
      [
        [1, total],
        [x, total - x],
        [total - x, total],
        [x + 1, total],
        [x - 1, total],
      ],
      `Casos favoráveis: ${x}; possíveis: ${total}. P = ${x}/${total}${fracao(x, total) !== `${x}/${total}` ? ` = ${fracao(x, total)}` : ''}.`,
      w,
    );
  },
  (r, w) => {
    const p = r.pick([10, 20, 30, 40]);
    return numQ(
      'medio',
      `A chance de chover amanhã é ${p}%. Qual é a probabilidade de NÃO chover?`,
      100 - p,
      [p, 100 + p, p / 2],
      `Evento complementar: 100% − ${p}% = ${100 - p}%.`,
      w,
      (n) => `${fmt(n)}%`,
    );
  },
];
const matrizes2: GenObj[] = [
  (r, w) => {
    const a = r.int(-4, 6),
      b = r.int(-4, 6),
      c = r.int(-4, 6),
      d = r.int(-4, 6);
    return numQ(
      'facil',
      `Qual é o determinante da matriz [[${a}, ${b}], [${c}, ${d}]]?`,
      a * d - b * c,
      [a * d + b * c, a * c - b * d, a + d - b - c],
      `det = a·d − b·c = ${a}·${d} − ${b}·${c} = ${a * d - b * c}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(1, 5),
      b = r.int(1, 5),
      c = r.int(1, 5),
      d = r.int(1, 5);
    return numQ(
      'medio',
      `Sendo A = [${a}  ${b}] (1×2) e B = [${c}; ${d}] (2×1), qual é o único elemento de A·B?`,
      a * c + b * d,
      [a * d + b * c, a * b * c * d, a + b + c + d],
      `Linha × coluna: ${a}·${c} + ${b}·${d} = ${a * c + b * d}.`,
      w,
    );
  },
  (r, w) => {
    const k = r.int(2, 4),
      a = r.int(1, 5),
      b = r.int(1, 5),
      c = r.int(1, 5),
      d = r.int(1, 5);
    const det = a * d - b * c;
    return numQ(
      'dificil',
      `Se det de [[${a}, ${b}], [${c}, ${d}]] é ${det}, qual é o determinante de ${k} vezes essa matriz (2×2)?`,
      k * k * det,
      [k * det, det, k ** 3 * det],
      `Multiplicar uma matriz n×n por k multiplica o determinante por kⁿ: ${k}² × ${det} = ${k * k * det}.`,
      w,
    );
  },
  (r, w) => {
    const m = r.int(2, 4),
      n = r.int(2, 5);
    return numQ(
      'facil',
      `Quantos elementos tem uma matriz ${m} × ${n}?`,
      m * n,
      [m + n, m * n + 1, 2 * (m + n)],
      `Linhas × colunas = ${m} × ${n} = ${m * n}.`,
      w,
    );
  },
];
const espacial2: GenObj[] = [
  (r, w) => {
    const a = r.int(2, 9);
    return numQ(
      'facil',
      `Qual é o volume de um cubo de aresta ${a} cm?`,
      a ** 3,
      [a * a, 6 * a * a, 3 * a],
      `V = a³ = ${a}³ = ${a ** 3} cm³.`,
      w,
      (n) => `${fmt(n)} cm³`,
    );
  },
  (r, w) => {
    const raio = r.int(1, 6),
      h = r.int(2, 10);
    return numQ(
      'medio',
      `Um cilindro tem raio ${raio} m e altura ${h} m. Usando π = 3, qual é o volume?`,
      3 * raio * raio * h,
      [3 * 2 * raio * h, 3 * raio * h, 3 * raio * raio],
      `V = π·r²·h = 3·${raio * raio}·${h} = ${3 * raio * raio * h} m³.`,
      w,
      (n) => `${fmt(n)} m³`,
    );
  },
  (r, w) => {
    const a = r.int(2, 8),
      b = r.int(2, 8),
      c = r.int(2, 8);
    return numQ(
      'facil',
      `Uma caixa d'água em forma de paralelepípedo mede ${a} m × ${b} m × ${c} m. Quantos litros cabem? (1 m³ = 1.000 L)`,
      a * b * c * 1000,
      [a * b * c, (a + b + c) * 1000, a * b * c * 100],
      `V = ${a}·${b}·${c} = ${a * b * c} m³ = ${(a * b * c * 1000).toLocaleString('pt-BR')} L.`,
      w,
      (n) => `${n.toLocaleString('pt-BR')} L`,
    );
  },
  (r, w) => {
    const raio = r.int(1, 5),
      h = r.int(3, 12);
    return numQ(
      'dificil',
      `Um cone tem raio ${raio} cm e altura ${h} cm. Usando π = 3, qual é o volume?`,
      raio * raio * h,
      [3 * raio * raio * h, (3 * raio * h) / 3, raio * h],
      `V = (π·r²·h) ÷ 3 = (3·${raio * raio}·${h}) ÷ 3 = ${raio * raio * h} cm³.`,
      w,
      (n) => `${fmt(n)} cm³`,
    );
  },
];
const disc2: GenDisc[] = [
  (r) => {
    const n = r.int(7, 12);
    return discQ(
      'medio',
      `Uma turma de ${n} alunos vai escolher presidente e vice (cargos diferentes) e, depois, uma comissão de 3 pessoas para a festa. Calcule as duas quantidades e explique por que uma usa arranjo e a outra combinação.`,
      `Presidente e vice: a ordem importa, A(${n},2) = ${arr(n, 2)}. Comissão: a ordem não importa, C(${n},3) = ${comb(n, 3)}.`,
      [
        `Calcula A(${n},2) = ${arr(n, 2)}`,
        `Calcula C(${n},3) = ${comb(n, 3)}`,
        'Explica a diferença: ordem importa (arranjo) ou não (combinação)',
      ],
    );
  },
  (r) => {
    const raio = r.int(2, 5),
      h = r.int(5, 12);
    return discQ(
      'medio',
      `Um copo cilíndrico tem raio ${raio} cm e altura ${h} cm. Usando π = 3, quantos mL cabem nele? (1 cm³ = 1 mL) Mostre a fórmula.`,
      `V = π·r²·h = 3·${raio * raio}·${h} = ${3 * raio * raio * h} cm³ = ${3 * raio * raio * h} mL.`,
      [
        'Usa V = π·r²·h',
        'Calcula corretamente com π = 3',
        `Converte para ${3 * raio * raio * h} mL`,
      ],
    );
  },
];

// ---------------------------------------------------------------- 3ª série EM
const analitica3: GenObj[] = [
  (r, w) => {
    const [a, b, c] = r.pick(TRIPLAS);
    const x1 = r.int(-3, 3),
      y1 = r.int(-3, 3);
    return numQ(
      'medio',
      `Qual é a distância entre os pontos A(${x1}, ${y1}) e B(${x1 + a}, ${y1 + b})?`,
      c,
      [a + b, c * c, Math.abs(a - b)],
      `d = √((Δx)² + (Δy)²) = √(${a * a} + ${b * b}) = ${c}.`,
      w,
    );
  },
  (r, w) => {
    const x1 = r.int(-6, 6) * 2,
      y1 = r.int(-6, 6) * 2,
      x2 = r.int(-6, 6) * 2,
      y2 = r.int(-6, 6) * 2;
    return textQ(
      'facil',
      `Qual é o ponto médio do segmento de A(${x1}, ${y1}) a B(${x2}, ${y2})?`,
      `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`,
      [
        `(${x1 + x2}, ${y1 + y2})`,
        `(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`,
        `(${(x1 + y1) / 2}, ${(x2 + y2) / 2})`,
        `(${(x1 + x2) / 2 + 1}, ${(y1 + y2) / 2})`,
      ],
      `M = ((x₁ + x₂)/2, (y₁ + y₂)/2) = (${(x1 + x2) / 2}, ${(y1 + y2) / 2}).`,
      w,
    );
  },
  (r, w) => {
    const m = r.int(-4, 5) || 3,
      n = r.int(-6, 6);
    return textQ(
      'medio',
      `Qual é a equação da reta de coeficiente angular ${m} que passa por (0, ${n})?`,
      `y = ${m}x ${n >= 0 ? '+' : '−'} ${Math.abs(n)}`,
      [
        `y = ${n}x ${m >= 0 ? '+' : '−'} ${Math.abs(m)}`,
        `y = ${-m}x ${n >= 0 ? '+' : '−'} ${Math.abs(n)}`,
        `y = ${m}x ${n >= 0 ? '−' : '+'} ${Math.abs(n)}`,
        `x = ${m}y + ${n}`,
      ],
      `Forma reduzida y = mx + n, com m = ${m} e n = ${n} (onde corta o eixo y).`,
      w,
    );
  },
  (r, w) => {
    const m = r.pick([2, 3, -2, 4, -3]);
    const inv = (x: number) => (x > 0 ? `1/${x}` : `−1/${-x}`);
    return textQ(
      'dificil',
      `Uma reta é perpendicular a outra de coeficiente angular ${m}. O coeficiente angular dela é:`,
      inv(-m),
      [`${m}`, `${-m}`, inv(m), '1', '0'],
      `Retas perpendiculares: m₁·m₂ = −1 → m₂ = −1/(${m}) = ${inv(-m)}.`,
      w,
    );
  },
];
const estatistica3: GenObj[] = [
  (r, w) => {
    const ns = Array.from({ length: 5 }, () => r.int(1, 20)).sort((a, b) => a - b);
    return numQ(
      'facil',
      `Qual é a mediana de ${[...ns].reverse().join(', ')}?`,
      ns[2]!,
      [ns.reduce((a, b) => a + b, 0) / 5, ns[1]!, ns[3]!],
      `Ordenando: ${ns.join(', ')}. O termo do meio é ${ns[2]}.`,
      w,
    );
  },
  (r, w) => {
    const ns = Array.from({ length: 6 }, () => r.int(1, 15)).sort((a, b) => a - b);
    return numQ(
      'medio',
      `Qual é a mediana de ${ns.join(', ')}?`,
      (ns[2]! + ns[3]!) / 2,
      [ns[2]!, ns[3]!, ns.reduce((a, b) => a + b, 0) / 6],
      `Com 6 valores, a mediana é a média dos dois centrais: (${ns[2]} + ${ns[3]}) ÷ 2 = ${fmt((ns[2]! + ns[3]!) / 2)}.`,
      w,
    );
  },
  (r, w) => {
    const ns = Array.from({ length: 5 }, () => r.int(2, 30));
    return numQ(
      'facil',
      `Qual é a amplitude do conjunto ${ns.join(', ')}?`,
      Math.max(...ns) - Math.min(...ns),
      [Math.max(...ns), Math.max(...ns) + Math.min(...ns), ns.reduce((a, b) => a + b, 0) / 5],
      `Amplitude = maior − menor = ${Math.max(...ns)} − ${Math.min(...ns)} = ${Math.max(...ns) - Math.min(...ns)}.`,
      w,
    );
  },
  (r, w) => {
    const p1 = r.int(5, 9),
      p2 = r.int(4, 9),
      w1 = r.int(1, 3),
      w2 = r.int(2, 4);
    return numQ(
      'medio',
      `Uma nota final tem prova (peso ${w2}) e trabalho (peso ${w1}). Quem tirou ${p2} na prova e ${p1} no trabalho ficou com média ponderada de:`,
      (p2 * w2 + p1 * w1) / (w1 + w2),
      [(p1 + p2) / 2, (p2 * w2 + p1 * w1) / 2, (p2 * w1 + p1 * w2) / (w1 + w2)],
      `(${p2}·${w2} + ${p1}·${w1}) ÷ ${w1 + w2} = ${fmt((p2 * w2 + p1 * w1) / (w1 + w2))}.`,
      w,
    );
  },
];
const complexos3: GenObj[] = [
  (r, w) => {
    const a = r.int(-5, 6),
      b = r.int(-5, 6),
      c = r.int(-5, 6),
      d = r.int(-5, 6);
    const s = (x: number, y: number) => `${x} ${y >= 0 ? '+' : '−'} ${Math.abs(y)}i`;
    return textQ(
      'facil',
      `Quanto é (${s(a, b)}) + (${s(c, d)})?`,
      s(a + c, b + d),
      [s(a + d, b + c), s(a * c, b * d), s(a - c, b - d), s(a + c, b - d)],
      `Soma parte real com real e imaginária com imaginária: ${s(a + c, b + d)}.`,
      w,
    );
  },
  (r, w) => {
    const [a, b, c] = r.pick(TRIPLAS);
    return numQ(
      'medio',
      `Qual é o módulo do número complexo z = ${a} + ${b}i?`,
      c,
      [a + b, c * c, b],
      `|z| = √(${a}² + ${b}²) = √${c * c} = ${c}.`,
      w,
    );
  },
  (r, w) => {
    const n = r.int(2, 30);
    const res = ['1', 'i', '−1', '−i'][n % 4]!;
    return textQ(
      'medio',
      `Quanto vale i^${n}?`,
      res,
      ['1', 'i', '−1', '−i'].filter((x) => x !== res),
      `As potências de i se repetem de 4 em 4. ${n} ÷ 4 deixa resto ${n % 4}, então i^${n} = i^${n % 4} = ${res}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(1, 5),
      b = r.int(1, 5);
    return textQ(
      'dificil',
      `Quanto é (${a} + ${b}i)(${a} − ${b}i)?`,
      `${a * a + b * b}`,
      [`${a * a - b * b}`, `${a * a - b * b} + ${2 * a * b}i`, `${a * a} − ${b * b}i`, `${2 * a}`],
      `Produto pelo conjugado: a² + b² = ${a * a} + ${b * b} = ${a * a + b * b} (i² = −1).`,
      w,
    );
  },
];
const polinomios3: GenObj[] = [
  (r, w) => {
    const a = r.int(1, 3),
      b = r.int(-5, 5),
      c = r.int(-5, 5),
      d = r.int(-9, 9),
      k = r.int(-2, 3);
    const v = a * k ** 3 + b * k * k + c * k + d;
    return numQ(
      'facil',
      `Qual é o valor de P(${k}) para P(x) = ${a}x³ ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x² ${c >= 0 ? '+' : '−'} ${Math.abs(c)}x ${d >= 0 ? '+' : '−'} ${Math.abs(d)}?`,
      v,
      [v + 2 * d === v ? v + 1 : v - 2 * d, a * k * 3 + b * k * 2 + c * k + d, -v],
      `Substitua x = ${k}: ${a}·(${k})³ + (${b})·(${k})² + (${c})·(${k}) + (${d}) = ${v}.`,
      w,
    );
  },
  (r, w) => {
    const x1 = r.int(-4, 5),
      x2 = r.int(-4, 5),
      x3 = r.int(-4, 5);
    const b = -(x1 + x2 + x3);
    return numQ(
      'medio',
      `As raízes de x³ ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x² + … = 0 têm soma igual a:`,
      x1 + x2 + x3,
      [b, x1 * x2 * x3, -(x1 + x2 + x3) * 2 || 7],
      `Relação de Girard: soma das raízes = −b/a = ${x1 + x2 + x3}.`,
      w,
    );
  },
  (r, w) => {
    const a = r.int(-3, 3),
      b = r.int(-5, 5),
      c = r.int(-6, 6);
    return numQ(
      'medio',
      `Qual é o resto da divisão de P(x) = x² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}x ${c >= 0 ? '+' : '−'} ${Math.abs(c)} por (x ${a >= 0 ? '−' : '+'} ${Math.abs(a)})?`,
      a * a + b * a + c,
      [c, -(a * a + b * a + c), a * a - b * a + c],
      `Teorema do resto: o resto é P(${a}) = (${a})² + (${b})·(${a}) + (${c}) = ${a * a + b * a + c}.`,
      w,
    );
  },
  (r, w) => {
    const g = r.int(3, 7);
    return numQ(
      'facil',
      `Qual é o grau do polinômio P(x) = 2x^${g} − x^${g - 1} + 5?`,
      g,
      [g - 1, g + 1, 3],
      `O grau é o maior expoente com coeficiente não nulo: ${g}.`,
      w,
    );
  },
];
const disc3: GenDisc[] = [
  (r) => {
    const [a, b, c] = r.pick(TRIPLAS);
    return discQ(
      'medio',
      `Um aplicativo mostra A(0, 0) como a escola e B(${a}, ${b}) como a casa de um aluno (unidades em km). Calcule a distância em linha reta e o ponto médio do trajeto.`,
      `d = √(${a}² + ${b}²) = √${c * c} = ${c} km. Ponto médio: (${fmt(a / 2)}, ${fmt(b / 2)}).`,
      [
        'Usa a fórmula da distância',
        `Chega a ${c} km`,
        `Calcula o ponto médio (${fmt(a / 2)}, ${fmt(b / 2)})`,
      ],
    );
  },
  (r) => {
    const ns = Array.from({ length: 6 }, () => r.int(4, 10)).sort((a, b) => a - b);
    const media = ns.reduce((x, y) => x + y, 0) / 6;
    return discQ(
      'medio',
      `As notas de uma turma pequena foram ${ns.join(', ')}. Calcule média e mediana e diga qual representa melhor a turma se uma nota fosse trocada por 0. Justifique.`,
      `Média = ${fmt(media)}; mediana = (${ns[2]} + ${ns[3]}) ÷ 2 = ${fmt((ns[2]! + ns[3]!) / 2)}. Com um 0, a média cai muito e a mediana quase não muda: a mediana é menos sensível a valores extremos.`,
      ['Calcula a média', 'Calcula a mediana', 'Explica que a mediana resiste a valores extremos'],
    );
  },
];

export const MATEMATICA_G2: SerieGen[] = [
  {
    subject: 'matematica',
    grade: '6º ano',
    disc: disc6,
    temas: [
      { id: 'expressoes', tema: 'Números naturais, expressões, MMC e MDC', gens: expressoes },
      { id: 'fracoes', tema: 'Frações', gens: fracoes6 },
      { id: 'decimais', tema: 'Números decimais e dinheiro', gens: decimais6 },
      { id: 'areas', tema: 'Perímetro e área', gens: area6 },
    ],
  },
  {
    subject: 'matematica',
    grade: '7º ano',
    disc: disc7,
    temas: [
      { id: 'inteiros', tema: 'Números inteiros', gens: inteiros7 },
      { id: 'equacoes', tema: 'Equações do 1º grau', gens: equacoes7 },
      { id: 'razao', tema: 'Razão, proporção e regra de três', gens: razao7 },
      { id: 'porcentagem', tema: 'Porcentagem', gens: porcentagem7 },
    ],
  },
  {
    subject: 'matematica',
    grade: '8º ano',
    disc: disc8,
    temas: [
      { id: 'potencias', tema: 'Potências, raízes e notação científica', gens: potencias8 },
      { id: 'algebra', tema: 'Expressões algébricas e produtos notáveis', gens: algebra8 },
      { id: 'sistemas', tema: 'Sistemas de equações', gens: sistemas8 },
      { id: 'estatistica', tema: 'Probabilidade e estatística', gens: estatistica8 },
    ],
  },
  {
    subject: 'matematica',
    grade: '9º ano',
    disc: disc9,
    temas: [
      { id: 'segundo-grau', tema: 'Equações do 2º grau', gens: segundoGrau9 },
      { id: 'pitagoras', tema: 'Teorema de Pitágoras', gens: pitagoras9 },
      { id: 'trigonometria', tema: 'Trigonometria no triângulo retângulo', gens: trigo9 },
      { id: 'juros', tema: 'Juros simples e compostos', gens: juros9 },
    ],
  },
  {
    subject: 'matematica',
    grade: '1ª série EM',
    disc: disc1,
    temas: [
      { id: 'afim', tema: 'Função afim', gens: afim1 },
      { id: 'quadratica', tema: 'Função quadrática', gens: quadratica1 },
      { id: 'exp-log', tema: 'Exponencial e logaritmo', gens: explog1 },
      { id: 'progressoes', tema: 'Progressões (PA e PG)', gens: progressoes1 },
    ],
  },
  {
    subject: 'matematica',
    grade: '2ª série EM',
    disc: disc2,
    temas: [
      { id: 'combinatoria', tema: 'Análise combinatória', gens: combinatoria2 },
      { id: 'probabilidade', tema: 'Probabilidade', gens: probabilidade2 },
      { id: 'matrizes', tema: 'Matrizes e determinantes', gens: matrizes2 },
      { id: 'espacial', tema: 'Geometria espacial', gens: espacial2 },
    ],
  },
  {
    subject: 'matematica',
    grade: '3ª série EM',
    disc: disc3,
    temas: [
      { id: 'analitica', tema: 'Geometria analítica', gens: analitica3 },
      { id: 'estatistica', tema: 'Estatística', gens: estatistica3 },
      { id: 'complexos', tema: 'Números complexos', gens: complexos3 },
      { id: 'polinomios', tema: 'Polinômios', gens: polinomios3 },
    ],
  },
];

/** Geradores reaproveitados nos simulados de vestibular (ENEM, ITA, IME). */
export const GEN_MAT = {
  porcentagem: porcentagem7,
  razao: razao7,
  estatistica: [...estatistica8, ...estatistica3],
  areas: area6,
  espacial: espacial2,
  afim: afim1,
  quadratica: quadratica1,
  explog: explog1,
  progressoes: progressoes1,
  combinatoria: combinatoria2,
  probabilidade: probabilidade2,
  complexos: complexos3,
  polinomios: polinomios3,
  analitica: analitica3,
  juros: juros9,
  pitagoras: pitagoras9,
};

/** Discursivas de Matemática reaproveitadas nos simulados de vestibular. */
export const DISC_MAT = {
  medio: [...disc1, ...disc2, ...disc3],
  basico: [...disc7, ...disc8, ...disc9],
};
