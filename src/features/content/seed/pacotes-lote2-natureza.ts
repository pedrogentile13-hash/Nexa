import { q, type PacoteSeed } from './helpers';

export const LOTE2_NATUREZA: PacoteSeed[] = [
  {
    topic: 'ecossistemas', grade: '7º ano', title: 'Ecossistemas e cadeias alimentares', subtitle: 'Produtores, consumidores, decompositores e fluxo de energia',
    resumo: String.raw`## Ecossistema
Conjunto formado pelos seres vivos (fatores **bióticos**) e pelo ambiente em que vivem (fatores **abióticos**: água, luz, temperatura, solo).

## Quem faz o quê
- **Produtores:** produzem o próprio alimento pela fotossíntese (plantas, algas). Base da cadeia.
- **Consumidores:** se alimentam de outros seres. **Primários** comem produtores (herbívoros); **secundários** comem consumidores primários; e assim por diante.
- **Decompositores:** fungos e bactérias que decompõem matéria morta e devolvem nutrientes ao ambiente.

## Cadeia e teia alimentar
Cadeia: capim → gafanhoto → sapo → cobra. O capim é produtor; o gafanhoto, consumidor primário; o sapo, secundário; a cobra, terciário. A **teia alimentar** reúne várias cadeias interligadas.

## Fluxo de energia
A energia entra pela luz do Sol, passa de um nível a outro e **diminui a cada nível**: em média só cerca de 10% passa ao nível seguinte. A energia flui em **um só sentido**. A matéria, ao contrário, é reciclada.

Se os produtores têm 10 000 kJ, o consumidor primário recebe cerca de 1 000 e o secundário, cerca de 100.

## Equilíbrio
Retirar um nível altera os outros. Sem predadores, a população de herbívoros cresce e pode esgotar a vegetação.

## Erros comuns
- Achar que a energia se recicla como a matéria.
- Esquecer que decompositores fazem parte do ecossistema.`,
    questoes: [
      q('facil', 'Qual dos seres abaixo é um produtor em uma cadeia alimentar?', ['Onça', 'Capim', 'Fungo', 'Gafanhoto'], 1, 'O capim faz fotossíntese e produz o próprio alimento. Onça e gafanhoto são consumidores e o fungo é decompositor.'),
      q('facil', 'Qual grupo de seres é responsável pela decomposição da matéria morta?', ['Produtores', 'Herbívoros', 'Fungos e bactérias', 'Predadores'], 2, 'Fungos e bactérias decompõem a matéria orgânica e devolvem nutrientes ao ambiente.'),
      q('facil', 'Os consumidores primários se alimentam de:', ['produtores', 'predadores', 'decompositores', 'rochas'], 0, 'Consumidores primários são herbívoros: comem plantas, os produtores.'),
      q('medio', 'Na cadeia capim → gafanhoto → sapo → cobra, o sapo é um consumidor:', ['primário', 'secundário', 'terciário', 'produtor'], 1, 'O sapo come o gafanhoto (consumidor primário), então é secundário. A cobra é terciária.'),
      q('medio', 'Sobre o fluxo de energia em uma cadeia alimentar, é correto afirmar que ela:', ['circula em ciclo, como a matéria', 'flui em um só sentido e diminui a cada nível', 'aumenta a cada nível', 'não passa de um nível a outro'], 1, 'A energia entra pelo Sol e segue em um só sentido, com perdas (calor) a cada nível. Quem circula é a matéria.'),
      q('medio', 'Uma teia alimentar é:', ['uma única cadeia alimentar', 'um conjunto de cadeias alimentares interligadas', 'a lista de produtores de um lugar', 'o ciclo da água'], 1, 'Os seres costumam ter mais de uma fonte de alimento, então as cadeias se cruzam e formam uma teia.'),
      q('dificil', 'Se os predadores de uma população de herbívoros desaparecem de um ecossistema, o mais provável é que:', ['os herbívoros aumentem e possam esgotar a vegetação', 'os herbívoros desapareçam', 'a vegetação aumente sem limite', 'nada mude'], 0, 'Sem predadores, o controle natural some. Os herbívoros crescem em número e podem consumir mais vegetação do que ela repõe.'),
      q('dificil', 'Em uma cadeia alimentar, os produtores armazenam 10 000 kJ. Pela regra dos 10%, aproximadamente quanta energia chega ao consumidor secundário?', ['1 000 kJ', '100 kJ', '10 kJ', '10 000 kJ'], 1, 'Produtores 10 000 → consumidor primário 1 000 (10%) → consumidor secundário 100 (10% de 1 000).'),
    ],
  },
  {
    topic: 'sistemas-do-corpo-humano', grade: '8º ano', title: 'Sistemas do corpo humano', subtitle: 'Digestório, respiratório, circulatório, excretor e nervoso',
    resumo: String.raw`## Digestório
Transforma o alimento em nutrientes. A digestão começa na boca, continua no **estômago** e termina no **intestino delgado**, onde ocorre a maior parte da **absorção**. O intestino grosso absorve água.

## Respiratório
Leva o ar até os **pulmões**. Nos **alvéolos** acontece a troca gasosa: entra oxigênio no sangue e sai gás carbônico.

## Circulatório
O **coração** bombeia o sangue por artérias, veias e capilares. As **hemácias** transportam oxigênio, os leucócitos defendem o corpo e as plaquetas ajudam na coagulação.
- **Grande circulação:** coração → corpo → coração (a **aorta** sai do coração levando sangue rico em oxigênio).
- **Pequena circulação:** coração → pulmões → coração.

## Excretor
Os **rins** filtram o sangue e produzem a urina, eliminando resíduos e regulando a água do corpo.

## Nervoso
Formado por **neurônios**, que se comunicam por **sinapses**. Coordena movimentos, sensações e pensamentos.

## Integração
Os sistemas trabalham juntos: o digestório fornece nutrientes, o respiratório fornece oxigênio e o circulatório leva tudo às células.

## Erros comuns
- Achar que a absorção de nutrientes é no estômago (é no intestino delgado).
- Confundir artérias com veias (artérias saem do coração).`,
    questoes: [
      q('facil', 'Em qual órgão ocorre a troca de gases entre o ar e o sangue?', ['Coração', 'Pulmões', 'Estômago', 'Rins'], 1, 'Nos alvéolos pulmonares o oxigênio passa para o sangue e o gás carbônico sai.'),
      q('facil', 'Qual órgão bombeia o sangue pelo corpo?', ['Fígado', 'Pulmão', 'Coração', 'Cérebro'], 2, 'O coração é o órgão muscular que bombeia o sangue por todo o corpo.'),
      q('facil', 'Quais órgãos filtram o sangue e produzem a urina?', ['Pulmões', 'Rins', 'Intestinos', 'Fígado'], 1, 'Os rins filtram o sangue, retiram resíduos e produzem a urina.'),
      q('medio', 'Onde ocorre a maior parte da absorção dos nutrientes dos alimentos?', ['Estômago', 'Intestino grosso', 'Intestino delgado', 'Esôfago'], 2, 'O intestino delgado tem grande superfície de absorção. O intestino grosso absorve principalmente água.'),
      q('medio', 'Qual vaso sai do coração levando sangue rico em oxigênio para o corpo?', ['Veia cava', 'Aorta', 'Artéria pulmonar', 'Veia pulmonar'], 1, 'A aorta é a principal artéria da grande circulação. A veia pulmonar também traz sangue oxigenado, mas dos pulmões para o coração.'),
      q('medio', 'Qual é a principal função das hemácias?', ['Combater infecções', 'Participar da coagulação', 'Transportar oxigênio', 'Produzir hormônios'], 2, 'As hemácias têm hemoglobina e transportam oxigênio. A defesa é função dos leucócitos e a coagulação, das plaquetas.'),
      q('dificil', 'A comunicação entre dois neurônios acontece por meio de:', ['sinapses', 'osmose', 'fotossíntese', 'mitose'], 0, 'A sinapse é a região onde um neurônio transmite o impulso nervoso ao seguinte.'),
      q('dificil', 'A pequena circulação (circulação pulmonar) leva o sangue:', ['do coração ao corpo e de volta', 'do coração aos pulmões e de volta', 'do fígado ao intestino', 'dos rins ao coração'], 1, 'Na pequena circulação o sangue vai do coração aos pulmões, onde recebe oxigênio, e volta ao coração.'),
    ],
  },
  {
    topic: 'citologia', grade: '1ª série EM', title: 'Citologia: organização da célula', subtitle: 'Organelas e suas funções',
    resumo: String.raw`## Dois tipos de célula
- **Procarionte** (bactérias): sem núcleo organizado; o DNA fica disperso no citoplasma, numa região chamada **nucleoide**.
- **Eucarionte** (animais, plantas, fungos, protistas): com núcleo delimitado por **carioteca**, e organelas membranosas.

## Organelas e funções
- **Núcleo:** guarda o DNA e comanda a célula.
- **Ribossomos:** sintetizam proteínas (não têm membrana; existem também nos procariontes).
- **Retículo endoplasmático rugoso (RER):** tem ribossomos aderidos; produz e transporta proteínas.
- **Retículo endoplasmático liso (REL):** produz lipídios e desintoxica; não tem ribossomos.
- **Complexo de Golgi:** modifica, empacota e distribui substâncias.
- **Lisossomos:** contêm enzimas e fazem a digestão intracelular.
- **Mitocôndrias:** respiração celular, liberam energia (ATP). Têm **DNA próprio** e dupla membrana.
- **Cloroplastos:** fotossíntese (plantas e algas). Também têm DNA próprio.
- **Vacúolos:** armazenam substâncias; grandes nas células vegetais.

## Aplicação
Uma célula do pâncreas que produz muitas enzimas (proteínas) tem **RER e Golgi** bem desenvolvidos. Uma célula muscular tem muitas **mitocôndrias**.

## Erros comuns
- Dizer que ribossomos têm membrana.
- Confundir RER (com ribossomos) com REL (sem ribossomos).`,
    questoes: [
      q('facil', 'Qual organela é responsável pela síntese de proteínas?', ['Lisossomo', 'Ribossomo', 'Vacúolo', 'Cloroplasto'], 1, 'Os ribossomos montam as proteínas a partir das informações do RNA.'),
      q('facil', 'Qual organela realiza a digestão intracelular?', ['Mitocôndria', 'Complexo de Golgi', 'Lisossomo', 'Núcleo'], 2, 'Os lisossomos têm enzimas digestivas que degradam substâncias dentro da célula.'),
      q('facil', 'Qual dos seres abaixo é formado por células procariontes?', ['Bactéria', 'Fungo', 'Planta', 'Ser humano'], 0, 'As bactérias são procariontes. Fungos, plantas e animais têm células eucariontes.'),
      q('medio', 'Qual é a função do complexo de Golgi?', ['Realizar a fotossíntese', 'Modificar, empacotar e distribuir substâncias', 'Guardar o DNA', 'Produzir energia'], 1, 'O Golgi recebe substâncias, as modifica, as empacota em vesículas e as envia ao destino.'),
      q('medio', 'O retículo endoplasmático rugoso se diferencia do liso por ter:', ['mitocôndrias aderidas', 'ribossomos aderidos', 'DNA próprio', 'parede celular'], 1, 'O aspecto "rugoso" vem dos ribossomos presos à sua membrana.'),
      q('medio', 'Em uma célula procarionte, o material genético fica:', ['dentro do núcleo', 'disperso no citoplasma (nucleoide)', 'nas mitocôndrias', 'no complexo de Golgi'], 1, 'Células procariontes não têm carioteca. O DNA fica no nucleoide, no citoplasma.'),
      q('dificil', 'Qual organela tem DNA próprio e dupla membrana, além do núcleo?', ['Ribossomo', 'Lisossomo', 'Mitocôndria', 'Complexo de Golgi'], 2, 'A mitocôndria (e o cloroplasto) tem DNA próprio e dupla membrana, o que sustenta a origem endossimbiótica dessas organelas.'),
      q('dificil', 'Uma célula do pâncreas que secreta grande quantidade de enzimas (proteínas) deve ter muito desenvolvidos:', ['RE liso e lisossomos', 'RE rugoso e complexo de Golgi', 'cloroplastos e parede celular', 'vacúolos e centríolos'], 1, 'Quem produz e exporta proteínas usa o RER (síntese) e o Golgi (modificação e secreção).'),
    ],
  },
];
