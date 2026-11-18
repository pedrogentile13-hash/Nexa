import { q, type PacoteSeed } from './helpers';

export const LOTE3_CIENCIAS: PacoteSeed[] = [
  {
    topic: 'misturas-e-separacao', grade: '6º ano', title: 'Misturas e separação de materiais', subtitle: 'Misturas homogêneas e heterogêneas e como separá-las',
    resumo: String.raw`## Substância e mistura
**Substância pura** tem composição fixa (água destilada). **Mistura** reúne duas ou mais substâncias.

## Homogênea × heterogênea
- **Homogênea:** uma única fase visível. Sal dissolvido em água.
- **Heterogênea:** duas ou mais fases. Água com areia, água com óleo.

Fase é cada porção uniforme da mistura. Água, óleo e cubos de gelo formam 3 fases.

## Métodos de separação
- **Catação:** escolher à mão (feijão).
- **Peneiração:** separa sólidos de tamanhos diferentes.
- **Separação magnética:** o ímã atrai ferro e separa de areia.
- **Filtração:** separa sólido de líquido com filtro (areia e água).
- **Decantação:** deixar repousar e separar líquidos que não se misturam (água e óleo).
- **Evaporação:** a água evapora e o sal fica (salinas).
- **Destilação:** separa líquidos ou recupera a água de uma solução: a água evapora, condensa e é recolhida.

## Como escolher
Observe o que muda entre os componentes: tamanho, magnetismo, solubilidade, ponto de ebulição.

## Erros comuns
- Achar que "transparente" é sempre substância pura (água com sal é mistura).
- Confundir filtração com decantação.`,
    questoes: [
      q('facil', 'Uma mistura de água e areia é:', ['homogênea', 'heterogênea', 'uma substância pura', 'uma solução'], 1, 'Dá para ver duas fases (a areia e a água), então a mistura é heterogênea.'),
      q('facil', 'Sal totalmente dissolvido em água forma uma mistura:', ['homogênea', 'heterogênea', 'com 2 fases', 'impossível'], 0, 'O sal dissolvido não se distingue da água: há uma única fase, uma mistura homogênea.'),
      q('facil', 'Qual método usa um ímã para separar os componentes de uma mistura?', ['Filtração', 'Separação magnética', 'Destilação', 'Peneiração'], 1, 'O ímã atrai materiais como o ferro e os separa de outros, como areia.'),
      q('medio', 'Qual método é adequado para separar areia da água?', ['Filtração', 'Destilação', 'Separação magnética', 'Catação do sal'], 0, 'O filtro retém o sólido (areia) e deixa a água passar.'),
      q('medio', 'Para obter sal a partir da água do mar, nas salinas, usa-se principalmente a:', ['catação', 'evaporação', 'separação magnética', 'filtração'], 1, 'A água evapora pelo calor do Sol e o sal cristaliza.'),
      q('medio', 'Qual método separa água e óleo?', ['Decantação', 'Evaporação', 'Peneiração', 'Separação magnética'], 0, 'Os líquidos não se misturam; deixando em repouso, o óleo fica por cima e é separado.'),
      q('dificil', 'Como obter água pura a partir de água salgada, recolhendo a própria água?', ['Filtração', 'Decantação', 'Destilação', 'Peneiração'], 2, 'Na destilação, a água evapora, condensa em outro recipiente e deixa o sal para trás.'),
      q('dificil', 'Um copo contém água, óleo e cubos de gelo. Quantas fases tem essa mistura?', ['1', '2', '3', '4'], 2, 'São três fases: água líquida, óleo e gelo (água sólida).'),
    ],
  },
  {
    topic: 'terra-e-universo', grade: '6º ano', title: 'Terra e Universo: movimentos e estações', subtitle: 'Rotação, translação, estações, fases da Lua e eclipses',
    resumo: String.raw`## Os dois movimentos da Terra
- **Rotação:** giro em torno do próprio eixo, em cerca de **24 horas**. Causa o dia e a noite.
- **Translação:** volta em torno do Sol, em cerca de **365 dias** (um ano). Como dura 365,25 dias, a cada 4 anos há um ano bissexto de 366 dias.

## Estações do ano
O eixo da Terra é **inclinado**. Conforme a Terra se desloca, cada hemisfério recebe luz mais direta ou mais inclinada. Não é a distância ao Sol que causa as estações. Quando é verão no hemisfério sul, é inverno no norte.

## A Lua
A Lua leva cerca de **29,5 dias** para repetir suas fases (nova, crescente, cheia, minguante), que dependem de quanto da face iluminada vemos.

## Eclipses
- **Solar:** a Lua passa entre o Sol e a Terra.
- **Lunar:** a Terra fica entre o Sol e a Lua.

## Sistema Solar
O Sol é uma estrela. Há 8 planetas: Mercúrio, Vênus, **Terra** (3º a partir do Sol), Marte, Júpiter, Saturno, Urano e Netuno.

## Erros comuns
- Achar que o verão ocorre quando a Terra está mais perto do Sol.
- Confundir rotação com translação.`,
    questoes: [
      q('facil', 'O movimento de rotação da Terra é o responsável por:', ['as estações do ano', 'o dia e a noite', 'as fases da Lua', 'os eclipses'], 1, 'Ao girar em torno do próprio eixo em cerca de 24 h, cada região fica ora voltada para o Sol, ora não.'),
      q('facil', 'A translação da Terra em torno do Sol dura aproximadamente:', ['24 horas', '30 dias', '365 dias', '10 anos'], 2, 'A translação leva cerca de 365 dias, o que define o ano.'),
      q('facil', 'Contando a partir do Sol, a Terra é o:', ['1º planeta', '2º planeta', '3º planeta', '4º planeta'], 2, 'A ordem é Mercúrio, Vênus, Terra, Marte...'),
      q('medio', 'A principal causa das estações do ano é:', ['a distância entre a Terra e o Sol', 'a inclinação do eixo da Terra', 'as fases da Lua', 'a rotação da Terra'], 1, 'Como o eixo é inclinado, a incidência da luz solar varia em cada hemisfério ao longo do ano.'),
      q('medio', 'As fases da Lua se repetem em um período de cerca de:', ['1 dia', '7 dias', '29,5 dias', '365 dias'], 2, 'O ciclo lunar completo (de uma lua nova à próxima) dura cerca de 29,5 dias.'),
      q('medio', 'Um eclipse solar ocorre quando:', ['a Terra fica entre o Sol e a Lua', 'a Lua fica entre o Sol e a Terra', 'o Sol fica entre a Terra e a Lua', 'a Lua está na fase cheia'], 1, 'A Lua encobre o Sol visto da Terra, o que só acontece na lua nova.'),
      q('dificil', 'Quando é verão no hemisfério sul, no hemisfério norte é:', ['verão também', 'inverno', 'primavera', 'sempre outono'], 1, 'Os hemisférios recebem luz de modo oposto: a estação do norte é a oposta à do sul.'),
      q('dificil', 'Por que existe um ano bissexto, de 366 dias, a cada 4 anos?', ['Porque a rotação dura 25 horas', 'Porque a translação dura cerca de 365,25 dias', 'Porque a Lua gira 4 vezes', 'Porque o Sol muda de posição'], 1, 'O 0,25 de dia a mais, acumulado por 4 anos, soma 1 dia inteiro.'),
    ],
  },
  {
    topic: 'camadas-da-terra', grade: '6º ano', title: 'Camadas da Terra e rochas', subtitle: 'Crosta, manto, núcleo e os três tipos de rocha',
    resumo: String.raw`## Estrutura interna
Do exterior para o centro:
1. **Crosta:** camada mais externa e fina, onde vivemos.
2. **Manto:** camada intermediária, de rocha muito quente, parcialmente pastosa.
3. **Núcleo:** o **externo** é líquido e o **interno** é sólido (metais, sobretudo ferro e níquel).

## Os três tipos de rocha
- **Ígneas (magmáticas):** formadas pelo resfriamento do magma ou da lava. Granito, basalto.
- **Sedimentares:** formadas pelo acúmulo e compactação de sedimentos. Arenito, calcário. **Os fósseis** costumam estar aqui.
- **Metamórficas:** rochas que se transformam por calor e pressão. O **mármore** vem do calcário; o gnaisse vem do granito.

## Ciclo das rochas
Uma rocha pode se transformar em outra ao longo de milhões de anos: erosão, sedimentação, aquecimento, fusão e solidificação.

## Solo
Forma-se pela decomposição das rochas (intemperismo) e pela matéria orgânica.

## Erros comuns
- Achar que o núcleo inteiro é líquido (o interno é sólido).
- Esperar fósseis em rochas ígneas (o calor os destruiria).`,
    questoes: [
      q('facil', 'Qual é a camada mais externa da Terra?', ['Manto', 'Crosta', 'Núcleo externo', 'Núcleo interno'], 1, 'A crosta é a camada fina onde vivemos.'),
      q('facil', 'As rochas formadas pelo resfriamento do magma são as:', ['ígneas', 'sedimentares', 'metamórficas', 'orgânicas'], 0, 'Rocha ígnea ou magmática vem da solidificação do magma (ou da lava).'),
      q('facil', 'Em qual tipo de rocha costumam ser encontrados os fósseis?', ['Ígneas', 'Sedimentares', 'Metamórficas', 'Em nenhuma'], 1, 'Os restos de seres vivos são soterrados em sedimentos, que se compactam e formam rochas sedimentares.'),
      q('medio', 'Qual camada fica entre a crosta e o núcleo?', ['Atmosfera', 'Manto', 'Litosfera externa', 'Hidrosfera'], 1, 'O manto é a camada intermediária da Terra.'),
      q('medio', 'O núcleo externo da Terra é:', ['sólido', 'líquido', 'gasoso', 'vazio'], 1, 'O núcleo externo é líquido e o interno é sólido, por causa da enorme pressão.'),
      q('medio', 'O mármore é uma rocha:', ['ígnea', 'sedimentar', 'metamórfica', 'orgânica'], 2, 'O mármore se forma quando o calcário sofre alta pressão e temperatura.'),
      q('dificil', 'Qual sequência apresenta as camadas da Terra do centro para a superfície?', ['Crosta, manto, núcleo', 'Núcleo, manto, crosta', 'Manto, núcleo, crosta', 'Núcleo, crosta, manto'], 1, 'Do centro para fora: núcleo, manto e crosta.'),
      q('dificil', 'Uma rocha sedimentar se forma principalmente por:', ['resfriamento do magma', 'acúmulo e compactação de sedimentos', 'fusão completa de outra rocha', 'queima de combustíveis'], 1, 'Fragmentos de outras rochas e restos orgânicos se acumulam em camadas e são compactados.'),
    ],
  },
  {
    topic: 'ar-e-clima', grade: '7º ano', title: 'Ar, atmosfera e clima', subtitle: 'Composição do ar, camadas, efeito estufa e tempo × clima',
    resumo: String.raw`## Composição do ar
Cerca de **78% de nitrogênio** ($N_2$), **21% de oxigênio** ($O_2$) e cerca de 1% de outros gases (argônio, gás carbônico $CO_2$ etc.). O $CO_2$ é só cerca de 0,04%, mas é muito importante para o clima.

## Camadas da atmosfera
A **troposfera** é a mais próxima do solo: concentra o ar que respiramos, as nuvens e os fenômenos do tempo. Na estratosfera fica a **camada de ozônio**, que filtra boa parte da radiação ultravioleta (UV) do Sol.

## Efeito estufa
Alguns gases ($CO_2$, metano, vapor de água) retêm parte do calor, mantendo a Terra aquecida. O efeito natural é **essencial** à vida. O problema é o **excesso**: queimar combustíveis fósseis e desmatar aumenta o $CO_2$ e contribui para o **aquecimento global**.

## Tempo × clima
- **Tempo:** condição da atmosfera em um momento e lugar (hoje chove).
- **Clima:** padrão do tempo ao longo de muitos anos (clima tropical úmido).

## Erros comuns
- Confundir efeito estufa (natural) com aquecimento global (intensificação).
- Achar que o ar é só oxigênio.`,
    questoes: [
      q('facil', 'Qual é o gás mais abundante no ar atmosférico?', ['Oxigênio', 'Nitrogênio', 'Gás carbônico', 'Hidrogênio'], 1, 'O nitrogênio forma cerca de 78% do ar. O oxigênio, cerca de 21%.'),
      q('facil', 'Qual camada da atmosfera filtra grande parte da radiação ultravioleta?', ['Camada de ozônio', 'Troposfera', 'Camada de nuvens', 'Camada de nitrogênio'], 0, 'O ozônio absorve boa parte da radiação UV, que prejudica os seres vivos.'),
      q('facil', 'Qual gás é considerado o principal responsável pelo aumento do efeito estufa causado pelas atividades humanas?', ['Oxigênio', 'Nitrogênio', 'Gás carbônico', 'Hélio'], 2, 'A queima de combustíveis fósseis libera CO₂, que retém calor na atmosfera.'),
      q('medio', 'A diferença entre tempo e clima é que:', ['são a mesma coisa', 'tempo é a condição do momento e clima é o padrão de longo prazo', 'clima muda a cada hora', 'tempo só vale para o inverno'], 1, 'Tempo é a situação momentânea; clima é o comportamento médio ao longo de muitos anos.'),
      q('medio', 'Aproximadamente qual porcentagem do ar é formada por oxigênio?', ['1%', '21%', '50%', '78%'], 1, 'O ar tem cerca de 21% de oxigênio.'),
      q('medio', 'Em qual camada da atmosfera ocorrem as nuvens e a chuva?', ['Troposfera', 'Estratosfera', 'Termosfera', 'Exosfera'], 0, 'A troposfera é a camada mais baixa e concentra os fenômenos do tempo.'),
      q('dificil', 'O efeito estufa natural é importante porque:', ['destrói a camada de ozônio', 'mantém a Terra aquecida o bastante para a vida', 'aumenta a quantidade de oxigênio', 'impede a chuva'], 1, 'Sem o efeito estufa natural, a Terra seria muito mais fria. O problema é o excesso.'),
      q('dificil', 'Uma consequência provável do aumento dos gases de efeito estufa é:', ['o resfriamento do planeta', 'o aquecimento global', 'o fim da chuva', 'o aumento da camada de ozônio'], 1, 'Mais gases retendo calor levam ao aumento da temperatura média do planeta.'),
    ],
  },
  {
    topic: 'maquinas-e-calor', grade: '7º ano', title: 'Máquinas simples e calor', subtitle: 'Alavancas, plano inclinado, roldanas e propagação do calor',
    resumo: String.raw`## Máquinas simples
Facilitam o trabalho, reduzindo a força necessária ou mudando a sua direção. Não "criam" energia.

- **Alavanca:** barra que gira em torno de um ponto de apoio (gangorra, tesoura, carrinho de mão).
- **Plano inclinado:** rampa. Quanto **mais longa** for a rampa (para a mesma altura), **menor** o esforço, mas maior o caminho.
- **Roldana fixa:** muda a **direção** da força. A roldana móvel também reduz a força.

## Calor
Energia térmica que passa do corpo **mais quente** para o **mais frio**, até o equilíbrio térmico.

## Formas de propagação
- **Condução:** em sólidos, de partícula a partícula (o cabo da colher esquenta). Por isso cabos de panela são de **isolantes** (madeira, plástico).
- **Convecção:** em fluidos (líquidos e gases), por correntes: o ar quente sobe e o frio desce. Explica as brisas.
- **Irradiação:** por ondas, inclusive no vácuo (calor do Sol).

## Erros comuns
- Achar que o frio "entra" no corpo: é o calor que sai.
- Achar que a máquina simples diminui o trabalho total.`,
    questoes: [
      q('facil', 'Qual destes objetos é um exemplo de alavanca?', ['Gangorra', 'Termômetro', 'Lâmpada', 'Ímã'], 0, 'A gangorra é uma barra que gira em torno de um ponto de apoio.'),
      q('facil', 'O calor sempre passa espontaneamente:', ['do corpo mais frio para o mais quente', 'do corpo mais quente para o mais frio', 'entre corpos de mesma temperatura', 'só no vácuo'], 1, 'O calor flui do mais quente para o mais frio até o equilíbrio térmico.'),
      q('facil', 'Um plano inclinado (rampa) serve para:', ['diminuir a força necessária para subir um objeto', 'eliminar o peso do objeto', 'aumentar a energia do objeto', 'produzir calor'], 0, 'A rampa reduz o esforço, mas o caminho percorrido é maior.'),
      q('medio', 'O cabo de metal de uma panela esquenta por:', ['condução', 'convecção', 'irradiação do vento', 'evaporação'], 0, 'Em sólidos, o calor se propaga de partícula a partícula: condução.'),
      q('medio', 'As brisas marítimas se explicam principalmente pela:', ['condução', 'convecção', 'dilatação do mar', 'gravidade da Lua'], 1, 'O ar mais quente sobe e o mais frio ocupa o lugar dele: correntes de convecção.'),
      q('medio', 'Por que cabos de panelas costumam ser de madeira ou plástico?', ['Porque são mais pesados', 'Porque são isolantes térmicos', 'Porque conduzem bem o calor', 'Porque são magnéticos'], 1, 'Isolantes conduzem mal o calor, então o cabo não queima a mão.'),
      q('dificil', 'Para elevar um objeto à mesma altura, uma rampa mais longa exige:', ['mais força', 'menos força, com um percurso maior', 'a mesma força e o mesmo caminho', 'nenhuma força'], 1, 'Quanto mais longa a rampa, menor a força necessária, mas maior a distância percorrida.'),
      q('dificil', 'Em uma roldana fixa, a principal vantagem é:', ['reduzir a força à metade', 'mudar a direção da força aplicada', 'criar energia', 'aumentar o peso'], 1, 'A roldana fixa não reduz a força, mas permite puxar para baixo para erguer o objeto.'),
    ],
  },
  {
    topic: 'saude-e-vacinas', grade: '7º ano', title: 'Saúde, doenças e vacinas', subtitle: 'Microrganismos, prevenção, vacinação e imunidade',
    resumo: String.raw`## Microrganismos e doenças
Vírus, bactérias, fungos e protozoários podem causar doenças.
- **Vírus:** gripe, dengue, sarampo, covid-19. (Dengue é transmitida pelo mosquito *Aedes aegypti*.)
- **Bactérias:** tuberculose, cólera, tétano.
- **Protozoários:** malária. **Fungos:** micoses.

## Antibióticos
Combatem **bactérias**. **Não funcionam contra vírus**, como o da gripe.

## Vacinas
Apresentam ao organismo uma versão inofensiva ou parte do microrganismo. O sistema de defesa **reage e cria memória**: se encontrar o agente de verdade, responde rápido. Vacinas **previnem**; não tratam a doença já instalada.

## Imunidade coletiva
Quando a **maioria** da população está vacinada, o agente circula menos e protege até quem não pode se vacinar.

## Prevenção
Saneamento básico (água tratada e esgoto), higiene das mãos e dos alimentos, controle de mosquitos.

## Erros comuns
- Usar antibiótico para gripe.
- Achar que vacina causa a doença.
- Parar de vacinar quando uma doença "some": ela volta.`,
    questoes: [
      q('facil', 'A principal função de uma vacina é:', ['curar uma doença já avançada', 'preparar o organismo para se defender de um agente infeccioso', 'matar todas as bactérias do corpo', 'substituir a alimentação'], 1, 'A vacina estimula o sistema imunológico e cria memória contra o agente.'),
      q('facil', 'Os antibióticos são usados para combater:', ['vírus', 'bactérias', 'ambos igualmente', 'poluição'], 1, 'Antibióticos agem sobre bactérias e não têm efeito sobre vírus.'),
      q('facil', 'A dengue é transmitida pelo mosquito:', ['Anopheles', 'Aedes aegypti', 'barbeiro', 'pernilongo comum'], 1, 'O Aedes aegypti transmite o vírus da dengue, da zika e da chikungunya.'),
      q('medio', 'A gripe é causada por:', ['bactérias', 'vírus', 'fungos', 'protozoários'], 1, 'A gripe é uma doença viral.'),
      q('medio', 'Por que a vacinação protege contra uma doença?', ['Porque mata o vírus no ar', 'Porque cria memória imunológica', 'Porque aumenta o peso do corpo', 'Porque impede a respiração do vírus'], 1, 'O sistema de defesa guarda a "lembrança" do agente e responde rapidamente em uma infecção real.'),
      q('medio', 'Qual medida de saneamento ajuda a prevenir doenças como cólera e hepatite A?', ['Água tratada e esgoto', 'Mais exercícios físicos', 'Uso de protetor solar', 'Dormir mais'], 0, 'Esses agentes se espalham por água e alimentos contaminados.'),
      q('dificil', 'Por que não se deve tomar antibiótico para tratar a gripe?', ['Porque a gripe é causada por vírus, contra os quais antibióticos não agem', 'Porque antibióticos só agem em fungos', 'Porque a gripe é uma doença genética', 'Porque antibióticos causam gripe'], 0, 'Antibiótico mata bactérias. Usá-lo sem necessidade ainda favorece bactérias resistentes.'),
      q('dificil', 'A imunidade coletiva (ou de rebanho) acontece quando:', ['ninguém se vacina', 'a maioria da população está imunizada, o que protege também quem não pôde se vacinar', 'só os idosos se vacinam', 'o vírus desaparece do planeta'], 1, 'Com muitos imunizados, o agente tem poucas chances de circular e atingir pessoas vulneráveis.'),
    ],
  },
  {
    topic: 'reproducao-e-adolescencia', grade: '8º ano', title: 'Reprodução e adolescência', subtitle: 'Puberdade, hormônios, fecundação, ciclo menstrual e prevenção',
    resumo: String.raw`## Adolescência e puberdade
A **puberdade** é a fase de mudanças do corpo, causadas por **hormônios**: crescimento, pelos, mudança de voz, menstruação, desenvolvimento das mamas. O hormônio sexual masculino é a **testosterona**; os femininos são o **estrogênio** e a **progesterona**.

## Gametas e fecundação
- Gameta masculino: **espermatozoide** (nos testículos). Feminino: **óvulo** (nos ovários).
- **Fecundação:** união do espermatozoide com o óvulo, normalmente nas **tubas uterinas**. Forma o zigoto, que se fixa no útero.

## Ciclo menstrual
Dura em média **28 dias**. A ovulação (liberação do óvulo) ocorre por volta da metade do ciclo. Se não há fecundação, ocorre a menstruação.

## Prevenção
- O **preservativo (camisinha)** previne a gravidez e as infecções sexualmente transmissíveis (ISTs).
- ISTs: HIV/aids, sífilis, gonorreia, HPV. Há **vacina contra o HPV** e contra a hepatite B.
- O sistema de saúde (SUS) oferece orientação e métodos gratuitos.

## Erros comuns
- Achar que só "se cuidar" é evitar gravidez (as ISTs também importam).
- Achar que o ciclo é igual em todas as pessoas (28 dias é média).`,
    questoes: [
      q('facil', 'Qual é o gameta masculino?', ['Óvulo', 'Espermatozoide', 'Zigoto', 'Embrião'], 1, 'O espermatozoide é produzido nos testículos.'),
      q('facil', 'A fecundação é:', ['a união do espermatozoide com o óvulo', 'a menstruação', 'a produção de hormônios', 'a saída do bebê'], 0, 'A união dos dois gametas forma o zigoto.'),
      q('facil', 'As mudanças do corpo na adolescência são causadas principalmente por:', ['vitaminas', 'hormônios', 'exercícios', 'vacinas'], 1, 'Na puberdade, hormônios sexuais iniciam as transformações do corpo.'),
      q('medio', 'O preservativo (camisinha) é importante porque:', ['só evita gravidez', 'previne gravidez e infecções sexualmente transmissíveis', 'só previne IST', 'aumenta a fertilidade'], 1, 'É o método que protege ao mesmo tempo contra a gravidez e boa parte das ISTs.'),
      q('medio', 'Qual é o principal hormônio sexual masculino?', ['Estrogênio', 'Progesterona', 'Testosterona', 'Insulina'], 2, 'A testosterona é produzida principalmente nos testículos.'),
      q('medio', 'O ciclo menstrual dura, em média:', ['7 dias', '14 dias', '28 dias', '60 dias'], 2, 'A média é de 28 dias, mas varia de pessoa para pessoa.'),
      q('dificil', 'Em geral, onde ocorre a fecundação?', ['Nos ovários', 'Nas tubas uterinas', 'No útero, na menstruação', 'Na vagina'], 1, 'O óvulo liberado é encontrado pelos espermatozoides nas tubas uterinas.'),
      q('dificil', 'Qual destas infecções sexualmente transmissíveis pode ser prevenida por vacina?', ['HIV', 'HPV', 'Sífilis', 'Gonorreia'], 1, 'Há vacina contra o HPV, oferecida pelo SUS. Para as outras, a prevenção é com camisinha e diagnóstico precoce.'),
    ],
  },
  {
    topic: 'eletricidade-8', grade: '8º ano', title: 'Eletricidade e circuitos simples', subtitle: 'Condutores, circuitos em série e em paralelo e consumo de energia',
    resumo: String.raw`## Condutores e isolantes
- **Condutores:** deixam a corrente passar (cobre, alumínio, ferro, água com sal).
- **Isolantes:** não deixam (borracha, plástico, madeira seca, vidro).

## Circuito elétrico
Precisa de **fonte** (pilha, tomada), **condutores** (fios) e **receptor** (lâmpada). O **interruptor** abre ou fecha o caminho. Circuito **aberto**: sem corrente. **Fechado**: com corrente.

## Série × paralelo
- **Em série:** um único caminho. Se uma lâmpada queima, **todas apagam**.
- **Em paralelo:** vários caminhos. Cada lâmpada funciona de modo **independente**. É a ligação usada nas casas.

## Consumo de energia
$$E=P\cdot\Delta t$$
Um aparelho de 1000 W (1 kW) ligado por 2 h consome 2 kWh. Um chuveiro de 5 kW por 0,5 h por dia durante 30 dias: $5\cdot0{,}5\cdot30=75\ \text{kWh}$.

## Segurança
O **fio terra** conduz a descarga elétrica para o solo e protege as pessoas. Não mexa em tomadas com as mãos molhadas.

## Erros comuns
- Achar que a madeira é sempre isolante (molhada, conduz).
- Confundir potência (kW) com energia (kWh).`,
    questoes: [
      q('facil', 'Qual destes materiais é um bom condutor de eletricidade?', ['Borracha', 'Cobre', 'Plástico', 'Vidro'], 1, 'Os metais, como o cobre, conduzem bem a corrente elétrica.'),
      q('facil', 'Qual destes materiais é um isolante elétrico?', ['Alumínio', 'Ferro', 'Borracha', 'Cobre'], 2, 'A borracha não deixa a corrente passar facilmente.'),
      q('facil', 'Com o interruptor aberto, em um circuito simples:', ['a lâmpada acende mais forte', 'não há corrente e a lâmpada apaga', 'a pilha recarrega', 'a corrente dobra'], 1, 'O interruptor aberto interrompe o caminho da corrente.'),
      q('medio', 'Em um circuito com lâmpadas ligadas em série, se uma queimar:', ['as outras continuam acesas', 'todas apagam', 'as outras ficam mais fortes', 'nada acontece'], 1, 'Há apenas um caminho para a corrente, e ele é interrompido.'),
      q('medio', 'Por que as instalações elétricas das casas usam ligação em paralelo?', ['Para gastar mais energia', 'Para cada aparelho funcionar de modo independente dos outros', 'Para ter menos fios', 'Porque o paralelo não tem tensão'], 1, 'No paralelo, desligar ou queimar um aparelho não afeta os demais.'),
      q('medio', 'Um aparelho de 1 000 W fica ligado por 2 horas. Qual é a energia consumida?', ['2 kWh', '1 kWh', '0,5 kWh', '20 kWh'], 0, 'E = P · Δt = 1 kW · 2 h = 2 kWh.'),
      q('dificil', 'Um chuveiro de 5 kW é usado 30 minutos por dia durante 30 dias. Qual é o consumo no mês?', ['15 kWh', '75 kWh', '150 kWh', '750 kWh'], 1, '5 kW · 0,5 h · 30 dias = 75 kWh.'),
      q('dificil', 'A principal função do fio terra em uma instalação elétrica é:', ['aumentar a tensão', 'conduzir descargas elétricas para o solo, protegendo as pessoas', 'diminuir o consumo', 'esquentar os fios'], 1, 'Ao oferecer um caminho seguro até a terra, evita que a carcaça de um aparelho dê choque.'),
    ],
  },
  {
    topic: 'fontes-de-energia', grade: '8º ano', title: 'Fontes de energia e sustentabilidade', subtitle: 'Fontes renováveis e não renováveis, matriz energética e eficiência',
    resumo: String.raw`## Renováveis × não renováveis
- **Renováveis:** se regeneram em escala humana. **Solar**, **eólica** (vento), **hidrelétrica** (água), **biomassa** (cana-de-açúcar, lenha), geotérmica.
- **Não renováveis:** levam milhões de anos para se formar. **Petróleo, carvão mineral, gás natural** (fósseis) e urânio (nuclear).

## Impactos
- **Combustíveis fósseis** liberam **gás carbônico**, que intensifica o efeito estufa.
- **Hidrelétricas** alagam áreas e afetam ecossistemas.
- **Solar e eólica** não emitem gases na geração, mas dependem de sol e vento.
- **Nuclear** não emite $CO_2$, mas gera rejeitos radioativos.

## Brasil
A **hidrelétrica** é a principal fonte de eletricidade. O **etanol**, feito da cana-de-açúcar, é um combustível renovável.

## Eficiência energética
Gastar menos para fazer a mesma coisa: lâmpadas LED, aparelhos com selo de eficiência, desligar o que não se usa.

## Sustentabilidade
Atender às necessidades de hoje sem comprometer as das próximas gerações.

## Erros comuns
- Achar que "renovável" é sempre sem impacto.
- Confundir potência com energia gasta.`,
    questoes: [
      q('facil', 'Qual destas é uma fonte de energia renovável?', ['Petróleo', 'Carvão mineral', 'Solar', 'Gás natural'], 2, 'A energia solar vem do Sol e se renova continuamente.'),
      q('facil', 'Qual destas é uma fonte não renovável?', ['Eólica', 'Solar', 'Petróleo', 'Biomassa'], 2, 'O petróleo leva milhões de anos para se formar.'),
      q('facil', 'A energia eólica é obtida:', ['do vento', 'do Sol', 'da água', 'do carvão'], 0, 'Aerogeradores transformam a energia dos ventos em eletricidade.'),
      q('medio', 'No Brasil, a principal fonte de energia elétrica é a:', ['nuclear', 'hidrelétrica', 'carvão mineral', 'geotérmica'], 1, 'A maior parte da eletricidade brasileira vem das usinas hidrelétricas.'),
      q('medio', 'A queima de combustíveis fósseis libera principalmente:', ['oxigênio', 'gás carbônico', 'nitrogênio puro', 'hélio'], 1, 'O CO₂ liberado contribui para o aquecimento global.'),
      q('medio', 'O etanol, usado como combustível, é produzido a partir de:', ['petróleo', 'cana-de-açúcar', 'urânio', 'carvão'], 1, 'No Brasil, o etanol vem principalmente da cana-de-açúcar, uma biomassa renovável.'),
      q('dificil', 'Uma vantagem da energia solar é:', ['ser renovável e não emitir gases poluentes durante a geração', 'funcionar à noite sem armazenamento', 'depender de combustíveis fósseis', 'gerar rejeitos radioativos'], 0, 'Painéis solares geram eletricidade sem queimar combustíveis. A limitação é depender da luz do Sol.'),
      q('dificil', 'Trocar lâmpadas incandescentes por lâmpadas LED é uma medida de:', ['eficiência energética', 'aumento do consumo', 'geração de petróleo', 'poluição do ar'], 0, 'Lâmpadas LED produzem a mesma luz gastando muito menos energia.'),
    ],
  },
  {
    topic: 'atomos-9', grade: '9º ano', title: 'Átomos, elementos e a tabela periódica', subtitle: 'Modelos atômicos, partículas, número atômico e isótopos',
    resumo: String.raw`## Modelos
Dalton (esfera maciça), Thomson (pudim de passas, com elétrons), **Rutherford** (núcleo pequeno e denso, com eletrosfera) e Bohr (elétrons em camadas).

## Partículas
| partícula | carga | local |
|---|---|---|
| **Próton** | positiva | núcleo |
| **Nêutron** | nula | núcleo |
| **Elétron** | negativa | eletrosfera |

## Números
- **Número atômico** $Z$: quantidade de prótons. Identifica o elemento.
- **Número de massa** $A=Z+N$, com $N$ os nêutrons.
- Átomo **neutro**: elétrons $=$ prótons. Com $Z=8$, tem 8 elétrons.

Exemplo: $A=23$ e $Z=11$ ⇒ $N=23-11=12$ nêutrons.
Carbono: 6 prótons e 6 nêutrons ⇒ $A=12$.

## Isótopos
Átomos do **mesmo elemento** (mesmo $Z$) com **massas diferentes** (nêutrons diferentes). O carbono-12 e o carbono-14 são isótopos.

## Tabela periódica
Os elementos estão em ordem crescente de $Z$; as colunas (famílias) reúnem elementos de propriedades parecidas.

## Erros comuns
- Confundir $Z$ (prótons) com $A$ (prótons + nêutrons).
- Achar que o núcleo tem elétrons.`,
    questoes: [
      q('facil', 'Qual partícula do átomo tem carga elétrica positiva?', ['Elétron', 'Nêutron', 'Próton', 'Fóton'], 2, 'O próton tem carga positiva e fica no núcleo.'),
      q('facil', 'O número atômico (Z) de um átomo indica o número de:', ['nêutrons', 'prótons', 'elétrons da última camada', 'isótopos'], 1, 'Z é a quantidade de prótons e identifica o elemento químico.'),
      q('facil', 'Os elétrons de um átomo ficam:', ['no núcleo', 'na eletrosfera', 'dentro dos nêutrons', 'fora do átomo'], 1, 'Os elétrons se movem ao redor do núcleo, na eletrosfera.'),
      q('medio', 'Um átomo tem 6 prótons e 6 nêutrons. Qual é o seu número de massa?', ['6', '12', '18', '36'], 1, 'A = prótons + nêutrons = 6 + 6 = 12.'),
      q('medio', 'Um átomo neutro com número atômico 8 possui quantos elétrons?', ['4', '8', '16', '0'], 1, 'Em um átomo neutro, o número de elétrons é igual ao de prótons: 8.'),
      q('medio', 'Isótopos são átomos que têm:', ['o mesmo número de massa e Z diferentes', 'o mesmo Z e números de massa diferentes', 'o mesmo número de nêutrons', 'cargas opostas'], 1, 'Mesmo elemento (mesmo Z), mas com números diferentes de nêutrons.'),
      q('dificil', 'Um átomo tem número de massa 23 e número atômico 11. Quantos nêutrons ele possui?', ['11', '12', '23', '34'], 1, 'N = A − Z = 23 − 11 = 12.'),
      q('dificil', 'Qual cientista concluiu, com seu experimento, que o átomo tem um núcleo pequeno, denso e positivo?', ['Dalton', 'Thomson', 'Rutherford', 'Bohr'], 2, 'No experimento da lâmina de ouro, Rutherford percebeu que a maior parte do átomo é espaço vazio, com um núcleo pequeno.'),
    ],
  },
  {
    topic: 'evolucao-9', grade: '9º ano', title: 'Evolução e seleção natural', subtitle: 'Darwin, variação, adaptação e evidências da evolução',
    resumo: String.raw`## Ideia de Darwin
**Charles Darwin** propôs a **seleção natural**:
1. Os indivíduos de uma população **variam** entre si.
2. Parte dessas variações é **hereditária**.
3. Nasce mais indivíduos do que o ambiente sustenta, e eles **competem**.
4. Quem tem características mais vantajosas **sobrevive e se reproduz mais**, passando essas características adiante.

Com o tempo, a população muda.

## Adaptação
Característica que aumenta a chance de sobreviver e deixar descendentes em determinado ambiente.

## Exemplo: resistência a antibióticos
Em uma população de bactérias, algumas já são **resistentes**. O antibiótico mata as sensíveis; as resistentes sobrevivem, se reproduzem e passam a dominar.

## Lamarck
Propôs que características adquiridas pelo uso seriam herdadas (o pescoço da girafa esticaria). Essa ideia **não** é aceita hoje. Para Darwin: girafas com pescoço mais longo, por variação natural, alcançavam mais alimento e deixavam mais filhotes.

## Evidências
Fósseis, anatomia comparada, semelhanças de DNA e a **ancestralidade comum**. Humanos e chimpanzés compartilham um ancestral comum (um não descende do outro).

## Erros comuns
- Achar que o indivíduo "se adapta" durante a vida e transmite isso.
- Achar que a evolução tem objetivo ou "melhora" sempre.`,
    questoes: [
      q('facil', 'Quem propôs a teoria da seleção natural?', ['Mendel', 'Darwin', 'Pasteur', 'Newton'], 1, 'Charles Darwin propôs a seleção natural para explicar a evolução das espécies.'),
      q('facil', 'Uma adaptação é uma característica que:', ['sempre surge por vontade do indivíduo', 'aumenta a chance de sobrevivência e reprodução no ambiente', 'só existe em plantas', 'nunca é herdada'], 1, 'É uma característica vantajosa em determinado ambiente.'),
      q('facil', 'Os fósseis são evidências de:', ['vida do passado e da evolução dos seres vivos', 'rochas vulcânicas', 'mudanças no clima apenas', 'extração de petróleo'], 0, 'Os fósseis registram seres que viveram no passado e mostram mudanças ao longo do tempo.'),
      q('medio', 'Qual das condições é necessária para a seleção natural atuar?', ['Existir variação entre os indivíduos da população', 'Todos os indivíduos serem idênticos', 'O ambiente nunca mudar', 'Não haver reprodução'], 0, 'Sem variação, não há características diferentes sobre as quais a seleção possa atuar.'),
      q('medio', 'Bactérias resistentes a antibióticos se tornam comuns porque:', ['o antibiótico cria mutações de propósito', 'as resistentes sobrevivem, se reproduzem e passam a resistência adiante', 'as bactérias decidem se adaptar', 'os antibióticos fortalecem todas as bactérias'], 1, 'É um exemplo de seleção natural: o antibiótico seleciona as que já eram resistentes.'),
      q('medio', 'Segundo Lamarck, as características adquiridas pelo uso:', ['seriam herdadas pelos descendentes', 'nunca mudariam', 'só afetariam plantas', 'seriam perdidas sempre'], 0, 'Essa ideia (herança de caracteres adquiridos) não é sustentada pelas evidências atuais.'),
      q('dificil', 'Pela explicação darwinista, as girafas têm pescoço longo porque:', ['esticaram o pescoço e passaram isso aos filhos', 'havia variação no comprimento do pescoço e as de pescoço maior sobreviveram e se reproduziram mais', 'a natureza quis girafas altas', 'o pescoço aumenta com a idade'], 1, 'Variação hereditária e sobrevivência diferencial explicam o resultado, sem "esforço" do indivíduo.'),
      q('dificil', 'Humanos e chimpanzés têm muitas semelhanças porque:', ['os humanos descendem dos chimpanzés atuais', 'compartilham um ancestral comum', 'vivem no mesmo lugar', 'comem os mesmos alimentos'], 1, 'As semelhanças refletem uma origem comum, e não que um seja descendente do outro.'),
    ],
  },
  {
    topic: 'astronomia-e-ondas', grade: '9º ano', title: 'Astronomia, ondas e radiações', subtitle: 'Sistema Solar, ano-luz, ondas mecânicas e eletromagnéticas',
    resumo: String.raw`## Astronomia
O Sistema Solar tem o Sol e 8 planetas. O planeta mais próximo do Sol é Mercúrio. O Sol é uma estrela da galáxia **Via Láctea**.

## Ano-luz
Unidade de **distância**, e não de tempo: é a distância que a luz percorre em um ano. A luz viaja a cerca de $300\,000\ \text{km/s}$ no vácuo. A luz do Sol leva cerca de **8 minutos** para chegar à Terra.

## Ondas
Perturbações que **transportam energia** sem transportar matéria.
- **Mecânicas:** precisam de meio material. O **som** não se propaga no vácuo.
- **Eletromagnéticas:** propagam-se no vácuo. A luz é uma onda eletromagnética.

## Espectro eletromagnético
Em ordem crescente de energia: **ondas de rádio, micro-ondas, infravermelho, luz visível, ultravioleta (UV), raios X, raios gama**.

## Radiações no dia a dia
Micro-ondas aquecem alimentos; o infravermelho é sentido como calor; o **UV** em excesso queima a pele e pode causar câncer de pele (use protetor solar); raios X formam imagens do corpo.

## Erros comuns
- Achar que ano-luz mede tempo.
- Achar que o som passa pelo espaço.`,
    questoes: [
      q('facil', 'O ano-luz é uma unidade de:', ['tempo', 'distância', 'velocidade', 'massa'], 1, 'Ano-luz é a distância que a luz percorre em um ano.'),
      q('facil', 'O som pode se propagar no vácuo?', ['Sim, mais rápido que no ar', 'Sim, igual ao ar', 'Não, pois precisa de meio material', 'Só à noite'], 2, 'O som é uma onda mecânica e precisa de um meio material (ar, água, sólidos).'),
      q('facil', 'A luz visível é uma onda:', ['mecânica', 'eletromagnética', 'sonora', 'de pressão'], 1, 'A luz é uma onda eletromagnética e se propaga até no vácuo.'),
      q('medio', 'A velocidade da luz no vácuo é de aproximadamente:', ['300 km/s', '3 000 km/s', '300 000 km/s', '3 000 000 km/s'], 2, 'A luz viaja a cerca de 300 000 km/s.'),
      q('medio', 'A exposição excessiva à radiação ultravioleta (UV) pode causar:', ['mais oxigênio no sangue', 'queimaduras e câncer de pele', 'cura de doenças', 'aumento da altura'], 1, 'Por isso se recomendam protetor solar e evitar o sol forte das 10h às 16h.'),
      q('medio', 'Qual é o planeta mais próximo do Sol?', ['Vênus', 'Mercúrio', 'Marte', 'Terra'], 1, 'Mercúrio é o primeiro planeta a partir do Sol.'),
      q('dificil', 'A luz do Sol leva aproximadamente quanto tempo para chegar à Terra?', ['8 segundos', '8 minutos', '8 horas', '8 dias'], 1, 'A distância é de cerca de 150 milhões de km e a luz leva cerca de 8 minutos para percorrê-la.'),
      q('dificil', 'Qual destas ondas precisa de um meio material para se propagar?', ['Luz', 'Ondas de rádio', 'Som', 'Raios X'], 2, 'O som é mecânico. Luz, rádio e raios X são eletromagnéticos e se propagam no vácuo.'),
    ],
  },
];
