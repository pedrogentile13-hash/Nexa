import { o, type QuestaoG2 } from '../grande2/types';

/**
 * PA7 · Geografia (9º ano, módulos 11 e 12): Japão e Oceania. Os textos-base são elaborados para os simulados,
 * sem números exatos que possam ficar desatualizados (quando há dado, ele vem como ordem de grandeza).
 */

/* ------------------------------------------------------------ SIMULADO BASE (10) */

export const GEOGRAFIA_BASE: QuestaoG2[] = [
  o(
    'facil',
    `Leia o texto.

O Japão é um arquipélago formado por milhares de ilhas, das quais quatro concentram a maior parte do território e da população: Hokkaido, Honshu, Shikoku e Kyushu. O país está localizado no chamado Círculo ou Cinturão de Fogo do Pacífico, região onde várias placas tectônicas se encontram.

A localização do Japão ajuda a explicar a ocorrência frequente de`,
    'terremotos, tsunamis e atividade vulcânica.',
    [
      'secas prolongadas e desertificação.',
      'tempestades de areia e dunas móveis.',
      'geleiras e permafrost em todo o território.',
      'queimadas naturais em florestas tropicais.',
    ],
    'O Japão fica sobre o encontro de placas tectônicas (Cinturão de Fogo do Pacífico). Por isso é comum haver abalos sísmicos, vulcões ativos (como o Monte Fuji, adormecido) e tsunamis.',
  ),
  o(
    'medio',
    `Leia o texto.

Cerca de três quartos do território japonês são formados por montanhas, e apenas uma pequena parte do solo é própria para a agricultura. O país tem poucos recursos energéticos e minerais, e importa a maior parte do petróleo, do carvão e do minério de ferro que consome.

Essas características naturais ajudam a explicar por que a economia japonesa`,
    'se desenvolveu apoiada na importação de matérias-primas e na exportação de produtos industrializados de alto valor agregado.',
    [
      'se baseia principalmente na exportação de petróleo e minérios.',
      'depende, sobretudo, da agricultura extensiva em grandes planícies.',
      'prescinde do comércio exterior, pois produz tudo o que consome.',
      'tem na pecuária de grande escala sua principal atividade econômica.',
    ],
    'Sem recursos naturais abundantes, o Japão investiu em indústria e tecnologia: compra matéria-prima e vende bens manufaturados (automóveis, eletrônicos, máquinas).',
  ),
  o(
    'medio',
    `Leia o texto.

Depois da Segunda Guerra Mundial, o Japão estava devastado. Nas décadas de 1950 a 1970, porém, o país viveu um rápido crescimento econômico, conhecido como "milagre japonês". Contribuíram para isso o investimento em educação e tecnologia, a atuação do Estado no planejamento da economia, a ajuda financeira dos Estados Unidos e o sucesso de grandes grupos empresariais voltados à exportação.

O texto permite concluir que o "milagre japonês" foi resultado de`,
    'uma combinação de planejamento estatal, investimentos em educação e tecnologia e produção voltada à exportação.',
    [
      'exploração de grandes jazidas de petróleo no território japonês.',
      'isolamento comercial, sem relações com outros países.',
      'abandono da indústria em favor da agricultura de subsistência.',
      'recusa de qualquer cooperação internacional no pós-guerra.',
    ],
    'O crescimento japonês no pós-guerra se apoiou em capital humano (educação), tecnologia, planejamento estatal, capital externo e exportações. O toyotismo (produção enxuta) tornou-se símbolo desse período.',
  ),
  o(
    'medio',
    `Leia o texto.

A maior parte da população e das indústrias do Japão se concentra em uma faixa litorânea da ilha de Honshu, onde ficam Tóquio, Yokohama, Nagoia, Osaka e Kobe. Essa faixa forma uma megalópole, com cidades que se ligam por ferrovias de alta velocidade e rodovias.

A concentração urbano-industrial nessa região se explica, em parte,`,
    'pela existência de planícies litorâneas, de portos e de infraestrutura de transportes, em um território muito montanhoso.',
    [
      'pela abundância de desertos, que facilitam a construção de fábricas.',
      'pela ausência de portos, que obriga a produção a se voltar ao mercado interno.',
      'pelo clima polar da região, que facilita a conservação dos alimentos.',
      'pela proibição de indústrias no interior do país.',
    ],
    'Como a maior parte do território é montanhosa, as pequenas planícies do litoral concentram cidades, indústrias e portos, o que gera alta densidade demográfica na megalópole Tokaido.',
  ),
  o(
    'medio',
    `Leia o texto.

A população do Japão tem uma das maiores expectativas de vida do mundo e uma das menores taxas de natalidade. O país recebe poucos imigrantes. Com isso, o número de idosos cresce e o de jovens diminui, o que desafia a previdência social, o sistema de saúde e a oferta de mão de obra.

Uma medida que o país pode adotar para enfrentar esse desafio é`,
    'investir em automação, robótica e na participação de mulheres e de idosos no mercado de trabalho.',
    [
      'reduzir os investimentos em saúde, para diminuir os gastos públicos.',
      'proibir a aposentadoria, para evitar o crescimento do número de idosos.',
      'fechar todas as escolas, já que há poucas crianças.',
      'aumentar, imediatamente, a natalidade por decreto.',
    ],
    'O envelhecimento reduz a população economicamente ativa. O Japão tem recorrido à automação, a incentivos à natalidade, à ampliação do trabalho feminino e de idosos e, mais recentemente, a certa abertura à imigração.',
  ),
  o(
    'facil',
    `Leia o texto.

A Oceania é o continente de menor área e o menos populoso do planeta. É formada pela Austrália (a maior porção de terra), pela Nova Zelândia, pela Papua-Nova Guiné e por milhares de ilhas do Pacífico, agrupadas em três regiões culturais: a Melanésia, a Micronésia e a Polinésia.

De acordo com o texto, a Oceania se caracteriza por`,
    'ser um continente insular, com grande extensão de oceano e poucas terras emersas.',
    [
      'ser formada por uma única massa de terra, sem ilhas.',
      'ser o continente mais populoso do planeta.',
      'estar totalmente localizada no hemisfério norte.',
      'ter a maior área continental do mundo.',
    ],
    'A Oceania reúne a Austrália (continente-ilha), a Nova Zelândia e milhares de ilhas do Pacífico. É o menor continente em área e em população.',
  ),
  o(
    'medio',
    `Leia o texto.

O interior da Austrália é ocupado, em grande parte, por desertos e semidesertos, conhecidos como "outback". As principais cidades do país, como Sydney e Melbourne, ficam no litoral leste e sudeste, onde o clima é mais úmido e há solos mais férteis.

A distribuição da população australiana pelo território é, portanto,`,
    'desigual, concentrada no litoral, onde as condições naturais são mais favoráveis.',
    [
      'homogênea, com a mesma densidade em todo o território.',
      'concentrada no deserto, onde há mais recursos hídricos.',
      'proporcional à área de cada região, em todos os estados.',
      'inexistente no litoral, por causa das altas temperaturas.',
    ],
    'Apesar de ser um país grande, a Austrália tem população concentrada nas áreas litorâneas, principalmente no sudeste, por causa do clima e da disponibilidade de água.',
  ),
  o(
    'medio',
    `Leia o texto.

A economia da Austrália se apoia na exportação de produtos primários, como minério de ferro, carvão, gás e lã, além da agricultura (trigo) e dos serviços. A Nova Zelândia exporta principalmente produtos da pecuária, como leite, carne e lã. Os dois países têm, na Ásia, importantes parceiros comerciais.

Sobre a economia da região, é correto afirmar que`,
    'tem forte participação da mineração e da pecuária nas exportações, com grande integração ao comércio asiático.',
    [
      'é baseada na indústria automobilística e na produção de eletrônicos.',
      'não tem relação comercial com a Ásia, por causa da distância.',
      'se baseia no extrativismo vegetal da floresta equatorial.',
      'depende exclusivamente do turismo, sem produção primária.',
    ],
    'Austrália e Nova Zelândia são países desenvolvidos com economias fortemente ligadas às commodities (minérios, carne, leite, lã), muito exportadas para China, Japão e outros países asiáticos.',
  ),
  o(
    'medio',
    `Leia o texto.

Os povos originários da Oceania, como os aborígenes australianos e os maoris da Nova Zelândia, viviam na região havia milênios quando os britânicos chegaram. A colonização trouxe doenças, perda de terras e proibição de práticas culturais. Em 1840, os britânicos e chefes maoris assinaram o Tratado de Waitangi, que ainda hoje é objeto de debates sobre direitos territoriais e reparações.

Em relação aos povos originários da Oceania, é correto afirmar que`,
    'sofreram os efeitos da colonização e lutam, até hoje, pelo reconhecimento de direitos e territórios.',
    [
      'foram os principais beneficiados pela colonização britânica, sem perdas territoriais.',
      'desapareceram completamente da região antes de 1840.',
      'sempre tiveram direitos territoriais reconhecidos pelos colonizadores.',
      'nunca tiveram contato com os colonizadores europeus.',
    ],
    'A colonização britânica impôs perdas de terra, de população e de cultura aos povos originários. Hoje, aborígenes e maoris reivindicam direitos, reparações e valorização de suas culturas.',
  ),
  o(
    'medio',
    `Leia o texto.

Países como Tuvalu e Kiribati são formados por atóis, ilhas baixas de origem coralínea, cujo ponto mais alto fica a poucos metros acima do nível do mar. Cientistas alertam que o aquecimento global, ao elevar o nível dos oceanos, ameaça a existência desses territórios.

A situação desses países mostra que as mudanças climáticas`,
    'afetam de forma desigual os países, atingindo com mais gravidade os que são pequenos, insulares e de baixa altitude.',
    [
      'atingem apenas países desenvolvidos de grande extensão territorial.',
      'não têm relação com o nível dos oceanos.',
      'beneficiam os países insulares, que ganham mais áreas de terra.',
      'são um problema restrito ao interior dos continentes.',
    ],
    'Os atóis do Pacífico são muito vulneráveis à elevação do mar e a tempestades. Por isso, esses países são vozes importantes nas negociações internacionais sobre o clima.',
  ),
];

/* ------------------------------------------------------ SIMULADO NÍVEL PROVA (10) */

export const GEOGRAFIA_PROVA: QuestaoG2[] = [
  o(
    'medio',
    `Leia o texto.

O terremoto e o tsunami de 2011 atingiram a costa nordeste do Japão, provocando milhares de mortes e danos em uma usina nuclear. Mesmo assim, o país conseguiu reduzir o número de vítimas em comparação a eventos semelhantes em outras regiões do mundo, graças a normas de construção antissísmica, a sistemas de alerta e a treinamentos constantes da população.

O texto permite concluir que, no Japão,`,
    'os fenômenos naturais não podem ser evitados, mas seus impactos são reduzidos por planejamento e prevenção.',
    [
      'a tecnologia eliminou totalmente os riscos de desastres naturais.',
      'os desastres ocorrem por falhas humanas, e não por processos naturais.',
      'não há investimento em prevenção, pois os fenômenos são imprevisíveis.',
      'as áreas costeiras foram abandonadas depois do tsunami.',
    ],
    'O texto diferencia o fenômeno (terremoto, tsunami) do risco e do impacto. Construções preparadas, alertas e educação da população diminuem as perdas, embora não evitem o desastre.',
  ),
  o(
    'dificil',
    `Leia os textos.

TEXTO I
No Japão, uma parte importante da indústria se organiza em torno de grandes grupos empresariais que reúnem bancos, indústrias e empresas comerciais e mantêm uma rede de fornecedores menores.

TEXTO II
O método de produção "toyotista" tem como princípios a produção sob demanda (just-in-time), o controle de qualidade pelos próprios trabalhadores e a redução de estoques.

Os textos permitem afirmar que o modelo industrial japonês se caracterizou por`,
    'integração entre grandes empresas e fornecedores e por um sistema de produção flexível e enxuto.',
    [
      'produção em massa, com grandes estoques e linhas de montagem rígidas.',
      'predomínio de pequenas oficinas artesanais, sem integração entre empresas.',
      'monopólio estatal sobre todas as atividades industriais.',
      'isolamento em relação a fornecedores e a mercados externos.',
    ],
    'Os grupos empresariais (keiretsu) e o toyotismo (just-in-time, qualidade, estoque mínimo) são marcas da indústria japonesa, que se contrapõem ao fordismo (produção em massa, estoques elevados).',
  ),
  o(
    'dificil',
    `Leia o texto.

Nas décadas de 1990 e 2000, a economia japonesa cresceu pouco e sofreu com a deflação (queda geral de preços). Ao mesmo tempo, a população envelhecia e diminuía. O país manteve sua importância tecnológica, com empresas líderes em robótica, automóveis e eletrônicos, e uma moeda considerada segura nos mercados financeiros.

Ao tratar do Japão contemporâneo, o texto permite afirmar que o país`,
    'conciliou desaceleração econômica e envelhecimento populacional com liderança tecnológica em setores de ponta.',
    [
      'continuou crescendo em ritmo acelerado, como no "milagre" do pós-guerra.',
      'perdeu toda a capacidade industrial e passou a depender apenas da agricultura.',
      'abandonou a pesquisa tecnológica, concentrando-se em serviços básicos.',
      'viveu um crescimento populacional intenso, que pressionou o mercado de trabalho.',
    ],
    'O Japão passou por décadas de crescimento fraco e deflação, mas continua entre as economias mais avançadas e tecnológicas, enquanto enfrenta queda e envelhecimento da população.',
  ),
  o(
    'medio',
    `Leia o texto.

O Japão disputa com a Rússia a soberania sobre algumas ilhas ao norte de Hokkaido, as Ilhas Curilas (ou "Territórios do Norte"), ocupadas pela União Soviética ao final da Segunda Guerra. A disputa impede, até hoje, a assinatura de um tratado de paz formal entre os dois países.

A disputa citada no texto tem como origem`,
    'o resultado da Segunda Guerra Mundial e a ocupação soviética de ilhas que o Japão considera suas.',
    [
      'a descoberta de ouro em ilhas desabitadas, no século XXI.',
      'um conflito religioso entre os dois povos desde a Idade Média.',
      'a tentativa do Japão de ocupar a Sibéria, em 2010.',
      'um acordo comercial rompido entre os dois países em 2015.',
    ],
    'A disputa pelas Curilas nasceu da Segunda Guerra, quando a URSS ocupou as ilhas. Rússia (sucessora da URSS) e Japão ainda divergem sobre a soberania, por motivos estratégicos e econômicos (pesca, recursos).',
  ),
  o(
    'medio',
    `Leia o texto.

A agricultura japonesa ocupa áreas pequenas, muitas delas em terraços nas encostas, e usa técnicas intensivas, como adubação e irrigação. O arroz é o principal cultivo. A pesca, tradicional no país, é muito importante para a alimentação, mas o Japão ainda importa grande parte dos alimentos que consome.

Em relação à agricultura do Japão, é correto afirmar que`,
    'é intensiva e de pequena escala, mas insuficiente para abastecer o consumo interno.',
    [
      'é extensiva, em grandes latifúndios, e abastece todo o mercado interno.',
      'é a principal atividade econômica e emprega a maior parte da população.',
      'se baseia em pecuária bovina de corte em amplas pastagens.',
      'é praticada em áreas planas e muito extensas, sem uso de tecnologia.',
    ],
    'O relevo montanhoso limita a terra cultivável. O Japão compensa com técnicas intensivas (terraços, adubos, irrigação) e com a pesca, mas depende de importações de alimentos.',
  ),
  o(
    'medio',
    `Leia o texto.

Muitas ilhas da Polinésia e da Micronésia têm origem vulcânica ou coralínea. Em algumas delas, o turismo é a principal fonte de renda, e a pesca é a base da alimentação. A distância dos grandes mercados, a dependência de importações e a vulnerabilidade a desastres naturais dificultam a diversificação econômica.

Pode-se concluir que as economias das pequenas ilhas do Pacífico`,
    'são frágeis, por dependerem de poucas atividades e de condições externas.',
    [
      'são as mais industrializadas do mundo.',
      'têm grande diversificação econômica e autossuficiência.',
      'dependem de grandes lavouras mecanizadas.',
      'estão a salvo de qualquer risco ambiental.',
    ],
    'Pequena escala, isolamento e vulnerabilidade a ciclones e à elevação do mar tornam essas economias dependentes (turismo, pesca, remessas, ajuda externa).',
  ),
  o(
    'dificil',
    `Leia os textos.

TEXTO I
A Austrália é um país de dimensões continentais, com menos de 30 milhões de habitantes.

TEXTO II
Mais de 80% dos australianos vivem em áreas urbanas, concentrados em poucas cidades do litoral.

Considerando os dois textos, é correto afirmar que a Austrália`,
    'tem baixa densidade demográfica no conjunto do território, mas alta urbanização e concentração populacional no litoral.',
    [
      'tem alta densidade demográfica em todo o território, por causa da grande população.',
      'é um país predominantemente rural, com população espalhada pelo interior.',
      'tem baixa urbanização, pois a maior parte dos habitantes vive no deserto.',
      'tem população homogênea em todas as regiões.',
    ],
    'O texto I indica população pequena em território enorme (baixa densidade média). O II mostra que a população é urbana e litorânea. As duas informações se complementam.',
  ),
  o(
    'medio',
    `Leia o texto.

A Grande Barreira de Corais, no nordeste da Austrália, é o maior sistema de recifes do mundo e abriga enorme biodiversidade. Cientistas associam o aumento da temperatura das águas oceânicas ao branqueamento dos corais, que perdem as algas com as quais vivem em simbiose.

O texto mostra que o aquecimento global pode`,
    'ameaçar ecossistemas marinhos sensíveis, como os recifes de coral.',
    [
      'favorecer a expansão dos recifes, ao aumentar a temperatura dos oceanos.',
      'não ter nenhuma relação com os ambientes marinhos.',
      'afetar apenas ecossistemas de clima frio.',
      'reduzir a biodiversidade somente em áreas desérticas.',
    ],
    'Corais são muito sensíveis a variações de temperatura. O branqueamento ocorre quando a água fica muito quente, o que reduz a biodiversidade e afeta o turismo e a pesca.',
  ),
  o(
    'medio',
    `Leia o texto.

Durante décadas, potências estrangeiras usaram ilhas do Pacífico como locais de testes nucleares. Moradores e povos originários relatam doenças e deslocamentos forçados, e reivindicam reparação e descontaminação ambiental. Hoje, vários países da região atuam em fóruns internacionais pela proteção do oceano e do clima.

O texto mostra que`,
    'a presença de potências estrangeiras na Oceania teve impactos ambientais e sociais duradouros, e os países da região buscam ter voz no cenário internacional.',
    [
      'as ilhas do Pacífico sempre tiveram forte poder militar e econômico.',
      'os testes nucleares foram benéficos para a saúde das populações locais.',
      'não existem organizações regionais de cooperação na Oceania.',
      'os povos da região se omitem em debates internacionais.',
    ],
    'A história colonial e militar deixou marcas (testes nucleares, deslocamentos). Países insulares formam fóruns regionais para defender interesses comuns, como clima, pesca e soberania.',
  ),
  o(
    'dificil',
    `Leia o texto.

Austrália e Nova Zelândia são países desenvolvidos, de língua inglesa, parte do Commonwealth (comunidade de nações vinculadas historicamente ao Reino Unido). Nas últimas décadas, aumentaram as relações econômicas e a imigração com países asiáticos, o que alterou o perfil da população e das parcerias comerciais.

O texto permite concluir que a Oceania contemporânea`,
    'mantém laços históricos com o Reino Unido, mas se aproximou economicamente e demograficamente da Ásia.',
    [
      'rompeu todas as relações com o Reino Unido e adotou o idioma japonês.',
      'não tem relações econômicas com outros continentes.',
      'recebe imigração exclusivamente europeia.',
      'é subdesenvolvida, em razão da fraca ligação com mercados externos.',
    ],
    'Apesar da herança britânica, o Pacífico e a Ásia se tornaram os principais parceiros econômicos da região, o que também trouxe novos fluxos migratórios.',
  ),
];
