import { q, type PacoteSeed } from './helpers';

export const LOTE4_GEOGRAFIA: PacoteSeed[] = [
  {
    topic: 'cartografia', grade: '6º ano', title: 'Cartografia: mapas, escalas e coordenadas', subtitle: 'Orientação, escala, latitude, longitude e fusos',
    resumo: String.raw`## Representar o espaço
A **cartografia** é a ciência e a técnica de produzir mapas, plantas e cartas. Todo mapa tem **título, legenda, escala e orientação**.

## Orientação
A **rosa dos ventos** indica os pontos cardeais (N, S, L, O) e colaterais (NE, SE, NO, SO).

## Escala
Relação entre a medida no mapa e a medida real.
- Escala **1:100 000**: 1 cm no mapa = 100 000 cm = **1 km**.
- Distância real $=$ distância no mapa $\times$ denominador. Com 5 cm em 1:50 000: $5\times50\,000=250\,000\ \text{cm}=2{,}5\ \text{km}$.
- Quanto **menor o denominador**, **maior** a escala e **mais detalhes**: 1:1 000 é maior que 1:1 000 000.

## Coordenadas geográficas
- **Latitude:** distância ao **Equador** (0°), de 0° a 90° norte ou sul. Os **paralelos** são os círculos paralelos ao Equador.
- **Longitude:** distância ao **Meridiano de Greenwich** (0°), de 0° a 180° leste ou oeste. Os **meridianos** vão de polo a polo.

## Fusos horários
A Terra gira 360° em 24 h: **15° de longitude correspondem a 1 hora**.

## Erros comuns
- Confundir latitude (norte-sul) com longitude (leste-oeste).
- Achar que uma escala "maior" tem número maior no denominador.`,
    questoes: [
      q('facil', 'A linha do Equador corresponde a qual latitude?', ['90° norte', '0°', '90° sul', '180°'], 1, 'O Equador é o paralelo de latitude 0°.'),
      q('facil', 'O meridiano de origem da longitude é o de:', ['Greenwich', 'Brasília', 'Nova York', 'Tóquio'], 0, 'O Meridiano de Greenwich tem longitude 0°.'),
      q('facil', 'A rosa dos ventos serve para:', ['indicar a altitude', 'orientação (pontos cardeais)', 'medir temperatura', 'calcular a população'], 1, 'Ela mostra os pontos cardeais e colaterais.'),
      q('medio', 'Em um mapa com escala 1:100 000, 1 cm representa na realidade:', ['100 m', '1 km', '10 km', '100 km'], 1, '100 000 cm = 1 000 m = 1 km.'),
      q('medio', 'Em um mapa de escala 1:50 000, uma distância de 5 cm representa:', ['250 m', '2,5 km', '25 km', '250 km'], 1, '5 × 50 000 = 250 000 cm, que são 2,5 km.'),
      q('medio', 'A latitude de um ponto indica:', ['a distância a leste ou oeste de Greenwich', 'a distância ao Equador, ao norte ou ao sul', 'a altitude do lugar', 'o fuso horário'], 1, 'A latitude mede a posição norte-sul em relação ao Equador.'),
      q('dificil', 'Quantos graus de longitude correspondem, aproximadamente, a 1 hora de diferença de fuso?', ['5°', '10°', '15°', '30°'], 2, 'A Terra gira 360° em 24 horas, ou seja, 15° por hora.'),
      q('dificil', 'Qual das escalas é a MAIOR, ou seja, mostra mais detalhes?', ['1:1 000', '1:50 000', '1:1 000 000', '1:10 000 000'], 0, 'Quanto menor o denominador, maior a escala e maior o detalhamento.'),
    ],
  },
  {
    topic: 'relevo-e-hidrografia', grade: '6º ano', title: 'Relevo e hidrografia', subtitle: 'Formas do relevo, agentes, rios e bacias',
    resumo: String.raw`## Formas de relevo
- **Planaltos:** terrenos elevados e relativamente planos, onde predomina o **desgaste** (erosão). No Brasil, o relevo predominante.
- **Planícies:** terrenos baixos e planos, onde predomina o **acúmulo** de sedimentos.
- **Depressões:** terrenos mais baixos que o entorno.
- **Montanhas:** grandes elevações.

## Agentes do relevo
- **Internos:** tectonismo, **vulcanismo** e **terremotos**, ligados ao movimento das placas.
- **Externos:** **intemperismo** (desgaste das rochas), **erosão** (transporte de material por água, vento e gelo) e sedimentação.

## Hidrografia
- **Bacia hidrográfica:** área drenada por um rio principal e seus **afluentes**.
- **Nascente:** onde o rio nasce. **Foz:** onde desemboca (no mar ou em outro rio).
- A **Bacia Amazônica** é a maior do Brasil e do mundo em volume de água.
- O **Rio São Francisco** é chamado "rio da integração nacional", por ligar Sudeste e Nordeste.
- O **Aquífero Guarani** é uma grande reserva de água subterrânea, sob o território de Brasil, Argentina, Paraguai e Uruguai.

## Erros comuns
- Achar que planalto é terreno baixo.
- Confundir agentes internos (placas, vulcões) com externos (chuva, vento).`,
    questoes: [
      q('facil', 'Qual é o relevo predominante no Brasil?', ['Planaltos', 'Altas montanhas', 'Desertos', 'Geleiras'], 0, 'O território brasileiro é dominado por planaltos, com altitudes em geral modestas.'),
      q('facil', 'A maior bacia hidrográfica do Brasil é a:', ['Amazônica', 'do Paraná', 'do São Francisco', 'do Tocantins'], 0, 'A Bacia Amazônica é a maior do país.'),
      q('facil', 'O local onde um rio desemboca é a:', ['nascente', 'foz', 'montanha', 'planície'], 1, 'A foz é o ponto em que o rio deságua, em outro rio, lago ou no mar.'),
      q('medio', 'São agentes externos de modelagem do relevo:', ['vulcanismo e terremotos', 'erosão e intemperismo', 'movimento das placas apenas', 'tectonismo'], 1, 'Chuva, vento, rios e variações de temperatura desgastam e transportam materiais.'),
      q('medio', 'O Aquífero Guarani é:', ['um rio da Amazônia', 'uma grande reserva de água subterrânea', 'um lago', 'uma montanha'], 1, 'É uma das maiores reservas de água doce subterrânea do mundo.'),
      q('medio', 'A nascente de um rio é:', ['onde ele desemboca', 'onde ele se origina', 'um afluente', 'sua foz'], 1, 'Nascente é o ponto de origem do rio.'),
      q('dificil', 'Terremotos e vulcanismo são exemplos de agentes:', ['internos', 'externos', 'biológicos', 'climáticos'], 0, 'Eles resultam da dinâmica interna da Terra, sobretudo do movimento das placas tectônicas.'),
      q('dificil', 'O Rio São Francisco é conhecido como "rio da integração nacional" porque:', ['liga o Sudeste ao Nordeste', 'é o maior do mundo', 'corta a Amazônia', 'nasce no Peru'], 0, 'Atravessa regiões do Sudeste e do Nordeste, e historicamente serviu de via de ligação.'),
    ],
  },
  {
    topic: 'regioes-do-brasil', grade: '7º ano', title: 'Regiões do Brasil', subtitle: 'As cinco regiões do IBGE, estados e características',
    resumo: String.raw`## Divisão regional
O IBGE divide o Brasil em **5 regiões**: **Norte, Nordeste, Centro-Oeste, Sudeste e Sul**. São **26 estados e o Distrito Federal** (27 unidades da federação).

## Quem é quem
- **Norte (7 estados):** a maior em área. Floresta Amazônica e Zona Franca de Manaus.
- **Nordeste (9 estados):** litoral extenso, sertão semiárido, forte patrimônio cultural.
- **Centro-Oeste (3 estados + DF):** Cerrado, Pantanal e agronegócio. **Brasília**, a capital, fica aqui.
- **Sudeste (4 estados):** a **mais populosa**, mais industrializada e mais urbana. SP, RJ, MG, ES.
- **Sul (3 estados):** PR, SC e RS. Agricultura familiar, imigração europeia e clima subtropical.

## Para memorizar
A maior em área é o **Norte**. A mais populosa é o **Sudeste**. O Nordeste tem **9 estados**.

## Erros comuns
- Achar que Brasília é do Sudeste (é do Centro-Oeste).
- Confundir o número de estados de cada região.`,
    questoes: [
      q('facil', 'Quantas regiões o IBGE reconhece no Brasil?', ['3', '4', '5', '6'], 2, 'São cinco: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.'),
      q('facil', 'Qual é a maior região do Brasil em extensão territorial?', ['Norte', 'Sul', 'Sudeste', 'Nordeste'], 0, 'O Norte ocupa quase metade do território nacional.'),
      q('facil', 'Qual é a região mais populosa do país?', ['Norte', 'Sudeste', 'Sul', 'Centro-Oeste'], 1, 'O Sudeste concentra a maior parte da população brasileira.'),
      q('medio', 'Quantos estados tem o Brasil, sem contar o Distrito Federal?', ['24', '25', '26', '27'], 2, 'São 26 estados e o Distrito Federal, totalizando 27 unidades da federação.'),
      q('medio', 'Quais são os estados da região Sul?', ['PR, SC e RS', 'SP, RJ e MG', 'BA, SE e AL', 'MT, MS e GO'], 0, 'A região Sul é formada por Paraná, Santa Catarina e Rio Grande do Sul.'),
      q('medio', 'Em qual região está a capital federal, Brasília?', ['Sudeste', 'Centro-Oeste', 'Norte', 'Nordeste'], 1, 'Brasília fica no Distrito Federal, na região Centro-Oeste.'),
      q('dificil', 'Qual região é formada por 9 estados?', ['Norte', 'Nordeste', 'Sudeste', 'Sul'], 1, 'O Nordeste tem 9 estados: MA, PI, CE, RN, PB, PE, AL, SE e BA.'),
      q('dificil', 'O Pantanal está localizado principalmente na região:', ['Norte', 'Sul', 'Centro-Oeste', 'Sudeste'], 2, 'O Pantanal ocupa áreas do Mato Grosso e do Mato Grosso do Sul.'),
    ],
  },
  {
    topic: 'populacao-brasileira', grade: '7º ano', title: 'População brasileira', subtitle: 'Formação, distribuição, densidade e envelhecimento',
    resumo: String.raw`## Formação
A população brasileira é resultado da **miscigenação** entre **povos indígenas**, **europeus** (portugueses e, depois, italianos, alemães e outros), **africanos escravizados** e **imigrantes** de várias origens (japoneses, sírio-libaneses etc.). O Brasil tem hoje cerca de **203 milhões** de habitantes (Censo 2022).

## Distribuição
É **desigual**: a maior parte vive no **litoral** e no **Sudeste**; o interior, como a Amazônia, é menos povoado.

## Densidade demográfica
$$\text{densidade}=\frac{\text{população}}{\text{área (km}^2)}$$
Uma cidade com 1 000 habitantes em 10 km² tem **100 hab/km²**.

## Urbanização
A maior parte da população vive em **áreas urbanas**, resultado do êxodo rural na segunda metade do século XX.

## Mudança da pirâmide etária
A **natalidade caiu** e a **expectativa de vida aumentou**: a população está **envelhecendo**, e a base da pirâmide se estreita.

## Erros comuns
- Confundir população absoluta com densidade.
- Achar que a população se distribui de forma uniforme.`,
    questoes: [
      q('facil', 'A formação do povo brasileiro teve como base principalmente:', ['indígenas, europeus e africanos', 'apenas europeus', 'apenas asiáticos', 'apenas africanos'], 0, 'Houve forte miscigenação entre indígenas, europeus e africanos, e depois outros imigrantes.'),
      q('facil', 'A densidade demográfica é calculada dividindo:', ['a área pela população', 'a população pela área', 'a renda pela população', 'o PIB pela área'], 1, 'Densidade = habitantes ÷ km².'),
      q('facil', 'A maior parte da população brasileira vive:', ['em áreas urbanas', 'no campo', 'na floresta', 'em ilhas'], 0, 'A população é majoritariamente urbana.'),
      q('medio', 'Qual região brasileira apresenta a maior densidade demográfica?', ['Norte', 'Centro-Oeste', 'Sudeste', 'Sul, apenas'], 2, 'O Sudeste concentra muita gente em pouca área relativa.'),
      q('medio', 'Uma cidade tem 1 000 habitantes em uma área de 10 km². Qual é a densidade demográfica?', ['10 hab/km²', '100 hab/km²', '1 000 hab/km²', '10 000 hab/km²'], 1, '1 000 ÷ 10 = 100 hab/km².'),
      q('medio', 'Os imigrantes que chegaram ao Brasil no século XIX e início do XX incluem principalmente:', ['italianos, alemães e japoneses', 'apenas ingleses', 'somente franceses', 'canadenses'], 0, 'Eles se instalaram no Sudeste e no Sul, sobretudo para trabalhar na lavoura e na indústria.'),
      q('dificil', 'O envelhecimento da população brasileira é explicado por:', ['queda da natalidade e aumento da expectativa de vida', 'aumento da natalidade', 'aumento da mortalidade infantil', 'emigração em massa'], 0, 'Menos nascimentos e mais longevidade aumentam a proporção de idosos.'),
      q('dificil', 'A distribuição da população brasileira é:', ['igual em todo o território', 'desigual, concentrada no litoral e no Sudeste', 'concentrada na Amazônia', 'concentrada no interior do Nordeste'], 1, 'A ocupação histórica pelo litoral e a industrialização concentraram a população.'),
    ],
  },
  {
    topic: 'globalizacao', grade: '8º ano', title: 'Globalização e blocos econômicos', subtitle: 'Integração mundial, empresas transnacionais e blocos',
    resumo: String.raw`## O que é
A **globalização** é a crescente **integração** econômica, cultural e tecnológica entre países, impulsionada por transportes, telecomunicações e **internet**, que encurtam distâncias.

## Agentes
- **Empresas transnacionais:** atuam em vários países (produzem em um, vendem em outros).
- **Organizações internacionais:** como a **OMC**, que regula o comércio mundial.

## Vantagens e problemas
- Mais comércio, acesso a produtos e informação, difusão tecnológica.
- Mas também **desigualdade** entre países e dentro deles, desemprego em setores que migram, **homogeneização cultural** (padronização de hábitos de consumo) e impactos ambientais.

## Blocos econômicos
Grupos de países que reduzem barreiras comerciais entre si.
- **Mercosul:** Brasil, Argentina, Paraguai e Uruguai, na América do Sul.
- **União Europeia:** livre circulação e moeda comum, o **euro** (em parte dos países).
- **USMCA/Nafta:** EUA, México e Canadá.
- **BRICS:** Brasil, Rússia, Índia, China e África do Sul.

## Erros comuns
- Achar que globalização é só economia (é também cultural e tecnológica).
- Achar que todos os países ganham igualmente.`,
    questoes: [
      q('facil', 'A globalização é, principalmente:', ['o isolamento dos países', 'a integração econômica, cultural e tecnológica entre países', 'o fim do comércio', 'a divisão da Terra em continentes'], 1, 'É o aumento da interdependência entre países e povos.'),
      q('facil', 'O Mercosul é um bloco econômico da:', ['América do Sul', 'Europa', 'Ásia', 'África'], 0, 'Reúne Brasil, Argentina, Paraguai e Uruguai, entre outros membros e associados.'),
      q('facil', 'As empresas transnacionais são aquelas que:', ['atuam em vários países', 'só existem em um estado', 'não vendem produtos', 'pertencem sempre ao governo'], 0, 'Elas têm fábricas, escritórios ou vendas em diversos países.'),
      q('medio', 'Qual tecnologia mais contribuiu para encurtar distâncias na globalização?', ['Internet e telecomunicações', 'Tração animal', 'Arados', 'Carroças'], 0, 'As telecomunicações e a internet permitem comunicação e comércio instantâneos.'),
      q('medio', 'A União Europeia tem em parte de seus países uma moeda comum, o:', ['dólar', 'euro', 'real', 'iene'], 1, 'O euro é usado por parte dos países-membros da União Europeia.'),
      q('medio', 'Uma crítica comum à globalização é que ela:', ['pode aumentar desigualdades e padronizar culturas', 'acabou com o comércio', 'eliminou a tecnologia', 'impediu a comunicação'], 0, 'Há ganhos, mas os benefícios não se distribuem igualmente.'),
      q('dificil', 'Quais países formam os BRICS originais (e a África do Sul)?', ['Brasil, Rússia, Índia e China', 'EUA, Canadá e México', 'França, Alemanha e Itália', 'Japão, Coreia e Taiwan'], 0, 'BRICS é a sigla de Brasil, Rússia, Índia, China e África do Sul.'),
      q('dificil', 'A "homogeneização cultural" significa:', ['a tendência de padronização de hábitos e consumo pelo mundo', 'o fim de todas as culturas', 'a proibição de festas locais', 'o isolamento cultural'], 0, 'Produtos, músicas e modas globais tendem a se espalhar e padronizar costumes.'),
    ],
  },
  {
    topic: 'climas-e-biomas', grade: '1ª série EM', title: 'Climas e biomas do Brasil', subtitle: 'Tipos de clima e características dos seis grandes biomas',
    resumo: String.raw`## Climas do Brasil
- **Equatorial:** quente e úmido o ano todo, chuvas abundantes (Amazônia).
- **Tropical:** verão chuvoso e inverno seco (Centro-Oeste, parte do Sudeste).
- **Tropical de altitude:** mais ameno por causa do relevo (serras do Sudeste).
- **Tropical atlântico (litorâneo úmido):** chuvas no litoral.
- **Semiárido:** chuvas escassas e irregulares, secas prolongadas (**sertão nordestino**).
- **Subtropical:** estações bem definidas, geadas ocasionais (Sul).

## Biomas
- **Amazônia:** o **maior** bioma, floresta equatorial de enorme biodiversidade.
- **Cerrado:** savana com árvores de troncos retorcidos e raízes profundas; "**berço das águas**", pois nascem rios de grandes bacias.
- **Mata Atlântica:** o bioma **mais devastado**, hoje restam poucos remanescentes.
- **Caatinga:** vegetação adaptada à seca, **exclusivamente brasileira**.
- **Pantanal:** a maior **planície alagável** do mundo (MT e MS).
- **Pampa:** campos (gramíneas) no **Rio Grande do Sul**.

## Erros comuns
- Achar que a Amazônia tem clima tropical seco (é equatorial).
- Achar que a Caatinga é um deserto sem vida.`,
    questoes: [
      q('facil', 'Qual é o maior bioma do Brasil?', ['Cerrado', 'Amazônia', 'Pampa', 'Caatinga'], 1, 'A Amazônia ocupa a maior extensão do território.'),
      q('facil', 'Qual bioma é exclusivamente brasileiro?', ['Caatinga', 'Amazônia', 'Pampa', 'Pantanal'], 0, 'A Caatinga existe somente no Brasil.'),
      q('facil', 'O Pampa está localizado principalmente no estado do:', ['Pará', 'Rio Grande do Sul', 'Bahia', 'Amazonas'], 1, 'O Pampa é o bioma dos campos do extremo sul do país.'),
      q('medio', 'O clima semiárido predomina no:', ['sertão nordestino', 'litoral do Sul', 'Pantanal', 'interior da Amazônia'], 0, 'No sertão, as chuvas são escassas e irregulares.'),
      q('medio', 'O Cerrado é chamado de "berço das águas" porque:', ['tem muitos lagos congelados', 'nele nascem rios de grandes bacias hidrográficas', 'é o bioma mais chuvoso', 'tem mares'], 1, 'Nascentes do Cerrado alimentam bacias como a do São Francisco, Tocantins e Paraná.'),
      q('medio', 'Qual bioma brasileiro é o mais devastado?', ['Amazônia', 'Mata Atlântica', 'Pantanal', 'Pampa'], 1, 'A Mata Atlântica perdeu a maior parte de sua cobertura original.'),
      q('dificil', 'O clima equatorial é caracterizado por:', ['chuvas escassas', 'temperaturas altas e muita umidade o ano todo', 'geadas frequentes', 'invernos rigorosos'], 1, 'Calor e chuvas abundantes ao longo de todo o ano, como na Amazônia.'),
      q('dificil', 'O Pantanal é:', ['a maior planície alagável do mundo', 'um deserto', 'uma serra', 'um grande lago congelado'], 0, 'Fica no Mato Grosso e no Mato Grosso do Sul e é inundado periodicamente.'),
    ],
  },
  {
    topic: 'urbanizacao', grade: '2ª série EM', title: 'Urbanização', subtitle: 'Êxodo rural, metrópoles, conurbação e problemas urbanos',
    resumo: String.raw`## O processo
**Urbanização** é o aumento da proporção da população que vive em cidades. No Brasil, foi **rápida a partir da década de 1950**, com a industrialização e o **êxodo rural**: migração do campo para a cidade em busca de emprego.

## Rede urbana
- **Metrópole:** grande cidade que influencia uma ampla região. **São Paulo** é a metrópole nacional.
- **Região metropolitana:** metrópole e municípios vizinhos integrados.
- **Conurbação:** quando a expansão de cidades vizinhas **junta** suas áreas urbanas.

## Problemas urbanos
- **Déficit habitacional** e favelas, por falta de moradia acessível.
- **Mobilidade:** trânsito e transporte público insuficiente.
- **Saneamento** deficiente e poluição.
- **Enchentes:** a **impermeabilização do solo** (asfalto, concreto) impede a água de infiltrar.
- **Ilhas de calor:** áreas urbanas ficam mais quentes que o entorno arborizado.

## Planejamento
O **plano diretor** é o instrumento que orienta o crescimento e o uso do solo urbano.

## Erros comuns
- Achar que cidade grande é só sinônimo de problema (é também centro de serviços e cultura).
- Esquecer a relação entre impermeabilização e enchentes.`,
    questoes: [
      q('facil', 'O êxodo rural é a migração:', ['da cidade para o campo', 'do campo para a cidade', 'entre países', 'entre continentes'], 1, 'Pessoas deixam o campo em busca de emprego e serviços urbanos.'),
      q('facil', 'A metrópole nacional do Brasil é:', ['São Paulo', 'Manaus', 'Curitiba', 'Brasília'], 0, 'São Paulo exerce influência sobre todo o país.'),
      q('facil', 'A conurbação ocorre quando:', ['uma cidade some', 'a expansão urbana junta áreas de cidades vizinhas', 'um rio muda de curso', 'uma floresta cresce'], 1, 'As áreas urbanas de cidades vizinhas passam a formar um só aglomerado.'),
      q('medio', 'A impermeabilização do solo nas cidades contribui para:', ['mais infiltração de água', 'enchentes', 'redução de calor', 'aumento de rios'], 1, 'Asfalto e concreto impedem a infiltração, e a água escorre rapidamente, causando alagamentos.'),
      q('medio', 'A urbanização brasileira se acelerou principalmente:', ['no século XVI', 'na segunda metade do século XX', 'no século XVIII', 'só no século XXI'], 1, 'A industrialização e o êxodo rural aceleraram o processo a partir de 1950.'),
      q('medio', 'Uma "ilha de calor" é:', ['uma área da cidade mais quente que o entorno', 'uma ilha do litoral', 'uma região gelada', 'um tipo de chuva'], 0, 'Concreto, asfalto e pouca vegetação elevam a temperatura nas áreas urbanas.'),
      q('dificil', 'O plano diretor é:', ['um instrumento de planejamento do crescimento e do uso do solo urbano', 'o mapa do metrô', 'uma lei sobre trânsito', 'um tipo de moradia'], 0, 'Orienta a ocupação da cidade, a infraestrutura e a proteção ambiental.'),
      q('dificil', 'Um problema típico das grandes cidades brasileiras é:', ['déficit habitacional e favelas', 'excesso de áreas verdes', 'falta de pessoas', 'ausência de comércio'], 0, 'A falta de moradia acessível leva à ocupação de áreas precárias.'),
    ],
  },
  {
    topic: 'questao-ambiental', grade: '3ª série EM', title: 'Questão ambiental', subtitle: 'Desmatamento, mudanças climáticas e acordos internacionais',
    resumo: String.raw`## Problemas principais
- **Desmatamento e queimadas:** perda de biodiversidade, emissão de $CO_2$ e alteração do clima e do ciclo da água. Na Amazônia, a floresta devolve umidade à atmosfera (os "**rios voadores**").
- **Mudanças climáticas:** aumento da temperatura média pela intensificação do **efeito estufa**, principalmente pelo $CO_2$ da queima de combustíveis fósseis.
- **Poluição** do ar, da água e do solo; **perda de biodiversidade**.

## Desenvolvimento sustentável
Conceito difundido em 1987 (Relatório Brundtland): atender às necessidades **atuais sem comprometer** as das **gerações futuras**.

## Acordos e conferências
- **Rio-92 (Eco-92):** realizada no **Rio de Janeiro**, consolidou a agenda ambiental global.
- **Protocolo de Kyoto (1997):** metas de redução de emissões para países desenvolvidos.
- **Acordo de Paris (2015):** manter o aquecimento global **bem abaixo de 2 °C**, buscando limitar a **1,5 °C**.

## Proteção
**Unidades de conservação** (parques nacionais, reservas) protegem áreas naturais. Também: reciclagem, energia renovável, fiscalização.

## Erros comuns
- Achar que o efeito estufa em si é o problema (é o **excesso**).
- Achar que a floresta só importa para quem mora nela.`,
    questoes: [
      q('facil', 'A Rio-92 (Eco-92) foi uma conferência ambiental realizada:', ['em Paris', 'no Rio de Janeiro', 'em Tóquio', 'em Nova York'], 1, 'A Conferência das Nações Unidas sobre Meio Ambiente e Desenvolvimento ocorreu no Rio de Janeiro em 1992.'),
      q('facil', 'O Acordo de Paris, de 2015, trata principalmente de:', ['comércio de armas', 'metas para conter as mudanças climáticas', 'direitos autorais', 'transporte aéreo'], 1, 'Busca reduzir emissões e limitar o aquecimento global.'),
      q('facil', 'O desmatamento consiste em:', ['remoção da cobertura vegetal', 'plantio de árvores', 'criação de parques', 'despoluição de rios'], 0, 'É a retirada da vegetação natural de uma área.'),
      q('medio', 'Desenvolvimento sustentável é aquele que:', ['atende às necessidades atuais sem comprometer as das gerações futuras', 'ignora o meio ambiente', 'só valoriza o lucro imediato', 'proíbe qualquer atividade econômica'], 0, 'É a ideia de equilibrar economia, sociedade e meio ambiente.'),
      q('medio', 'Qual gás é o principal responsável pelo agravamento do efeito estufa por atividades humanas?', ['Gás carbônico (CO₂)', 'Oxigênio', 'Nitrogênio', 'Hélio'], 0, 'A queima de combustíveis fósseis e o desmatamento aumentam o CO₂ na atmosfera.'),
      q('medio', 'Unidades de conservação, como os parques nacionais, servem para:', ['proteger áreas naturais', 'construir cidades', 'extrair petróleo', 'abrir estradas'], 0, 'São áreas legalmente protegidas, com regras de uso.'),
      q('dificil', 'A meta de longo prazo do Acordo de Paris é manter o aquecimento global:', ['bem abaixo de 2 °C, buscando limitar a 1,5 °C', 'acima de 5 °C', 'exatamente 10 °C', 'sem metas'], 0, 'O acordo busca conter o aquecimento em relação ao período pré-industrial.'),
      q('dificil', 'O desmatamento da Amazônia afeta o clima porque:', ['a floresta ajuda a regular a umidade e as chuvas e armazena carbono', 'os rios secam por causa da luz', 'a floresta aumenta o CO₂', 'não tem relação alguma'], 0, 'A floresta devolve vapor de água ao ar e guarda grandes quantidades de carbono.'),
    ],
  },
];
