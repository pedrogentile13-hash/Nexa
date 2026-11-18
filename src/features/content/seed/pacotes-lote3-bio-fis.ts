import { q, type PacoteSeed } from './helpers';

export const LOTE3_BIO_FIS: PacoteSeed[] = [
  {
    topic: 'membrana-e-transporte', grade: '1ª série EM', title: 'Membrana plasmática e transporte', subtitle: 'Permeabilidade seletiva, difusão, osmose e transporte ativo',
    resumo: String.raw`## A membrana
Formada por uma **bicamada de fosfolipídios** com proteínas (modelo do **mosaico fluido**). Tem **permeabilidade seletiva**: controla o que entra e o que sai da célula.

## Transporte passivo (sem gasto de ATP)
Acontece a favor do gradiente de concentração (de onde há **mais** para onde há **menos**).
- **Difusão simples:** gases e pequenas moléculas ($O_2$, $CO_2$).
- **Difusão facilitada:** com ajuda de proteínas.
- **Osmose:** passagem de **água** por membrana semipermeável, do meio menos concentrado (mais água) para o mais concentrado.

## Transporte ativo (com gasto de ATP)
Contra o gradiente. Exemplo: **bomba de sódio e potássio**.

## Endocitose e exocitose
Entrada e saída de partículas grandes por vesículas.

## Meios e células
- **Hipotônico:** menos soluto que a célula: ela **ganha água** (a hemácia pode estourar, **lise**).
- **Hipertônico:** mais soluto: ela **perde água** (a célula vegetal murcha, **plasmólise**).
- **Isotônico:** mesma concentração. O **soro fisiológico (0,9%)** é isotônico em relação às células.

## Erros comuns
- Achar que osmose é passagem de soluto.
- Achar que transporte ativo vai a favor do gradiente.`,
    questoes: [
      q('facil', 'A permeabilidade seletiva da membrana plasmática significa que ela:', ['deixa tudo passar', 'controla o que entra e sai da célula', 'não deixa nada passar', 'só deixa passar água'], 1, 'A membrana regula as substâncias que atravessam, o que mantém o equilíbrio interno da célula.'),
      q('facil', 'A osmose é a passagem de:', ['sais por uma parede', 'água por uma membrana semipermeável', 'proteínas pelo núcleo', 'ar pelos pulmões'], 1, 'A osmose é o movimento da água através da membrana, em geral para o meio mais concentrado.'),
      q('facil', 'O transporte ativo se caracteriza por:', ['ocorrer a favor do gradiente, sem gasto de energia', 'gastar ATP e ocorrer contra o gradiente', 'só acontecer em vegetais', 'ocorrer só no núcleo'], 1, 'No transporte ativo a célula gasta ATP para levar substâncias de onde há menos para onde há mais.'),
      q('medio', 'Uma hemácia colocada em água pura (meio hipotônico) tende a:', ['perder água e murchar', 'ganhar água e poder se romper', 'não sofrer alteração', 'dobrar de tamanho e permanecer estável'], 1, 'A água entra na célula, pois o meio tem menos soluto, e a hemácia pode sofrer lise.'),
      q('medio', 'Na difusão, as substâncias se deslocam:', ['de onde há menos para onde há mais', 'de onde há mais para onde há menos', 'sempre com gasto de ATP', 'só em células mortas'], 1, 'A difusão acompanha o gradiente de concentração (do mais concentrado para o menos concentrado).'),
      q('medio', 'Uma célula vegetal em meio hipertônico:', ['ganha água e incha sem limite', 'perde água e sofre plasmólise', 'não troca água', 'transforma-se em animal'], 1, 'O meio externo é mais concentrado, então a célula perde água e a membrana se afasta da parede.'),
      q('dificil', 'A bomba de sódio e potássio é um exemplo de:', ['difusão simples', 'osmose', 'transporte ativo', 'fagocitose'], 2, 'Ela move íons contra o gradiente, com gasto de ATP.'),
      q('dificil', 'O soro fisiológico (NaCl a 0,9%) é usado porque é:', ['hipertônico em relação às células', 'hipotônico em relação às células', 'isotônico em relação às células', 'um ácido forte'], 2, 'Sendo isotônico, não faz as células ganharem nem perderem água de forma significativa.'),
    ],
  },
  {
    topic: 'divisao-celular', grade: '1ª série EM', title: 'Divisão celular: mitose e meiose', subtitle: 'Fases, finalidades e variabilidade genética',
    resumo: String.raw`## Interfase
Antes de dividir, a célula **duplica o DNA** (fase S). A interfase ocupa a maior parte do ciclo.

## Mitose
Origina **2 células-filhas idênticas** à célula-mãe, com o mesmo número de cromossomos (2n). Serve para **crescimento, regeneração e reposição** de células.

Fases: **prófase** (cromossomos se condensam), **metáfase** (alinham-se no equador), **anáfase** (cromátides irmãs se separam) e **telófase** (formam-se os dois núcleos), seguida de citocinese.

## Meiose
Origina **4 células** com **metade** dos cromossomos (n), em duas divisões. Forma os **gametas**. Garante que a fecundação restabeleça o número 2n.

## Variabilidade genética
Na meiose, o **crossing-over** (troca de trechos entre cromossomos homólogos) e a **separação independente** dos cromossomos geram gametas diferentes entre si.

## Números humanos
Célula comum: **46** cromossomos (2n). Gameta: **23** (n).

## Erros comuns
- Confundir mitose (2 células iguais) com meiose (4 células com metade).
- Achar que o DNA duplica na metáfase (ocorre na interfase).`,
    questoes: [
      q('facil', 'Quantas células-filhas são produzidas, ao final, por uma mitose?', ['1', '2', '4', '8'], 1, 'A mitose origina duas células-filhas geneticamente idênticas à célula-mãe.'),
      q('facil', 'A meiose tem como principal função:', ['regenerar tecidos', 'formar gametas', 'crescer o corpo', 'produzir ATP'], 1, 'A meiose origina os gametas (espermatozoides e óvulos), com metade dos cromossomos.'),
      q('facil', 'Quantos cromossomos tem uma célula comum do corpo humano?', ['23', '46', '92', '2'], 1, 'As células somáticas humanas têm 46 cromossomos (2n).'),
      q('medio', 'Quantos cromossomos tem um gameta humano?', ['23', '46', '92', '12'], 0, 'Os gametas têm metade do número de cromossomos: 23.'),
      q('medio', 'Em qual fase da mitose os cromossomos se alinham no equador da célula?', ['Prófase', 'Metáfase', 'Anáfase', 'Telófase'], 1, 'Na metáfase os cromossomos, bem condensados, ficam alinhados no plano equatorial.'),
      q('medio', 'Ao final da meiose, formam-se:', ['2 células iguais à célula-mãe', '4 células com metade dos cromossomos', '1 célula com o dobro de cromossomos', '2 células com 46 cromossomos'], 1, 'São duas divisões seguidas, resultando em 4 células haploides.'),
      q('dificil', 'Em que etapa do ciclo celular ocorre a duplicação do DNA?', ['Metáfase', 'Anáfase', 'Interfase', 'Telófase'], 2, 'O DNA é duplicado na interfase (fase S), antes do início da divisão.'),
      q('dificil', 'O crossing-over, que ocorre na meiose, é importante porque:', ['reduz o número de cromossomos a zero', 'aumenta a variabilidade genética dos gametas', 'impede a fecundação', 'duplica o DNA'], 1, 'A troca de trechos entre cromossomos homólogos gera combinações novas de genes.'),
    ],
  },
  {
    topic: 'ecologia', grade: '2ª série EM', title: 'Ecologia: relações e ciclos', subtitle: 'População, comunidade, relações ecológicas e ciclos biogeoquímicos',
    resumo: String.raw`## Níveis de organização
- **População:** indivíduos da mesma espécie em uma área.
- **Comunidade:** todas as populações de uma área.
- **Ecossistema:** comunidade + fatores **abióticos** (luz, água, solo).
- **Bioma:** grande conjunto de ecossistemas (Cerrado, Amazônia, Caatinga).

## Relações ecológicas
**Harmônicas** (ninguém é prejudicado): **mutualismo** (ambos ganham e dependem: líquens, alga e fungo), cooperação, **comensalismo** (um ganha, o outro não é afetado: rêmora e tubarão).
**Desarmônicas:** **predação** (leão e zebra), **parasitismo** (carrapato no cão), **competição**.

## Ciclos biogeoquímicos
- **Carbono:** fotossíntese retira $CO_2$ do ar; respiração, queimadas e combustão devolvem. A queima de florestas libera o carbono armazenado.
- **Nitrogênio:** bactérias **fixadoras** (em raízes de leguminosas) transformam o $N_2$ em compostos usáveis pelas plantas.
- **Água:** evaporação, condensação, chuva.

## Erros comuns
- Confundir população (uma espécie) com comunidade (várias).
- Confundir comensalismo (um ganha) com mutualismo (os dois ganham).`,
    questoes: [
      q('facil', 'O conjunto de indivíduos da mesma espécie vivendo em uma mesma área é chamado de:', ['comunidade', 'população', 'ecossistema', 'bioma'], 1, 'Uma população reúne indivíduos de uma só espécie.'),
      q('facil', 'Em uma relação de mutualismo:', ['um se beneficia e o outro é prejudicado', 'os dois se beneficiam', 'nenhum se beneficia', 'um se alimenta do outro'], 1, 'No mutualismo, ambos têm vantagens e, em geral, dependem da relação.'),
      q('facil', 'Qual é um exemplo de parasitismo?', ['Leão caçando zebra', 'Carrapato sugando o sangue de um cão', 'Abelha polinizando flores', 'Líquen (alga e fungo)'], 1, 'No parasitismo, um ser (parasita) se beneficia à custa de outro (hospedeiro), prejudicando-o.'),
      q('medio', 'Os líquens são uma associação entre algas e fungos em que ambos se beneficiam. Essa relação é de:', ['predação', 'mutualismo', 'competição', 'parasitismo'], 1, 'A alga faz fotossíntese e o fungo oferece proteção e água: mutualismo.'),
      q('medio', 'Bactérias que vivem em raízes de leguminosas e fixam nitrogênio participam do ciclo:', ['do carbono', 'do nitrogênio', 'do oxigênio apenas', 'da água'], 1, 'Elas transformam o N₂ do ar em formas que as plantas conseguem usar.'),
      q('medio', 'Na relação entre a rêmora e o tubarão, a rêmora se beneficia e o tubarão não é afetado. Trata-se de:', ['mutualismo', 'comensalismo', 'parasitismo', 'predação'], 1, 'É comensalismo: um ganha, o outro nem ganha nem perde.'),
      q('dificil', 'A queima de uma floresta contribui para o aumento do CO₂ atmosférico porque:', ['as árvores produzem CO₂ só quando queimam', 'o carbono armazenado nas plantas é liberado na combustão', 'a queima produz oxigênio', 'as cinzas absorvem CO₂'], 1, 'O carbono das árvores, retirado do ar pela fotossíntese, volta para a atmosfera como CO₂.'),
      q('dificil', 'A diferença entre comunidade e ecossistema é que o ecossistema:', ['inclui só os animais', 'inclui, além dos seres vivos, os fatores abióticos', 'tem apenas uma espécie', 'não tem plantas'], 1, 'Ecossistema = comunidade + ambiente físico-químico (luz, solo, água, temperatura).'),
    ],
  },
  {
    topic: 'evolucao', grade: '2ª série EM', title: 'Evolução biológica', subtitle: 'Mutação, seleção, deriva, especiação, homologia e analogia',
    resumo: String.raw`## Fontes de variabilidade
A **mutação** e a **recombinação gênica** (meiose e reprodução sexuada) geram variação genética. Sem variação, a seleção natural não tem sobre o que agir.

## Fatores evolutivos
- **Seleção natural:** sobrevive e se reproduz mais quem está mais adaptado.
- **Deriva genética:** mudança **aleatória** nas frequências dos alelos, mais forte em populações **pequenas**.
- **Migração (fluxo gênico):** entrada e saída de indivíduos.
- **Mutação.**

## Especiação
Formação de novas espécies. O **isolamento geográfico** (uma barreira separa populações) pode levar a diferenças tão grandes que elas deixam de cruzar.

## Evidências
- **Homologia:** mesma **origem** embrionária, funções podem ser diferentes. O braço humano, a nadadeira da baleia e a asa do morcego mostram **ancestral comum**.
- **Analogia:** mesma **função**, origens diferentes. A asa da ave e a asa da borboleta.
- **Órgãos vestigiais:** reduzidos, sem função clara (apêndice humano).
- Fósseis e semelhanças moleculares.

## Erros comuns
- Confundir homologia com analogia.
- Achar que a mutação "surge porque o organismo precisa".`,
    questoes: [
      q('facil', 'A principal fonte de novas variações genéticas é:', ['a mutação', 'a alimentação', 'o exercício físico', 'a idade'], 0, 'A mutação cria novos alelos. A recombinação os combina de maneiras diferentes.'),
      q('facil', 'Estruturas homólogas são aquelas que têm:', ['a mesma função e origens diferentes', 'a mesma origem embrionária', 'o mesmo tamanho', 'a mesma cor'], 1, 'Homologia indica origem comum, mesmo quando as funções são diferentes.'),
      q('facil', 'A asa de uma ave e a asa de uma borboleta são estruturas:', ['homólogas', 'análogas', 'vestigiais', 'idênticas'], 1, 'Têm a mesma função (voar), mas origens diferentes: são análogas.'),
      q('medio', 'O apêndice humano é frequentemente citado como exemplo de órgão:', ['analógo', 'vestigial', 'homólogo ao coração', 'sem origem'], 1, 'Órgão vestigial é reduzido e com função pouco evidente, mas mostra herança evolutiva.'),
      q('medio', 'O processo de formação de novas espécies é chamado de:', ['especiação', 'migração', 'fotossíntese', 'clonagem'], 0, 'A especiação ocorre quando populações divergem a ponto de não se cruzarem mais com sucesso.'),
      q('medio', 'Uma barreira geográfica que separa uma população em duas pode favorecer:', ['a especiação', 'a fotossíntese', 'a extinção do solo', 'o fim das mutações'], 0, 'Isoladas, as populações acumulam diferenças e podem se tornar espécies distintas.'),
      q('dificil', 'A deriva genética é uma mudança:', ['sempre vantajosa e dirigida', 'aleatória na frequência dos alelos, mais intensa em populações pequenas', 'causada só pelo uso e desuso de órgãos', 'que só ocorre em bactérias'], 1, 'O acaso pesa mais em populações pequenas, e alelos podem se fixar ou sumir sem relação com adaptação.'),
      q('dificil', 'O braço humano, a nadadeira da baleia e a asa do morcego têm o mesmo plano ósseo básico. Isso indica:', ['analogia sem relação de parentesco', 'homologia e ancestral comum', 'que todos voam', 'que não houve evolução'], 1, 'A mesma estrutura básica, adaptada a funções diferentes, aponta para um ancestral comum.'),
    ],
  },
  {
    topic: 'fisiologia-humana', grade: '2ª série EM', title: 'Fisiologia humana', subtitle: 'Sistemas nervoso, endócrino, imune, digestório, respiratório e circulatório',
    resumo: String.raw`## Nervoso × endócrino
- **Nervoso:** resposta **rápida**, por impulsos nervosos (neurônios). Sistema nervoso central (encéfalo e medula) e periférico.
- **Endócrino:** resposta mais **lenta e duradoura**, por **hormônios** levados pelo sangue. A **insulina** (pâncreas) reduz a glicose no sangue; a **adrenalina** prepara o corpo para reagir. No **diabetes**, a insulina falta ou age mal e a glicemia fica alta.

## Imune
**Leucócitos** defendem o corpo; **anticorpos** neutralizam agentes específicos; a vacina cria memória imunológica.

## Digestório
Enzimas quebram os nutrientes: **amilase salivar** começa a digerir o amido na boca; **pepsina** digere proteínas no estômago (meio ácido); a absorção ocorre no intestino delgado.

## Respiratório
Na **inspiração**, o **diafragma contrai e desce** e o volume do tórax aumenta, puxando o ar. Nos alvéolos há trocas gasosas.

## Circulatório
O coração humano tem **4 câmaras**: 2 átrios e 2 ventrículos. A circulação é **dupla e completa**: sangue venoso e arterial não se misturam.

## Erros comuns
- Achar que o diafragma sobe na inspiração.
- Confundir a ação nervosa (rápida) com a hormonal (lenta).`,
    questoes: [
      q('facil', 'Qual hormônio, produzido no pâncreas, regula a taxa de glicose no sangue?', ['Adrenalina', 'Insulina', 'Testosterona', 'Tiroxina'], 1, 'A insulina promove a entrada de glicose nas células, reduzindo a glicemia.'),
      q('facil', 'Quantas câmaras tem o coração humano?', ['2', '3', '4', '6'], 2, 'O coração humano tem 2 átrios e 2 ventrículos, totalizando 4 câmaras.'),
      q('facil', 'Os anticorpos são importantes para:', ['a digestão de gorduras', 'a defesa do organismo', 'a visão', 'o transporte de oxigênio'], 1, 'Anticorpos reconhecem e neutralizam agentes estranhos, como vírus e bactérias.'),
      q('medio', 'Qual enzima da saliva inicia a digestão do amido?', ['Pepsina', 'Amilase', 'Lipase', 'Tripsina'], 1, 'A amilase salivar (ptialina) começa a quebrar o amido ainda na boca.'),
      q('medio', 'O diabetes está relacionado a problemas com a:', ['insulina', 'adrenalina', 'hemoglobina', 'melanina'], 0, 'Na deficiência ou na baixa ação da insulina, a glicose fica elevada no sangue.'),
      q('medio', 'Durante a inspiração, o diafragma:', ['relaxa e sobe', 'contrai e desce', 'fica parado', 'se rompe'], 1, 'Ao descer, o diafragma aumenta o volume torácico e o ar entra nos pulmões.'),
      q('dificil', 'Em comparação com o sistema nervoso, o sistema endócrino atua, em geral, de forma:', ['mais rápida e curta', 'mais lenta e duradoura, por hormônios levados pelo sangue', 'sem uso de substâncias químicas', 'só durante o sono'], 1, 'Hormônios circulam no sangue e têm efeito mais lento, porém prolongado.'),
      q('dificil', 'A pepsina atua:', ['na boca, em meio básico', 'no estômago, em meio ácido, digerindo proteínas', 'no intestino grosso, digerindo amido', 'no fígado, digerindo gorduras'], 1, 'A pepsina é uma enzima do suco gástrico, ativa em pH baixo, que quebra proteínas.'),
    ],
  },
  {
    topic: 'biotecnologia', grade: '3ª série EM', title: 'Biotecnologia e DNA', subtitle: 'Estrutura do DNA, transcrição, tradução, transgênicos e PCR',
    resumo: String.raw`## DNA
Dupla hélice com 4 bases: **A, T, C, G**. Pareamento: **A com T** e **C com G**. Uma fita ATGC tem fita complementar TACG.

## Do gene à proteína
1. **Replicação:** copia do DNA antes da divisão celular.
2. **Transcrição:** o DNA é copiado em **RNA mensageiro** (no RNA, a timina vira **uracila**, U), no núcleo.
3. **Tradução:** nos **ribossomos**, o RNAm é lido em trincas (códons) e forma a **proteína**.

## Biotecnologia
- **Organismo transgênico:** recebe um gene de outra espécie. Ex.: bactérias com o gene da **insulina humana** produzem insulina para o tratamento do diabetes.
- **PCR:** técnica que **amplifica** (faz muitas cópias de) um trecho de DNA, usada em diagnósticos e testes de paternidade.
- **Clonagem:** produção de indivíduos geneticamente idênticos.
- **CRISPR:** edição precisa de genes.

## Questões éticas
Segurança dos alimentos, patentes, privacidade genética e limites da edição.

## Erros comuns
- Achar que o RNA tem timina (tem uracila).
- Confundir transcrição (DNA para RNA) com tradução (RNA para proteína).`,
    questoes: [
      q('facil', 'Quais são as bases nitrogenadas do DNA?', ['A, U, C, G', 'A, T, C, G', 'A, T, U, G', 'T, U, C, G'], 1, 'O DNA tem adenina (A), timina (T), citosina (C) e guanina (G). A uracila só existe no RNA.'),
      q('facil', 'No pareamento do DNA, a adenina se liga à:', ['citosina', 'guanina', 'timina', 'uracila'], 2, 'A liga-se a T, e C liga-se a G.'),
      q('facil', 'Um organismo transgênico é aquele que:', ['não tem genes', 'recebeu um gene de outra espécie', 'só vive em laboratório', 'foi clonado de si mesmo'], 1, 'Transgênico carrega um gene vindo de outro organismo.'),
      q('medio', 'Qual é a fita complementar de ATGC no DNA?', ['TACG', 'UACG', 'CGTA', 'ATGC'], 0, 'A pareia com T, T com A, G com C e C com G: TACG.'),
      q('medio', 'A transcrição é a produção de:', ['proteína a partir do RNA', 'RNA mensageiro a partir do DNA', 'DNA a partir da proteína', 'açúcar a partir do DNA'], 1, 'Na transcrição, o DNA serve de molde para o RNA mensageiro.'),
      q('medio', 'A tradução, isto é, a síntese de proteínas, ocorre nos:', ['ribossomos', 'cloroplastos apenas', 'lisossomos', 'centríolos'], 0, 'Nos ribossomos o RNAm é lido e os aminoácidos são unidos em uma proteína.'),
      q('dificil', 'A insulina humana usada no tratamento do diabetes é produzida atualmente por:', ['extração de porcos apenas', 'bactérias geneticamente modificadas com o gene humano', 'plantas de milho', 'cultura de vírus'], 1, 'Bactérias recebem o gene da insulina humana e a produzem em larga escala.'),
      q('dificil', 'A técnica de PCR tem como objetivo:', ['destruir o DNA', 'amplificar (copiar muitas vezes) um trecho do DNA', 'transformar DNA em RNA', 'medir o pH do sangue'], 1, 'A PCR gera milhões de cópias de uma região específica do DNA, o que permite analisá-la.'),
    ],
  },
  {
    topic: 'classificacao-dos-seres-vivos', grade: '3ª série EM', title: 'Classificação e diversidade dos seres vivos', subtitle: 'Taxonomia, nomenclatura binomial e grandes grupos',
    resumo: String.raw`## Taxonomia
Organiza os seres vivos em categorias, da mais ampla para a mais específica:
**reino → filo → classe → ordem → família → gênero → espécie.**
A **espécie** é a categoria básica.

## Nomenclatura binomial
Criada por Lineu: nome científico = **gênero + epíteto específico**, em latim, em itálico: *Homo sapiens*.

## Reinos
**Monera** (bactérias), **Protista**, **Fungi**, **Plantae** e **Animalia**.
- **Fungos:** heterótrofos, com parede de quitina (cogumelos, mofos, leveduras).

## Plantas
Briófitas (musgos), pteridófitas (samambaias), gimnospermas (pinheiros, sem flores e frutos) e **angiospermas** (com **flores e frutos**).

## Vertebrados
Peixes, anfíbios, répteis, aves e **mamíferos** (pelos e glândulas mamárias). Os **anfíbios** têm pele úmida, respiração cutânea e, em geral, fase larval aquática com **metamorfose**.

## Erros comuns
- Colocar o nome científico sem itálico ou com o gênero em minúscula.
- Confundir classe com ordem (a ordem é mais específica).`,
    questoes: [
      q('facil', 'Qual é a categoria taxonômica mais específica?', ['Filo', 'Gênero', 'Espécie', 'Reino'], 2, 'A espécie é a categoria básica e mais específica da classificação.'),
      q('facil', 'O nome científico é formado por:', ['reino e filo', 'gênero e epíteto específico', 'ordem e classe', 'só pelo nome popular'], 1, 'Nomenclatura binomial: gênero + epíteto, como em Homo sapiens.'),
      q('facil', 'Qual é uma característica exclusiva dos mamíferos?', ['Penas', 'Glândulas mamárias', 'Escamas', 'Respiração branquial'], 1, 'As glândulas mamárias produzem leite para os filhotes.'),
      q('medio', 'As plantas que produzem flores e frutos são:', ['briófitas', 'pteridófitas', 'gimnospermas', 'angiospermas'], 3, 'As angiospermas são as plantas com flores e frutos, o grupo mais diverso.'),
      q('medio', 'Os fungos são:', ['autótrofos e com clorofila', 'heterótrofos e com parede celular de quitina', 'procariontes', 'sempre unicelulares'], 1, 'Eles absorvem alimento, não fazem fotossíntese e têm parede de quitina.'),
      q('medio', 'Qual sequência apresenta as categorias taxonômicas da mais ampla para a mais específica?', ['Espécie, gênero, família, ordem, classe, filo, reino', 'Reino, filo, classe, ordem, família, gênero, espécie', 'Reino, classe, filo, família, ordem, espécie, gênero', 'Filo, reino, ordem, classe, gênero, família, espécie'], 1, 'A hierarquia correta é reino, filo, classe, ordem, família, gênero e espécie.'),
      q('dificil', 'Qual característica é típica dos anfíbios?', ['Ovos com casca dura e fase larval ausente', 'Fase larval aquática com metamorfose e respiração cutânea', 'Presença de pelos', 'Presença de penas'], 1, 'Sapos, rãs e salamandras passam por metamorfose e trocam gases também pela pele.'),
      q('dificil', 'Cogumelos, mofo e leveduras pertencem ao reino:', ['Plantae', 'Animalia', 'Fungi', 'Monera'], 2, 'Todos são fungos.'),
    ],
  },
  {
    topic: 'saude-publica', grade: '3ª série EM', title: 'Saúde pública e doenças', subtitle: 'Endemia, epidemia, pandemia, doenças comuns e prevenção',
    resumo: String.raw`## Termos
- **Endemia:** doença presente de modo **constante** em uma região (malária em áreas da Amazônia).
- **Epidemia:** aumento de casos **acima do esperado** em uma região.
- **Pandemia:** epidemia que se espalha por **vários países ou continentes**.

## Algumas doenças
- **Dengue, zika, chikungunya:** vírus transmitidos pelo *Aedes aegypti*. Prevenção: eliminar **água parada**.
- **Malária:** causada por **protozoário** (*Plasmodium*), transmitida pelo mosquito *Anopheles*.
- **Doença de Chagas:** protozoário *Trypanosoma cruzi*, transmitido pelo barbeiro.
- **Tuberculose:** **bactéria** (*Mycobacterium tuberculosis*), transmitida pelo ar.
- **HIV/aids:** o vírus ataca os **linfócitos T CD4** e compromete a defesa do organismo.

## Prevenção e sistema de saúde
Vacinação, saneamento básico, higiene e diagnóstico precoce. O **SUS** (Sistema Único de Saúde) é universal e gratuito.

## Resistência bacteriana
O uso inadequado de antibióticos favorece bactérias resistentes, um problema de saúde pública.

## Erros comuns
- Achar que epidemia e pandemia são a mesma coisa (a pandemia é mundial).
- Achar que antibiótico trata doenças virais.`,
    questoes: [
      q('facil', 'Um aumento de casos de uma doença acima do esperado em uma região é uma:', ['endemia', 'epidemia', 'pandemia', 'profilaxia'], 1, 'Epidemia é o aumento súbito de casos em uma região. Se atinge vários continentes, vira pandemia.'),
      q('facil', 'Uma epidemia que se espalha por vários países ou continentes é uma:', ['endemia', 'epidemia local', 'pandemia', 'vacinação'], 2, 'Pandemia é a disseminação em escala mundial.'),
      q('facil', 'Uma doença que ocorre de forma constante em uma região é:', ['uma endemia', 'uma pandemia', 'um surto único', 'uma vacina'], 0, 'Endemia: presença habitual da doença em determinado local.'),
      q('medio', 'A malária é causada por um:', ['vírus', 'protozoário', 'fungo', 'prion'], 1, 'O agente é o protozoário Plasmodium, transmitido pela fêmea do mosquito Anopheles.'),
      q('medio', 'A principal medida de prevenção contra a dengue é:', ['tomar antibióticos', 'eliminar focos de água parada', 'evitar frutas', 'usar agasalho'], 1, 'O mosquito Aedes aegypti deposita ovos em água parada, então eliminar esses focos reduz a doença.'),
      q('medio', 'A tuberculose é causada por:', ['uma bactéria', 'um vírus', 'um protozoário', 'um fungo microscópico'], 0, 'O agente é a bactéria Mycobacterium tuberculosis, transmitida pelo ar.'),
      q('dificil', 'O HIV causa a aids porque ataca:', ['os glóbulos vermelhos', 'os linfócitos T CD4, comprometendo a imunidade', 'os neurônios motores', 'as células do fígado'], 1, 'Com a destruição dos linfócitos T CD4, o organismo fica vulnerável a outras infecções.'),
      q('dificil', 'A doença de Chagas é causada pelo protozoário Trypanosoma cruzi e transmitida por:', ['mosquito Aedes', 'barbeiro (triatomíneo)', 'água contaminada apenas', 'pernilongo comum'], 1, 'O barbeiro libera o parasita nas fezes, que podem penetrar pela picada ou por mucosas.'),
    ],
  },
  {
    topic: 'quantidade-de-movimento', grade: '1ª série EM', title: 'Impulso e quantidade de movimento', subtitle: 'Q = m·v, impulso, conservação e colisões',
    resumo: String.raw`## Quantidade de movimento
$$Q=m\cdot v$$
Grandeza **vetorial**, em $\text{kg}\cdot\text{m/s}$. Massa 2 kg a 3 m/s: $Q=6$. Carro de 1000 kg a 20 m/s: $Q=20\,000$.

## Impulso
$$I=F\cdot\Delta t=\Delta Q$$
Em $\text{N}\cdot\text{s}$. Uma força de 10 N durante 3 s dá $I=30\ \text{N}\cdot\text{s}$. O **impulso** é igual à **variação da quantidade de movimento**.

## Conservação
Em um sistema **isolado** (sem forças externas), a quantidade de movimento total se conserva: $Q_{antes}=Q_{depois}$.

## Colisões
- **Elástica:** conserva a energia cinética.
- **Inelástica:** parte da energia vira calor e deformação.
- **Perfeitamente inelástica:** os corpos ficam juntos.

Exemplo: carrinho de 2 kg a 3 m/s bate em um de 1 kg parado e eles se unem: $6=3\cdot v\Rightarrow v=2\ \text{m/s}$.

## Segurança
O **airbag** e a zona de deformação do carro **aumentam o tempo** da colisão; como $I=F\Delta t$, para o mesmo $\Delta Q$ a força média **diminui**.

## Erros comuns
- Confundir quantidade de movimento com energia cinética.
- Esquecer o sentido (o sinal) da velocidade.`,
    questoes: [
      q('facil', 'Qual é a quantidade de movimento de um corpo de 2 kg com velocidade de 3 m/s?', ['1,5 kg·m/s', '5 kg·m/s', '6 kg·m/s', '18 kg·m/s'], 2, 'Q = m · v = 2 · 3 = 6 kg·m/s.'),
      q('facil', 'A unidade de impulso no Sistema Internacional é:', ['N·s', 'J', 'W', 'N/m'], 0, 'I = F · Δt, em newton vezes segundo.'),
      q('facil', 'Em um sistema isolado, a quantidade de movimento total:', ['sempre aumenta', 'sempre diminui', 'se conserva', 'é sempre zero'], 2, 'Sem forças externas resultantes, a quantidade de movimento do sistema se conserva.'),
      q('medio', 'Uma força constante de 10 N atua por 3 s sobre um corpo. Qual é o impulso?', ['3,3 N·s', '13 N·s', '30 N·s', '7 N·s'], 2, 'I = F · Δt = 10 · 3 = 30 N·s.'),
      q('medio', 'O impulso aplicado a um corpo é igual à:', ['variação da quantidade de movimento', 'energia potencial', 'massa do corpo', 'velocidade final'], 0, 'É o teorema do impulso: I = ΔQ.'),
      q('medio', 'Um carro de 1 000 kg se move a 20 m/s. Qual é a sua quantidade de movimento?', ['2 000 kg·m/s', '20 000 kg·m/s', '200 000 kg·m/s', '50 kg·m/s'], 1, 'Q = 1000 · 20 = 20 000 kg·m/s.'),
      q('dificil', 'Um carrinho de 2 kg a 3 m/s colide com outro de 1 kg parado e ficam unidos. Qual é a velocidade do conjunto?', ['1 m/s', '2 m/s', '3 m/s', '6 m/s'], 1, 'Q antes = 2·3 = 6. Depois: (2 + 1)·v = 6, então v = 2 m/s.'),
      q('dificil', 'O airbag reduz lesões em uma colisão porque:', ['aumenta o tempo de interação, reduzindo a força média sobre a pessoa', 'diminui a massa da pessoa', 'aumenta a velocidade do carro', 'elimina o impulso'], 0, 'Como I = F · Δt é o mesmo, um Δt maior significa uma força média menor.'),
    ],
  },
  {
    topic: 'optica', grade: '2ª série EM', title: 'Óptica geométrica', subtitle: 'Reflexão, refração, espelho plano, lentes e cores',
    resumo: String.raw`## Propagação da luz
A luz se propaga em linha reta em meios homogêneos. Isso explica sombras e eclipses.

## Reflexão
**Lei da reflexão:** o ângulo de incidência é **igual** ao ângulo de reflexão (medidos em relação à normal). Um raio incidente a $30^\circ$ da normal reflete a $30^\circ$.

## Espelho plano
Forma imagem **virtual**, do **mesmo tamanho** e **simétrica** ao objeto. Se o objeto está a 2 m do espelho, a imagem está a 2 m atrás dele; a distância objeto–imagem é 4 m.

## Refração
É a mudança de **velocidade** da luz ao passar de um meio para outro, geralmente com desvio da direção. Explica o "quebrado" de um lápis na água.

## Lentes
- **Convergente** (bordas finas): faz os raios convergirem; corrige a **hipermetropia**.
- **Divergente** (bordas grossas): corrige a **miopia**.

## Cores
A luz branca é uma mistura de cores (dispersão em um prisma). Um objeto vermelho, sob luz branca, **reflete o vermelho** e absorve as demais.

## Erros comuns
- Medir os ângulos em relação à superfície (e não à normal).
- Achar que a imagem do espelho plano está na superfície do espelho.`,
    questoes: [
      q('facil', 'Pela lei da reflexão, o ângulo de incidência é:', ['maior que o de reflexão', 'igual ao de reflexão', 'menor que o de reflexão', 'sempre 90°'], 1, 'Os dois ângulos, medidos em relação à normal, são iguais.'),
      q('facil', 'A imagem formada por um espelho plano é:', ['real e invertida', 'virtual, do mesmo tamanho do objeto', 'real e maior', 'virtual e menor'], 1, 'O espelho plano forma imagem virtual, direita, do mesmo tamanho e simétrica.'),
      q('facil', 'A refração da luz é:', ['o retorno da luz ao mesmo meio', 'a mudança de velocidade da luz ao passar de um meio para outro', 'a absorção total da luz', 'a produção de sombra'], 1, 'Ao mudar de meio, a luz muda de velocidade e, em geral, de direção.'),
      q('medio', 'Um objeto está a 2 m de um espelho plano. Qual é a distância entre o objeto e sua imagem?', ['2 m', '4 m', '1 m', '6 m'], 1, 'A imagem fica a 2 m atrás do espelho, então a distância total é 2 + 2 = 4 m.'),
      q('medio', 'Qual lente é usada para corrigir a miopia?', ['Convergente', 'Divergente', 'Plana', 'Espelho convexo'], 1, 'Na miopia, a imagem se forma antes da retina. A lente divergente a afasta.'),
      q('medio', 'Ao passar por um prisma, a luz branca:', ['permanece branca', 'se decompõe nas diversas cores', 'desaparece', 'vira som'], 1, 'A dispersão separa as cores, pois cada uma sofre um desvio diferente.'),
      q('dificil', 'Um raio de luz incide em um espelho plano formando 30° com a normal. Qual é o ângulo entre o raio incidente e o raio refletido?', ['30°', '60°', '90°', '120°'], 1, 'O ângulo de reflexão também é 30°, então o ângulo entre os dois raios é 30° + 30° = 60°.'),
      q('dificil', 'Uma camiseta aparece vermelha sob luz branca porque ela:', ['absorve o vermelho e reflete as outras cores', 'reflete o vermelho e absorve as demais cores', 'emite luz vermelha própria', 'refrata todas as cores'], 1, 'A cor percebida é a cor da luz refletida pelo objeto.'),
    ],
  },
  {
    topic: 'ondas-e-som', grade: '2ª série EM', title: 'Ondas e som', subtitle: 'Equação fundamental, frequência, período e características do som',
    resumo: String.raw`## Grandezas de uma onda
- **Frequência ($f$):** oscilações por segundo, em hertz (Hz).
- **Período ($T$):** tempo de uma oscilação. $T=\frac{1}{f}$. Para $f=4\ \text{Hz}$, $T=0{,}25\ \text{s}$.
- **Comprimento de onda ($\lambda$):** distância entre duas cristas.

## Equação fundamental
$$v=\lambda\cdot f$$
$\lambda=2\ \text{m}$ e $f=5\ \text{Hz}$ ⇒ $v=10\ \text{m/s}$. Se $f$ dobra e $v$ não muda, $\lambda$ cai pela metade.

## Tipos
- **Transversais:** vibração perpendicular à propagação (ondas na corda, luz).
- **Longitudinais:** vibração na mesma direção (o **som**).

## O som
- Onda mecânica longitudinal: precisa de meio material (não existe no vácuo).
- Velocidade no ar: cerca de **340 m/s**.
- **Altura:** grave ou agudo, depende da **frequência**.
- **Intensidade:** forte ou fraco, depende da amplitude.
- **Timbre:** distingue fontes diferentes.
- Faixa audível: de cerca de 20 Hz a 20 kHz.

## Aplicações
Trovão 3 s depois do relâmpago, com $v=340$: distância $=340\cdot3=1020\ \text{m}$. O **eco** é a reflexão do som; para perceber, a distância mínima é de cerca de 17 m.

## Erros comuns
- Confundir altura (frequência) com intensidade (volume).
- Esquecer de converter unidades.`,
    questoes: [
      q('facil', 'Uma onda tem comprimento de onda de 2 m e frequência de 5 Hz. Qual é a sua velocidade?', ['2,5 m/s', '7 m/s', '10 m/s', '0,4 m/s'], 2, 'v = λ · f = 2 · 5 = 10 m/s.'),
      q('facil', 'O som é uma onda:', ['transversal e eletromagnética', 'longitudinal e mecânica', 'luminosa', 'que se propaga no vácuo'], 1, 'O som é uma onda mecânica longitudinal, que precisa de meio material.'),
      q('facil', 'A unidade de frequência no Sistema Internacional é o:', ['metro', 'hertz', 'newton', 'watt'], 1, 'A frequência é medida em hertz (Hz), ou seja, ciclos por segundo.'),
      q('medio', 'Uma onda tem frequência de 4 Hz. Qual é o seu período?', ['0,25 s', '4 s', '0,4 s', '2 s'], 0, 'T = 1 / f = 1 / 4 = 0,25 s.'),
      q('medio', 'A qualidade do som que permite distinguir um som grave de um agudo é a:', ['altura (frequência)', 'intensidade', 'timbre', 'velocidade'], 0, 'Sons agudos têm alta frequência, e sons graves, baixa frequência.'),
      q('medio', 'Um trovão é ouvido 3 s depois do relâmpago. Com a velocidade do som de 340 m/s, a que distância caiu o raio?', ['113 m', '340 m', '1 020 m', '3 400 m'], 2, 'Distância = v · t = 340 · 3 = 1 020 m (a luz chega praticamente na hora).'),
      q('dificil', 'Se a frequência de uma onda dobra e a velocidade permanece a mesma, o comprimento de onda:', ['dobra', 'cai pela metade', 'fica igual', 'quadruplica'], 1, 'Como v = λ · f é constante, se f dobra, λ cai pela metade.'),
      q('dificil', 'Para que um eco seja percebido, o som precisa percorrer ida e volta em pelo menos 0,1 s. Com v = 340 m/s, qual é a distância mínima até o obstáculo?', ['17 m', '34 m', '68 m', '340 m'], 0, 'Em 0,1 s o som percorre 34 m (ida e volta), então o obstáculo fica a 17 m.'),
    ],
  },
  {
    topic: 'eletrostatica', grade: '3ª série EM', title: 'Eletrostática', subtitle: 'Carga elétrica, processos de eletrização e lei de Coulomb',
    resumo: String.raw`## Carga elétrica
Existem cargas **positivas** (prótons) e **negativas** (elétrons). Unidade: **coulomb (C)**. Um corpo neutro que **perde** elétrons fica **positivo**; se **ganha**, fica **negativo**.

## Atração e repulsão
Cargas de **mesmo sinal repelem**; de **sinais opostos atraem**.

## Processos de eletrização
- **Atrito:** esfregar dois materiais (pente no cabelo).
- **Contato:** o corpo neutro recebe carga ao tocar um eletrizado.
- **Indução:** aproximar (sem tocar) um corpo eletrizado de um condutor neutro separa as cargas. Com um bastão positivo, a parte mais próxima da esfera fica **negativa**.

## Lei de Coulomb
$$F=k\,\frac{|Q_1\,Q_2|}{d^2}$$
- Dobrando a **distância**, a força fica **4 vezes menor**.
- Dobrando **uma das cargas**, a força **dobra**.

## Pára-raios
Conduz a descarga elétrica da nuvem para a **terra**, protegendo prédios.

## Erros comuns
- Achar que prótons se movem na eletrização (são os elétrons que se transferem).
- Achar que a força cai com $d$ (cai com $d^2$).`,
    questoes: [
      q('facil', 'Duas cargas elétricas de mesmo sinal:', ['se atraem', 'se repelem', 'não interagem', 'se anulam sempre'], 1, 'Cargas de mesmo sinal se repelem; de sinais opostos se atraem.'),
      q('facil', 'A unidade de carga elétrica no Sistema Internacional é o:', ['volt', 'ampère', 'coulomb', 'ohm'], 2, 'A carga elétrica é medida em coulomb (C).'),
      q('facil', 'Quando se esfrega um pente no cabelo e ele passa a atrair pedacinhos de papel, ocorreu uma eletrização por:', ['indução', 'atrito', 'contato apenas', 'radiação'], 1, 'O atrito transfere elétrons de um material para o outro.'),
      q('medio', 'Se a distância entre duas cargas dobra, a força elétrica entre elas:', ['dobra', 'cai pela metade', 'fica 4 vezes menor', 'fica 4 vezes maior'], 2, 'A força é inversamente proporcional a d². Com d dobrado, F fica dividida por 4.'),
      q('medio', 'Se uma das cargas dobra e a distância não muda, a força:', ['dobra', 'fica metade', 'quadruplica', 'não muda'], 0, 'A força é proporcional ao produto das cargas, então dobrando uma delas a força dobra.'),
      q('medio', 'Um corpo neutro que perde elétrons fica:', ['negativo', 'positivo', 'continua neutro', 'sem massa'], 1, 'Com menos elétrons que prótons, o corpo fica positivo.'),
      q('dificil', 'A principal função de um pára-raios é:', ['atrair mais raios para a casa', 'conduzir a descarga elétrica para a terra', 'produzir energia', 'impedir que chova'], 1, 'O condutor oferece um caminho seguro para a descarga até o solo.'),
      q('dificil', 'Um bastão com carga positiva é aproximado, sem tocar, de uma esfera metálica neutra. A região da esfera mais próxima do bastão fica:', ['positiva', 'negativa', 'neutra', 'sem elétrons'], 1, 'Por indução, o bastão positivo atrai os elétrons livres para o lado mais próximo, que fica negativo.'),
    ],
  },
  {
    topic: 'magnetismo', grade: '3ª série EM', title: 'Magnetismo e eletromagnetismo', subtitle: 'Ímãs, campo magnético, Oersted, Faraday e eletroímã',
    resumo: String.raw`## Ímãs
Todo ímã tem dois polos: **norte** e **sul**. Polos **iguais repelem**; **diferentes atraem**. Os polos são **inseparáveis**: ao partir um ímã, cada pedaço continua com os dois polos.

## Campo magnético
Região em que um ímã exerce força. As linhas de campo **saem do polo norte e entram no polo sul**. A **Terra** é um grande ímã, e a agulha da **bússola** se alinha ao campo magnético terrestre.

## Eletricidade e magnetismo
- **Oersted:** uma **corrente elétrica** produz campo magnético ao seu redor.
- **Eletroímã:** bobina com núcleo de ferro e corrente. Liga e desliga com a corrente (guindastes, campainhas).
- **Faraday:** a **variação do fluxo magnético** em um circuito gera **corrente induzida**. É o princípio dos **geradores** (usinas) e dos **transformadores**.

## Transformador
Só funciona com **corrente alternada**, pois precisa de campo magnético variável. Altera o valor da tensão elétrica.

## Erros comuns
- Achar que é possível isolar um polo magnético.
- Achar que o ímã permanente "gasta" energia ao atrair.`,
    questoes: [
      q('facil', 'Dois polos magnéticos iguais (norte e norte) se:', ['atraem', 'repelem', 'anulam', 'neutralizam'], 1, 'Polos iguais se repelem; polos diferentes se atraem.'),
      q('facil', 'A agulha de uma bússola aponta aproximadamente para o norte geográfico porque:', ['é atraída pelo Sol', 'se alinha ao campo magnético da Terra', 'é atraída pela Lua', 'tem carga elétrica'], 1, 'A Terra se comporta como um grande ímã, e a agulha magnetizada se alinha ao seu campo.'),
      q('facil', 'Ao partir um ímã ao meio, obtêm-se:', ['um polo norte e um polo sul isolados', 'dois ímãs, cada um com dois polos', 'dois pedaços sem magnetismo', 'um ímã com 4 polos norte'], 1, 'Polos magnéticos são inseparáveis: cada pedaço vira um ímã completo.'),
      q('medio', 'Oersted descobriu que:', ['ímãs produzem corrente', 'uma corrente elétrica produz campo magnético', 'a luz é uma onda', 'o som precisa de meio'], 1, 'Uma corrente em um fio desvia a agulha de uma bússola próxima.'),
      q('medio', 'Um eletroímã é formado por:', ['uma pedra de ímã apenas', 'uma bobina com núcleo de ferro percorrida por corrente', 'uma lâmpada e um fio', 'dois ímãs colados'], 1, 'O magnetismo existe enquanto passa corrente, e pode ser ligado e desligado.'),
      q('medio', 'Os geradores de energia elétrica se baseiam no princípio de:', ['Oersted', 'Faraday (indução eletromagnética)', 'Coulomb', 'Newton'], 1, 'A variação do fluxo magnético induz corrente elétrica em uma bobina.'),
      q('dificil', 'Um transformador convencional só funciona com corrente alternada porque:', ['a corrente contínua é perigosa', 'é preciso um campo magnético variável para induzir corrente', 'a corrente contínua é mais fraca', 'a corrente alternada não tem tensão'], 1, 'Sem variação do fluxo magnético, não há corrente induzida no enrolamento secundário.'),
      q('dificil', 'As linhas de campo magnético de um ímã:', ['saem do polo sul e entram no norte', 'saem do polo norte e entram no sul', 'só existem no polo norte', 'não existem fora do ímã'], 1, 'Por convenção, elas saem do polo norte e entram no polo sul.'),
    ],
  },
];
