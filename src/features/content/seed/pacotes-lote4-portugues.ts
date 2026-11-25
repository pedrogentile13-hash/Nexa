import { q, type PacoteSeed } from './helpers';

export const LOTE4_PORTUGUES: PacoteSeed[] = [
  {
    topic: 'substantivo-adjetivo-e-verbo', grade: '6º ano', title: 'Substantivo, adjetivo e verbo', subtitle: 'As três classes de palavras mais usadas e como reconhecê-las',
    resumo: String.raw`## Substantivo
Dá **nome** a seres, lugares, sentimentos e coisas: *menina, Brasil, alegria, mesa*.
- **Comum** (nomeia em geral: *cidade*) e **próprio** (nomeia um ser específico, com inicial maiúscula: *Brasil*).
- **Concreto** (existe por si: *casa*) e **abstrato** (depende de outro ser: *saudade*).
- **Coletivo:** indica um grupo (*cardume*, *matilha*, *enxame*).

## Adjetivo
**Qualifica** o substantivo e concorda com ele em gênero e número: *o cachorro **peludo**, as casas **antigas***. Locução adjetiva: *de ouro* (dourado).

## Verbo
Indica **ação** (*correr*), **estado** (*estar*) ou **fenômeno da natureza** (*chover*). Varia em pessoa, número, tempo e modo.
- **Tempos:** presente (*estudo*), pretérito (*estudei*) e futuro (*estudarei*).
- **Conjugações:** 1ª em **-ar** (*amar*), 2ª em **-er** (*vender*), 3ª em **-ir** (*partir*).

## Como reconhecer
Se a palavra aceita artigo (*o, a*) na frente, em geral é substantivo. Se qualifica um substantivo, é adjetivo. Se muda com o tempo, é verbo.

## Erros comuns
- Achar que todo nome próprio é adjetivo.
- Esquecer a concordância do adjetivo: *as casa antigas* (errado).`,
    questoes: [
      q('facil', 'Em "Brasil", a palavra é um substantivo:', ['próprio', 'comum', 'coletivo', 'abstrato'], 0, 'Brasil nomeia um país específico, por isso é substantivo próprio, escrito com inicial maiúscula.'),
      q('facil', 'Em "O cachorro peludo latiu", qual palavra é um adjetivo?', ['cachorro', 'peludo', 'latiu', 'O'], 1, 'Peludo qualifica o substantivo cachorro: é o adjetivo.'),
      q('facil', 'Em "Maria estuda todos os dias", qual palavra é um verbo?', ['Maria', 'estuda', 'todos', 'dias'], 1, 'Estuda indica ação e varia em tempo e pessoa: é o verbo.'),
      q('medio', 'Qual das palavras é um substantivo coletivo?', ['Cardume', 'Peixe', 'Nadar', 'Azul'], 0, 'Cardume é o conjunto de peixes. Peixe é substantivo comum; nadar é verbo; azul é adjetivo.'),
      q('medio', 'Qual expressão apresenta concordância correta entre substantivo e adjetivo?', ['as casas antigas', 'as casa antigas', 'os casas antigo', 'a casas antiga'], 0, 'O artigo e o adjetivo concordam com o substantivo: as casas antigas (feminino plural).'),
      q('medio', 'Em "Nós cantamos ontem", o verbo está no tempo:', ['presente', 'pretérito', 'futuro', 'imperativo'], 1, 'Ontem indica ação passada e cantamos é uma forma do pretérito perfeito.'),
      q('dificil', 'Qual verbo pertence à segunda conjugação?', ['amar', 'vender', 'partir', 'cantar'], 1, 'A 2ª conjugação reúne os verbos terminados em -er, como vender.'),
      q('dificil', 'Em "Choveu muito ontem", o verbo expressa:', ['ação de alguém', 'estado de alguém', 'fenômeno da natureza', 'desejo'], 2, 'Chover é um verbo que indica fenômeno da natureza e não tem sujeito.'),
    ],
  },
  {
    topic: 'sujeito-e-predicado', grade: '7º ano', title: 'Sujeito e predicado', subtitle: 'Tipos de sujeito e de predicado',
    resumo: String.raw`## Sujeito e predicado
**Sujeito** é o ser de quem se fala; **predicado** é o que se diz dele. Em *Os alunos chegaram cedo*: sujeito = *Os alunos*; predicado = *chegaram cedo*.

## Tipos de sujeito
- **Simples:** um núcleo. *As crianças brincam.*
- **Composto:** mais de um núcleo. *Ana e Pedro viajaram.*
- **Oculto (desinencial):** não aparece, mas se identifica pelo verbo. *Cantamos juntos* (nós).
- **Indeterminado:** não se quer ou não se pode identificar. *Vendem frutas na feira.* (verbo na 3ª pessoa do plural, sem referente).
- **Oração sem sujeito:** verbos de fenômeno da natureza e *haver*/*fazer* (tempo). *Choveu muito. Fez calor.*

## Tipos de predicado
- **Verbal:** o núcleo é um verbo de ação. *O aluno **estudou**.*
- **Nominal:** verbo de ligação (*ser, estar, ficar, parecer*) + predicativo. *A sala **está limpa**.*
- **Verbo-nominal:** tem os dois. *O aluno chegou cansado.*

## Dica
Pergunte ao verbo: "**quem** ou **o que** pratica a ação?".

## Erros comuns
- Procurar sujeito em *Choveu* (não tem).
- Confundir sujeito oculto com sujeito inexistente.`,
    questoes: [
      q('facil', 'Em "As crianças brincam no pátio", qual é o sujeito?', ['brincam', 'no pátio', 'As crianças', 'pátio'], 2, 'As crianças é o ser que pratica a ação de brincar.'),
      q('facil', '"Choveu muito ontem" é uma oração:', ['com sujeito simples', 'sem sujeito', 'com sujeito oculto', 'com sujeito composto'], 1, 'Verbos que indicam fenômeno da natureza formam oração sem sujeito.'),
      q('facil', 'Em "Cantamos juntos", o sujeito é:', ['simples, "juntos"', 'oculto, "nós"', 'indeterminado', 'composto'], 1, 'A terminação do verbo (-mos) revela o sujeito oculto: nós.'),
      q('medio', 'Em "Ana e Pedro viajaram", o sujeito é:', ['simples', 'composto', 'oculto', 'indeterminado'], 1, 'Há dois núcleos (Ana e Pedro): sujeito composto.'),
      q('medio', 'Em "Vendem frutas na feira", o sujeito é:', ['simples', 'composto', 'indeterminado', 'oculto'], 2, 'O verbo está na 3ª pessoa do plural sem referente: o sujeito é indeterminado.'),
      q('medio', 'Em "A sala está limpa", o predicado é:', ['verbal', 'nominal', 'verbo-nominal', 'inexistente'], 1, 'Está é verbo de ligação e limpa é o predicativo do sujeito: predicado nominal.'),
      q('dificil', 'Em "O aluno ficou nervoso", qual é o verbo de ligação?', ['aluno', 'ficou', 'nervoso', 'O'], 1, 'Ficou liga o sujeito a uma característica (nervoso), sem indicar ação.'),
      q('dificil', 'Qual frase NÃO tem sujeito?', ['Fez calor ontem.', 'Eles saíram cedo.', 'Dizem que vai chover.', 'Ana e Lia estudam.'], 0, 'Com o verbo fazer indicando tempo ou clima, a oração é sem sujeito. Em "Dizem que...", o sujeito é indeterminado.'),
    ],
  },
  {
    topic: 'pontuacao', grade: '7º ano', title: 'Pontuação', subtitle: 'Vírgula, dois-pontos, travessão, reticências e outros sinais',
    resumo: String.raw`## Para que serve
A pontuação organiza o texto, marca pausas e muda o sentido. *"Vamos comer, Pedro!"* e *"Vamos comer Pedro!"* dizem coisas muito diferentes.

## A vírgula
Usa-se para separar:
- **Itens de enumeração:** *Comprei maçãs, peras e uvas.*
- **Vocativo:** *Maria, venha aqui!*
- **Aposto:** *Meu irmão, o Pedro, joga futebol.*
- **Adjunto adverbial deslocado:** *Ontem, choveu.*

**Não** se separa sujeito de verbo nem verbo de complemento com vírgula.

## Outros sinais
- **Ponto final:** encerra frase. **Interrogação (?)** e **exclamação (!)**.
- **Dois-pontos:** antes de enumeração, explicação ou fala.
- **Ponto e vírgula:** pausa maior que a vírgula, em itens longos.
- **Travessão:** indica fala em diálogo ou isola explicações.
- **Reticências:** interrupção, hesitação ou suspense.
- **Aspas:** citações, estrangeirismos, ironia.

## Erros comuns
- Colocar vírgula entre o sujeito e o verbo (*Os alunos, estudaram* — errado).
- Esquecer as duas vírgulas que isolam o aposto.`,
    questoes: [
      q('facil', 'Em "Comprei maçãs, peras e uvas", a vírgula é usada para:', ['isolar o aposto', 'separar elementos de uma enumeração', 'marcar o vocativo', 'indicar interrogação'], 1, 'As vírgulas separam os itens da enumeração (maçãs, peras e uvas).'),
      q('facil', 'Qual sinal encerra uma pergunta direta?', ['Ponto final', 'Ponto de interrogação', 'Dois-pontos', 'Travessão'], 1, 'Perguntas diretas terminam com ponto de interrogação.'),
      q('facil', 'Os dois-pontos costumam ser usados antes de:', ['uma enumeração ou explicação', 'um verbo', 'um adjetivo', 'um artigo'], 0, 'Eles anunciam uma lista, uma explicação ou uma fala.'),
      q('medio', 'Em "Maria, venha aqui!", a vírgula isola:', ['o aposto', 'o vocativo', 'a enumeração', 'o sujeito'], 1, 'Maria é o vocativo, o termo que chama alguém.'),
      q('medio', 'Qual frase está corretamente pontuada?', ['Comprei maçãs, peras e uvas.', 'Comprei, maçãs peras e uvas.', 'Comprei maçãs peras, e uvas.', 'Comprei maçãs peras e, uvas.'], 0, 'Os elementos da enumeração são separados por vírgula, e o último é ligado por "e".'),
      q('medio', 'Em textos de diálogo, o sinal usado para indicar a fala de um personagem é o:', ['travessão', 'ponto e vírgula', 'asterisco', 'parêntese'], 0, 'O travessão introduz a fala de cada interlocutor.'),
      q('dificil', 'Em "Meu irmão, o Pedro, joga futebol", as vírgulas isolam:', ['um vocativo', 'um aposto', 'um adjunto adverbial', 'uma enumeração'], 1, 'O Pedro explica quem é "meu irmão": é um aposto, que vem entre vírgulas.'),
      q('dificil', 'O sinal que costuma indicar hesitação, interrupção ou suspense é:', ['reticências', 'ponto final', 'dois-pontos', 'aspas'], 0, 'As reticências sugerem que o pensamento ficou em suspenso ou foi interrompido.'),
    ],
  },
  {
    topic: 'figuras-de-linguagem', grade: '8º ano', title: 'Figuras de linguagem', subtitle: 'Metáfora, comparação, hipérbole, ironia, metonímia e outras',
    resumo: String.raw`## O que são
Recursos que dão **expressividade** ao texto, usando as palavras fora do sentido literal (sentido figurado).

## As principais
- **Comparação:** compara com conectivo (*como, tal qual*). *Ele é forte **como** um touro.*
- **Metáfora:** compara sem conectivo, identificando um termo com outro. *Seus olhos são duas estrelas.*
- **Personificação (prosopopeia):** atribui ações humanas a seres não humanos. *O sol sorriu.*
- **Hipérbole:** exagero. *Chorei rios de lágrimas.*
- **Ironia:** dizer o contrário do que se pensa. *Que dia lindo!* (em plena tempestade).
- **Metonímia:** troca um termo por outro com relação de proximidade (autor pela obra, parte pelo todo). *Li Machado de Assis.*
- **Eufemismo:** suaviza algo desagradável. *Ele partiu desta para melhor.*
- **Antítese:** contraste de ideias. *Amor e ódio.*
- **Paradoxo:** ideias contraditórias que fazem sentido. *Amor é fogo que arde sem se ver.*

## Como identificar
Pergunte: há conectivo de comparação? Há exagero? O sentido é o contrário do dito? Uma coisa é chamada pelo nome de outra?

## Erros comuns
- Confundir metáfora (sem conectivo) com comparação (com *como*).
- Confundir antítese (palavras opostas) com paradoxo (contradição aparente).`,
    questoes: [
      q('facil', '"Seus olhos são duas estrelas" é um exemplo de:', ['comparação', 'metáfora', 'hipérbole', 'ironia'], 1, 'Identifica olhos com estrelas sem usar conectivo de comparação: é uma metáfora.'),
      q('facil', '"Ele é forte como um touro" é uma:', ['metáfora', 'comparação', 'ironia', 'metonímia'], 1, 'O conectivo "como" torna explícita a comparação.'),
      q('facil', '"O sol sorriu para nós" é um exemplo de:', ['personificação', 'hipérbole', 'eufemismo', 'antítese'], 0, 'Atribui a um ser não humano (o sol) uma ação humana (sorrir).'),
      q('medio', '"Chorei rios de lágrimas" é uma:', ['ironia', 'hipérbole', 'metonímia', 'comparação'], 1, 'Há exagero intencional para dar força à expressão: hipérbole.'),
      q('medio', 'Dizer "Que dia lindo!" durante uma forte tempestade é um caso de:', ['ironia', 'metáfora', 'eufemismo', 'antítese'], 0, 'O falante diz o contrário do que pensa: ironia.'),
      q('medio', '"Li Machado de Assis" (querendo dizer que leu um livro dele) exemplifica:', ['metonímia', 'hipérbole', 'paradoxo', 'personificação'], 0, 'Usa-se o nome do autor no lugar da obra: metonímia.'),
      q('dificil', '"É ferida que dói e não se sente" (Camões) é um exemplo de:', ['hipérbole', 'paradoxo', 'comparação', 'eufemismo'], 1, 'Reúne ideias contraditórias (doer e não sentir) que fazem sentido figurado: paradoxo.'),
      q('dificil', '"Ele partiu desta para melhor" é um exemplo de:', ['eufemismo', 'ironia', 'hipérbole', 'antítese'], 0, 'A expressão suaviza a ideia de morte: eufemismo.'),
    ],
  },
  {
    topic: 'concordancia', grade: '9º ano', title: 'Concordância verbal e nominal', subtitle: 'Regras gerais e casos que mais caem em prova',
    resumo: String.raw`## Concordância verbal
O verbo concorda com o **sujeito** em número e pessoa.
- **Sujeito simples:** *Os alunos **estudam**.*
- **Sujeito composto** antes do verbo: plural. *Ana e Paulo **chegaram**.*

## Casos especiais
- **Haver** no sentido de *existir* ou de tempo é **impessoal** (singular): *Havia muitos alunos. Há dois anos que moro aqui.* (Errado: *Haviam muitos alunos.*)
- **Fazer** indicando tempo decorrido: singular. *Faz dois anos.*
- **Existir** concorda com o sujeito: *Existem várias soluções.*
- **Voz passiva sintética (verbo + se):** concorda com o sujeito. *Vendem-se casas. Aluga-se apartamento.*

## Concordância nominal
O adjetivo, o artigo e o pronome concordam com o substantivo: *as meninas estavam sozinhas*.
- **Meio** (advérbio, no sentido de "um pouco") é invariável: *Ela está meio cansada.*
- **Bastante** (advérbio) também: *As alunas estavam bastante cansadas* — mas *bastantes alunas* (adjetivo) varia.

## Erros comuns
- Usar plural em *haver* (existir): *Haviam* é erro.
- Dizer *Vende-se casas* (o certo é *Vendem-se*).`,
    questoes: [
      q('facil', 'Qual frase está de acordo com a norma-padrão?', ['Os alunos estuda muito.', 'Os alunos estudam muito.', 'Os aluno estudam muito.', 'Os alunos estudamos muito.'], 1, 'O verbo concorda com o sujeito plural: os alunos estudam.'),
      q('facil', 'Qual frase está correta?', ['Haviam muitos alunos na sala.', 'Havia muitos alunos na sala.', 'Haviam muito aluno na sala.', 'Havião muitos alunos na sala.'], 1, 'No sentido de existir, haver é impessoal e fica no singular: havia.'),
      q('facil', 'Em "Ana e Paulo chegaram", o verbo está no plural porque:', ['o sujeito é composto', 'o sujeito é oculto', 'é um verbo impessoal', 'o sujeito é indeterminado'], 0, 'Dois núcleos (Ana e Paulo) formam sujeito composto, que pede o verbo no plural.'),
      q('medio', 'Qual frase usa corretamente o verbo "fazer" indicando tempo decorrido?', ['Fazem dois anos que moro aqui.', 'Faz dois anos que moro aqui.', 'Fazia dois anos que moram aqui.', 'Fazem-se dois anos que moro aqui.'], 1, 'Fazer, indicando tempo, é impessoal e fica no singular.'),
      q('medio', 'Qual frase está correta quanto à palavra "meio"?', ['Ela está meia cansada.', 'Ela está meio cansada.', 'Ela estão meio cansada.', 'Ela está meios cansada.'], 1, 'Meio, no sentido de "um pouco", é advérbio e não varia.'),
      q('medio', 'Qual frase concorda corretamente nominalmente?', ['As meninas estavam sozinha.', 'As meninas estavam sozinhas.', 'As meninas estava sozinhas.', 'Os meninas estavam sozinhas.'], 1, 'O adjetivo sozinhas concorda com meninas (feminino plural).'),
      q('dificil', 'Qual é a forma correta de um anúncio de venda de casas?', ['Vende-se casas.', 'Vendem-se casas.', 'Vendem casas-se.', 'Se vende casas.'], 1, 'Casas é o sujeito da voz passiva sintética: o verbo vai ao plural (vendem-se).'),
      q('dificil', 'Qual frase está de acordo com a norma-padrão?', ['Existe várias soluções.', 'Existem várias soluções.', 'Existia várias soluções.', 'Existem vários solução.'], 1, 'Existir não é impessoal: concorda com o sujeito (várias soluções).'),
    ],
  },
  {
    topic: 'regencia-e-crase', grade: '9º ano', title: 'Regência e crase', subtitle: 'Verbos e preposições, e quando usar o acento grave',
    resumo: String.raw`## Crase
É a **fusão** da preposição *a* com o artigo feminino *a(s)*, marcada pelo acento grave: *à*.

**Truque:** troque a palavra feminina por uma masculina. Se aparecer *ao*, usa-se crase. *Fui **à** escola* (Fui **ao** colégio).

### Usa-se crase
- Antes de palavra feminina com artigo, quando o verbo/termo pede *a*: *Fui à escola.*
- Em **horas**: *às oito horas.*
- Em locuções adverbiais femininas: *à noite, às vezes, à tarde.*

### Não se usa crase
- Antes de **verbo**: *Começou a chorar.*
- Antes de palavra **masculina**: *a pé, a cavalo.*
- Antes de **pronomes pessoais**: *Refiro-me a ela.*
- Entre palavras repetidas: *cara a cara.*

## Regência verbal (alguns casos)
- **Assistir** (no sentido de *ver*): *a*. *Assisti **ao** filme.*
- **Obedecer**: *a*. *Obedeço **ao** pai.*
- **Preferir** algo **a** outra coisa: *Prefiro cinema **a** teatro.*
- **Aspirar** (desejar): *a*.

## Erros comuns
- Usar crase antes de verbos.
- Dizer *Prefiro mais cinema do que teatro*.`,
    questoes: [
      q('facil', 'Qual é a forma correta?', ['Fui a escola.', 'Fui à escola.', 'Fui á escola.', 'Fui as escola.'], 1, 'O verbo ir pede preposição a e escola aceita artigo a: a + a = à.'),
      q('facil', 'Em qual frase NÃO se usa crase?', ['Ela começou a chorar.', 'Cheguei às oito horas.', 'Saí à noite.', 'Fui à praia.'], 0, 'Antes de verbo (chorar) não há artigo, então não há crase.'),
      q('facil', 'Qual é a forma correta?', ['Cheguei as oito horas.', 'Cheguei às oito horas.', 'Cheguei á oito horas.', 'Cheguei à oito horas.'], 1, 'Com horas, usa-se crase: às oito horas.'),
      q('medio', 'Qual é a forma correta?', ['Refiro-me à ela.', 'Refiro-me a ela.', 'Refiro-me á ela.', 'Refiro-me as ela.'], 1, 'Pronomes pessoais não aceitam artigo, então não há crase: a ela.'),
      q('medio', 'Qual frase está de acordo com a norma-padrão?', ['Assisti o filme ontem.', 'Assisti ao filme ontem.', 'Assisti no filme ontem.', 'Assisti de o filme ontem.'], 1, 'Assistir, no sentido de ver, é transitivo indireto e pede a preposição a: ao filme.'),
      q('medio', 'Qual frase usa corretamente o verbo "preferir"?', ['Prefiro cinema do que teatro.', 'Prefiro cinema a teatro.', 'Prefiro mais cinema que teatro.', 'Prefiro cinema para teatro.'], 1, 'Preferir exige a preposição a: prefere-se uma coisa a outra.'),
      q('dificil', 'Qual frase está de acordo com a norma-padrão?', ['Ele obedece o pai.', 'Ele obedece ao pai.', 'Ele obedece de o pai.', 'Ele obedece no pai.'], 1, 'Obedecer pede a preposição a (obedecer a alguém).'),
      q('dificil', 'Em qual frase o uso da crase está correto?', ['Entreguei o livro à professora.', 'Comecei à estudar.', 'Falei à ele.', 'Andamos à pé.'], 0, 'À professora = a (preposição) + a (artigo). As outras ocorrem antes de verbo, pronome pessoal ou palavra masculina.'),
    ],
  },
  {
    topic: 'funcoes-da-linguagem', grade: '1ª série EM', title: 'Funções da linguagem', subtitle: 'Referencial, emotiva, conativa, poética, fática e metalinguística',
    resumo: String.raw`## Conceito
Cada texto tem uma **intenção principal**. A função da linguagem é o foco dessa intenção.

## As seis funções
| Função | Foco | Exemplo |
|---|---|---|
| **Referencial** (denotativa) | assunto, o mundo | notícia, texto científico |
| **Emotiva** (expressiva) | o emissor, os sentimentos | poema em 1ª pessoa, desabafo |
| **Conativa** (apelativa) | o receptor | propaganda, ordem: *Compre já!* |
| **Poética** | a forma da mensagem | poema, slogan criativo |
| **Fática** | o canal da comunicação | *Alô? Está me ouvindo?* |
| **Metalinguística** | o próprio código | dicionário, gramática, poema sobre poesia |

## Como identificar
Pergunte: o texto quer **informar** (referencial), **expressar emoção** (emotiva), **convencer** (conativa), **chamar atenção para as palavras** (poética), **testar o contato** (fática) ou **explicar a língua** (metalinguística)?

## Observação
Um mesmo texto pode ter várias funções; a que **predomina** é a que se pede nas provas.

## Erros comuns
- Confundir a função conativa (convencer) com a referencial (informar).
- Achar que só poemas têm função poética.`,
    questoes: [
      q('facil', 'A função referencial da linguagem tem como foco:', ['os sentimentos do emissor', 'informar sobre um assunto', 'convencer o receptor', 'a forma da mensagem'], 1, 'Na função referencial, predomina a informação objetiva (notícia, texto científico).'),
      q('facil', 'Um anúncio que diz "Compre agora!" apresenta predominantemente a função:', ['poética', 'emotiva', 'conativa', 'metalinguística'], 2, 'A função conativa (ou apelativa) busca influenciar o receptor, com verbos no imperativo.'),
      q('facil', 'Na função poética, o foco está:', ['no canal', 'na forma e na elaboração da mensagem', 'no receptor', 'no código'], 1, 'A atenção recai sobre como a mensagem é construída: sons, ritmo e imagens.'),
      q('medio', 'Em "Alô? Está me ouvindo?", predomina a função:', ['fática', 'referencial', 'conativa', 'poética'], 0, 'A frase testa se o canal de comunicação está funcionando: função fática.'),
      q('medio', 'Um verbete de dicionário apresenta predominantemente a função:', ['emotiva', 'poética', 'metalinguística', 'fática'], 2, 'O texto fala sobre a própria língua (o código): metalinguagem.'),
      q('medio', 'Um texto em primeira pessoa que expressa sentimentos intensos do autor tem predomínio da função:', ['emotiva', 'referencial', 'fática', 'metalinguística'], 0, 'A função emotiva (ou expressiva) centra-se no emissor e em suas emoções.'),
      q('dificil', 'O texto "Compre já! Última chance!" tem como objetivo principal:', ['informar neutralmente', 'convencer e levar o receptor a agir', 'falar sobre a própria língua', 'testar o canal'], 1, 'É linguagem de persuasão: função conativa.'),
      q('dificil', 'Em uma notícia de jornal, predomina a função:', ['referencial', 'poética', 'emotiva', 'fática'], 0, 'A notícia informa fatos de modo objetivo: função referencial.'),
    ],
  },
  {
    topic: 'redacao-dissertativa', grade: '3ª série EM', title: 'Redação dissertativa-argumentativa', subtitle: 'Estrutura, competências do ENEM e proposta de intervenção',
    resumo: String.raw`## Estrutura do texto
1. **Introdução:** contextualiza o tema e apresenta a **tese** (o seu ponto de vista).
2. **Desenvolvimento:** em geral **2 parágrafos**, cada um com um **argumento** bem explicado (dados, exemplos, repertório).
3. **Conclusão:** retoma a tese e traz a **proposta de intervenção**.

## As 5 competências do ENEM (cada uma vale até 200 pontos; total 1000)
- **C1:** domínio da norma culta.
- **C2:** compreensão do tema e do gênero (dissertativo-argumentativo), com repertório.
- **C3:** seleção e organização de argumentos (projeto de texto).
- **C4:** coesão: uso de conectivos (*porém, portanto, além disso*).
- **C5:** **proposta de intervenção** respeitando os direitos humanos.

## Proposta de intervenção: 5 elementos
**Agente** (quem faz), **ação** (o que fazer), **meio/modo** (como), **finalidade** (para quê) e **detalhamento**.

## Atenção
- **Fugir ao tema** leva à nota **zero**, assim como copiar os textos motivadores em excesso ou escrever fora do gênero.
- Não ferir os direitos humanos.

## Erros comuns
- Tese vaga ou ausente.
- Proposta sem agente ou sem detalhamento.
- Não conectar os parágrafos.`,
    questoes: [
      q('facil', 'Qual é a nota máxima de uma redação do ENEM?', ['100', '500', '800', '1 000'], 3, 'São 5 competências, cada uma valendo até 200 pontos: 1 000 no total.'),
      q('facil', 'Quanto vale, no máximo, cada competência da redação do ENEM?', ['100 pontos', '200 pontos', '250 pontos', '500 pontos'], 1, 'Cada uma das cinco competências vale até 200 pontos.'),
      q('facil', 'Em uma redação dissertativa-argumentativa, a tese costuma aparecer:', ['na introdução', 'só na conclusão', 'em cada linha', 'nunca aparece'], 0, 'A introdução contextualiza o tema e apresenta a tese que será defendida.'),
      q('medio', 'A competência 5 do ENEM avalia:', ['a norma culta', 'a proposta de intervenção', 'a coesão', 'o tamanho do texto'], 1, 'C5: elaboração de proposta de intervenção que respeite os direitos humanos.'),
      q('medio', 'Quais são os cinco elementos esperados em uma proposta de intervenção?', ['Introdução, tese, argumento, conclusão e título', 'Agente, ação, meio/modo, finalidade e detalhamento', 'Causa, consequência, exemplo, dado e citação', 'Sujeito, verbo, objeto, adjunto e aposto'], 1, 'São eles: quem faz (agente), o que faz (ação), como (meio/modo), para quê (finalidade) e o detalhamento.'),
      q('medio', 'A competência 1 do ENEM avalia o domínio da:', ['norma culta da língua', 'coesão textual', 'proposta de intervenção', 'caligrafia'], 0, 'C1 trata da modalidade escrita formal: ortografia, acentuação, concordância, pontuação.'),
      q('dificil', 'Fugir completamente ao tema proposto em uma redação do ENEM resulta em:', ['perda de 50 pontos', 'nota zero', 'nota mínima de 200', 'apenas um aviso'], 1, 'Fuga ao tema leva à nota zero na redação.'),
      q('dificil', 'Conectivos como "porém", "portanto" e "além disso" servem principalmente para trabalhar:', ['a tese', 'a coesão (C4)', 'a proposta de intervenção', 'o título'], 1, 'Esses elementos articulam ideias e parágrafos, o que é avaliado na competência 4 (coesão).'),
    ],
  },
];
