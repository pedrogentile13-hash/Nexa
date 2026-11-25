import { q, type PacoteSeed } from './helpers';

export const CIENCIAS: PacoteSeed[] = [
  {
    topic: 'celulas', grade: '6º ano', title: 'Células: a unidade dos seres vivos', subtitle: 'O que é uma célula, suas partes e os tipos de célula',
    resumo: String.raw`## A unidade da vida
Todo ser vivo é formado por **células**. Algumas formas de vida têm uma só célula (**unicelulares**, como as bactérias); outras têm muitas (**pluricelulares**, como plantas e animais).

## Partes principais
- **Membrana plasmática:** envolve a célula e controla o que entra e sai.
- **Citoplasma:** o interior da célula, onde ficam as organelas.
- **Núcleo:** guarda o material genético (DNA) e coordena as atividades da célula.

## Algumas organelas
- **Mitocôndria:** libera energia pela respiração celular.
- **Cloroplasto:** faz a fotossíntese (só em células vegetais e algas).
- **Vacúolo:** armazena substâncias; é grande nas células vegetais.
- **Ribossomos:** produzem proteínas.

## Célula animal × vegetal
A célula vegetal tem **parede celular**, **cloroplastos** e grande vacúolo. A animal não tem.

## Procariontes × eucariontes
- **Procariontes** (bactérias): não têm núcleo delimitado por membrana.
- **Eucariontes** (animais, plantas, fungos, protozoários): têm núcleo organizado.

## Erros comuns
- Achar que só as plantas têm mitocôndrias (todas as células eucariontes têm).
- Dizer que bactérias têm núcleo.`,
    questoes: [
      q('facil', 'Qual é a unidade básica da estrutura dos seres vivos?', ['O tecido', 'A célula', 'O órgão', 'O átomo'], 1, 'Todos os seres vivos são formados por células, a unidade estrutural e funcional da vida.'),
      q('facil', 'Qual estrutura da célula guarda o material genético (DNA)?', ['Membrana plasmática', 'Citoplasma', 'Núcleo', 'Parede celular'], 2, 'O DNA fica no núcleo das células eucariontes e coordena as atividades da célula.'),
      q('facil', 'Seres formados por apenas uma célula são chamados de:', ['unicelulares', 'pluricelulares', 'multicelulares', 'teciduais'], 0, 'Unicelular significa "uma célula". Bactérias são exemplos.'),
      q('medio', 'Qual organela realiza a fotossíntese?', ['Mitocôndria', 'Ribossomo', 'Cloroplasto', 'Núcleo'], 2, 'O cloroplasto contém clorofila e produz glicose a partir de luz, água e gás carbônico. Está presente em células vegetais.'),
      q('medio', 'Qual estrutura existe em células vegetais, mas NÃO em células animais?', ['Membrana plasmática', 'Mitocôndria', 'Núcleo', 'Parede celular'], 3, 'A parede celular, junto com os cloroplastos, é característica da célula vegetal. Membrana, mitocôndria e núcleo existem nas duas.'),
      q('medio', 'Qual é a principal função das mitocôndrias?', ['Fazer fotossíntese', 'Liberar energia para a célula', 'Guardar o DNA', 'Produzir proteínas'], 1, 'As mitocôndrias fazem a respiração celular, que libera a energia usada pela célula.'),
      q('dificil', 'Qual é a principal diferença entre uma célula procarionte e uma eucarionte?', ['A procarionte não tem membrana plasmática', 'A procarionte não tem núcleo delimitado por membrana', 'A eucarionte não tem DNA', 'A eucarionte só existe em plantas'], 1, 'Células procariontes, como as das bactérias, têm o DNA solto no citoplasma, sem núcleo envolvido por membrana. As eucariontes têm núcleo organizado.'),
      q('dificil', 'As células musculares têm muitas mitocôndrias. A melhor explicação é que elas:', ['guardam mais DNA', 'precisam de muita energia para se contrair', 'fazem fotossíntese', 'não têm núcleo'], 1, 'O movimento gasta muita energia, e a mitocôndria é a organela que a libera. Quanto maior o gasto de energia, mais mitocôndrias a célula tende a ter.'),
    ],
  },
  {
    topic: 'hereditariedade-9', grade: '9º ano', title: 'Hereditariedade e as leis de Mendel', subtitle: 'Genes, dominância e como calcular probabilidades em cruzamentos',
    resumo: String.raw`## Vocabulário
- **Gene:** trecho do DNA que determina uma característica.
- **Alelos:** versões diferentes de um mesmo gene (por exemplo, flor roxa ou branca).
- **Dominante (A):** aparece mesmo com apenas um alelo. **Recessivo (a):** só aparece com dois.
- **Genótipo:** os alelos que o indivíduo tem (AA, Aa, aa). **Fenótipo:** a característica que se observa.
- **Homozigoto:** alelos iguais (AA ou aa). **Heterozigoto:** alelos diferentes (Aa).

## Primeira lei de Mendel
Cada característica é determinada por dois fatores, que se **separam** na formação dos gametas: cada gameta recebe só um deles.

## Cruzamentos
- $AA\times aa\Rightarrow$ todos $Aa$.
- $Aa\times Aa\Rightarrow\frac{1}{4}AA,\ \frac{2}{4}Aa,\ \frac{1}{4}aa$. Fenótipo: **3 dominantes : 1 recessivo**.
- $Pp\times pp\Rightarrow\frac{1}{2}Pp$ e $\frac{1}{2}pp$.

## Probabilidades independentes
Quando dois eventos são independentes, **multiplica-se**: um filho $aa$ ($\frac{1}{4}$) e menina ($\frac{1}{2}$) tem probabilidade $\frac{1}{8}$.

## Cruzamento-teste
Para saber se um indivíduo de fenótipo dominante é $AA$ ou $Aa$, cruza-se com um recessivo ($aa$). Se aparecer algum descendente recessivo, ele era $Aa$.

## Erros comuns
- Achar que dominante significa "mais comum".
- Esquecer que o recessivo precisa de **dois** alelos.`,
    questoes: [
      q('facil', 'O que é fenótipo?', ['O conjunto de alelos de um indivíduo', 'A característica observável do indivíduo', 'Um tipo de célula', 'O tamanho do cromossomo'], 1, 'Fenótipo é o que se observa (cor da flor, cor dos olhos). Os alelos que a pessoa tem formam o genótipo.'),
      q('facil', 'Um indivíduo de genótipo Aa é:', ['homozigoto dominante', 'homozigoto recessivo', 'heterozigoto', 'haploide'], 2, 'Heterozigoto tem dois alelos diferentes, como A e a.'),
      q('facil', 'No cruzamento AA × aa, os descendentes serão:', ['todos Aa', '50% AA e 50% aa', 'todos AA', 'todos aa'], 0, 'Os pais só produzem gametas A (um) e a (outro), então todos os filhos recebem A de um e a do outro: Aa.'),
      q('medio', 'No cruzamento Aa × Aa, qual é a probabilidade de um descendente ser aa?', ['1/2', '1/4', '3/4', '0'], 1, 'Os cruzamentos geram 1/4 AA, 2/4 Aa e 1/4 aa. O recessivo aa tem probabilidade 1/4.'),
      q('medio', 'No cruzamento Aa × Aa, qual é a probabilidade de o descendente ter o fenótipo dominante?', ['1/4', '1/2', '3/4', '1'], 2, 'AA e Aa mostram o fenótipo dominante: 1/4 + 2/4 = 3/4.'),
      q('medio', 'Uma planta de flores roxas (Pp, roxa é dominante) é cruzada com uma de flores brancas (pp). O que se espera da descendência?', ['100% roxas', '100% brancas', '50% roxas e 50% brancas', '75% roxas e 25% brancas'], 2, 'Pp × pp gera 1/2 Pp (roxas) e 1/2 pp (brancas).'),
      q('dificil', 'Um casal em que ambos são Aa quer ter um filho com a característica recessiva (aa) e que seja menina. Qual é a probabilidade?', ['1/4', '1/8', '1/2', '3/8'], 1, 'Probabilidade de aa = 1/4 e de ser menina = 1/2. Como são eventos independentes, multiplica-se: 1/4 × 1/2 = 1/8.'),
      q('dificil', 'Um indivíduo tem o fenótipo dominante. Como descobrir se ele é AA ou Aa?', ['Cruzando com um indivíduo aa (cruzamento-teste)', 'Cruzando com outro AA', 'Observando apenas a cor', 'Não há como descobrir'], 0, 'No cruzamento-teste com aa, se algum filho for aa, o indivíduo testado era Aa. Se todos tiverem o fenótipo dominante, provavelmente é AA.'),
    ],
  },
];
