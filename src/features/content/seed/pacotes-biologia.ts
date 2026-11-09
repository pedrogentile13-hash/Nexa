import { q, type PacoteSeed } from './helpers';

export const BIOLOGIA: PacoteSeed[] = [
  {
    topic: 'fotossintese-e-respiracao', grade: '1ª série EM', title: 'Fotossíntese e respiração celular', subtitle: 'Como os seres vivos produzem e usam energia',
    resumo: String.raw`## Visão geral
Fotossíntese e respiração celular são processos **complementares**: o produto de um é o reagente do outro.

## Fotossíntese
Ocorre nos **cloroplastos**, que contêm o pigmento **clorofila**, capaz de captar luz.
$$6\,CO_2+6\,H_2O\xrightarrow{\text{luz}}C_6H_{12}O_6+6\,O_2$$
Água e gás carbônico entram; glicose e gás oxigênio saem. A energia da luz fica guardada na glicose.

## Respiração celular aeróbia
Libera a energia da glicose e a guarda no **ATP**, a "moeda de energia" da célula.
$$C_6H_{12}O_6+6\,O_2\rightarrow6\,CO_2+6\,H_2O+\text{energia (ATP)}$$

Etapas:
1. **Glicólise:** no **citosol**, sem oxigênio (produz piruvato e um pouco de ATP).
2. **Ciclo de Krebs:** na matriz da **mitocôndria**.
3. **Cadeia respiratória:** nas cristas mitocondriais, onde mais ATP é produzido (usa O₂).

## Fermentação
Sem oxigênio, a célula só faz a glicólise e depois fermenta (láctica nos músculos, alcoólica em leveduras). Rende muito menos ATP.

## Erros comuns
- Achar que só plantas respiram (elas fazem fotossíntese **e** respiração).
- Confundir os produtos de cada processo.`,
    questoes: [
      q('facil', 'Em qual organela ocorre a fotossíntese?', ['Mitocôndria', 'Cloroplasto', 'Ribossomo', 'Lisossomo'], 1, 'Os cloroplastos contêm clorofila e são o local da fotossíntese em plantas e algas.'),
      q('facil', 'Qual gás é liberado na fotossíntese?', ['Gás carbônico', 'Nitrogênio', 'Oxigênio', 'Hidrogênio'], 2, 'A fotossíntese consome CO₂ e água e libera O₂ (e produz glicose).'),
      q('facil', 'Qual molécula armazena e fornece a energia usada diretamente pelas células?', ['ATP', 'DNA', 'Clorofila', 'Hemoglobina'], 0, 'O ATP é a moeda de energia da célula, produzida principalmente na respiração celular.'),
      q('medio', 'Quais são os reagentes (matérias-primas) da fotossíntese?', ['Glicose e oxigênio', 'Gás carbônico e água', 'ATP e oxigênio', 'Glicose e água'], 1, 'Com a energia da luz, o CO₂ e a H₂O são transformados em glicose e oxigênio.'),
      q('medio', 'Em que local da célula ocorre a maior parte da respiração aeróbia?', ['Núcleo', 'Mitocôndria', 'Cloroplasto', 'Parede celular'], 1, 'O ciclo de Krebs e a cadeia respiratória acontecem na mitocôndria. Só a glicólise ocorre no citosol.'),
      q('medio', 'Qual pigmento capta a energia da luz na fotossíntese?', ['Melanina', 'Hemoglobina', 'Clorofila', 'Caroteno de cenoura'], 2, 'A clorofila absorve principalmente luz vermelha e azul e reflete a verde, por isso as folhas parecem verdes.'),
      q('dificil', 'Qual etapa da respiração celular ocorre no citosol e NÃO usa oxigênio?', ['Ciclo de Krebs', 'Cadeia respiratória', 'Glicólise', 'Fotólise da água'], 2, 'A glicólise acontece no citosol e quebra a glicose em piruvato sem precisar de O₂. A fotólise da água pertence à fotossíntese.'),
      q('dificil', 'Qual equação representa corretamente a respiração aeróbia?', ['CO₂ + H₂O → glicose + O₂', 'glicose + O₂ → CO₂ + H₂O + energia', 'glicose → CO₂ + O₂', 'O₂ + H₂O → glicose + CO₂'], 1, 'Na respiração aeróbia a glicose reage com o oxigênio e libera CO₂, água e energia. A primeira alternativa é a fotossíntese.'),
    ],
  },
  {
    topic: 'genetica-mendel', grade: '2ª série EM', title: 'Genética: as leis de Mendel', subtitle: 'Segregação, segregação independente e heredogramas',
    resumo: String.raw`## Primeira lei (segregação)
Cada característica é condicionada por **dois fatores** (alelos), que se **separam** na formação dos gametas. De um indivíduo $Aa$ saem gametas $A$ e $a$ em proporções iguais.

Cruzamento $Aa\times Aa$: $\frac{1}{4}AA,\frac{2}{4}Aa,\frac{1}{4}aa$ (fenótipos 3:1).

## Segunda lei (segregação independente)
Genes em **cromossomos diferentes** se separam de forma independente. Um indivíduo $AaBb$ produz 4 tipos de gametas, todos com chance igual: $AB$, $Ab$, $aB$, $ab$.

O cruzamento $AaBb\times AaBb$ dá a proporção fenotípica **9:3:3:1**.

## Heredogramas
Diagramas que mostram a herança numa família.
- Se **dois pais afetados** têm um filho normal, a característica é **dominante** (os pais eram heterozigotos).
- Se **dois pais normais** têm um filho afetado, a característica é **recessiva**.

## Sistema ABO
Os alelos são $I^A$, $I^B$ (codominantes) e $i$ (recessivo). Pai $I^Ai$ (tipo A) e mãe $I^Bi$ (tipo B) podem ter filhos A, B, AB ou O, cada um com chance de $\frac{1}{4}$.

## Erros comuns
- Somar probabilidades de eventos independentes (use **multiplicação**).
- Confundir codominância com dominância.`,
    questoes: [
      q('facil', 'A Primeira Lei de Mendel afirma que:', ['os genes sempre se herdam juntos', 'cada característica é determinada por dois fatores que se separam na formação dos gametas', 'só os genes recessivos são herdados', 'o fenótipo nunca depende do genótipo'], 1, 'É a lei da segregação: os dois alelos de um gene se separam e cada gameta recebe apenas um.'),
      q('facil', 'Quais gametas um indivíduo Aa produz?', ['A e a', 'Somente A', 'AA e aa', 'Aa'], 0, 'Os alelos se separam: metade dos gametas leva A e metade leva a.'),
      q('facil', 'Um indivíduo homozigoto é aquele que tem:', ['dois alelos diferentes', 'dois alelos iguais', 'apenas um alelo', 'três alelos'], 1, 'Homozigoto tem alelos iguais (AA ou aa). Heterozigoto tem alelos diferentes (Aa).'),
      q('medio', 'No cruzamento AaBb × AaBb (genes em cromossomos diferentes), a proporção fenotípica esperada é:', ['3:1', '1:1', '9:3:3:1', '1:2:1'], 2, 'É a proporção clássica da segunda lei de Mendel para dois genes com dominância completa.'),
      q('medio', 'Quantos tipos de gametas um indivíduo AaBb produz?', ['1', '2', '4', '8'], 2, 'Os alelos se combinam de forma independente: AB, Ab, aB e ab, ou seja, 2 × 2 = 4 tipos.'),
      q('medio', 'Um casal de fenótipo normal (ambos Aa) já tem um filho albino (aa). Qual é a probabilidade de um próximo filho ser albino?', ['1/2', '1/4', '1/8', '3/4'], 1, 'Cada filho é um evento independente: a probabilidade de aa é sempre 1/4, mesmo que já tenham tido um filho albino.'),
      q('dificil', 'Em um heredograma, dois pais afetados têm um filho que não apresenta a característica. Isso indica que a característica é:', ['dominante', 'recessiva', 'ligada ao sexo obrigatoriamente', 'não genética'], 0, 'Se os pais afetados são heterozigotos (Aa) e geram um filho aa (normal), o alelo que causa a característica é dominante.'),
      q('dificil', 'Pai do grupo sanguíneo A (IAi) e mãe do grupo B (IBi). Qual é a probabilidade de um filho ser do tipo O?', ['0', '1/4', '1/2', '3/4'], 1, 'O filho do tipo O precisa receber i de cada genitor: 1/2 × 1/2 = 1/4.'),
    ],
  },
];
