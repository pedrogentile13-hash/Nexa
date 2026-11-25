import { resumo, type ResumoG3 } from './types';

/** Resumos de Língua Portuguesa, Literatura, Inglês, Espanhol e Artes. */
export const RESUMOS_LINGUAGENS: ResumoG3[] = [
  resumo(
    'lingua-portuguesa',
    '6º ano',
    'port6-classes',
    'Classes de palavras',
    'Substantivo, adjetivo, verbo, advérbio, pronome e mais',
    `
## As principais classes
- **Substantivo:** nomeia seres e coisas (menino, escola, alegria).
- **Adjetivo:** caracteriza o substantivo (menino **alegre**).
- **Verbo:** ação, estado ou fenômeno (estudar, ser, chover).
- **Advérbio:** modifica verbo, adjetivo ou outro advérbio (chegou **cedo**; **muito** feliz).
- **Pronome:** substitui ou acompanha o nome (ela, meu, este).
- **Artigo:** define ou indefine o substantivo (o, a, um, uma).
- **Numeral:** indica quantidade ou ordem (três, terceiro).
- **Preposição e conjunção:** ligam palavras e orações (de, para; e, mas).

## Dica
A classe depende do **uso na frase**: em "O jantar foi ótimo", jantar é substantivo; em "Eu jantar cedo", seria verbo.`,
  ),
  resumo(
    'lingua-portuguesa',
    '6º ano',
    'port6-acentuacao',
    'Acentuação gráfica',
    'Oxítonas, paroxítonas e proparoxítonas',
    `
## Sílaba tônica
- **Oxítona:** última sílaba (ca-FÉ).
- **Paroxítona:** penúltima (ca-DEI-ra).
- **Proparoxítona:** antepenúltima (LÂM-pa-da).

## Regras mais cobradas
- **Todas as proparoxítonas** são acentuadas: lâmpada, médico, último.
- **Oxítonas** terminadas em a, e, o (seguidas ou não de s) levam acento: sofá, você, avô.
- **Paroxítonas** terminadas em r, l, x, n, ps, ão, ã... são acentuadas: açúcar, fácil, tórax.

## Erro comum
Acentuar palavra que não pede acento, como "jovém". Jovem é paroxítona terminada em m e não leva acento.`,
  ),
  resumo(
    'lingua-portuguesa',
    '7º ano',
    'port7-sujeito-predicado',
    'Sujeito, predicado e tipos de sujeito',
    'Quem faz a ação e o que se diz sobre ele',
    `
## Termos essenciais
- **Sujeito:** de quem se declara algo.
- **Predicado:** o que se declara sobre o sujeito.

## Tipos de sujeito
- **Simples:** um núcleo (O cachorro latiu).
- **Composto:** dois ou mais núcleos (O cachorro e o gato dormiam).
- **Oculto:** não aparece, mas o verbo revela (Fomos ao cinema = nós).
- **Indeterminado:** não se identifica quem pratica (Roubaram a bicicleta).
- **Inexistente:** verbos de fenômeno da natureza e "haver" no sentido de existir (Choveu; Há muitos livros).

## Erro comum
Separar sujeito do verbo com vírgula: "Os alunos, chegaram cedo" está errado.`,
  ),
  resumo(
    'lingua-portuguesa',
    '8º ano',
    'port8-vozes-verbais',
    'Vozes verbais e concordância',
    'Ativa, passiva e como o verbo concorda',
    `
## Vozes do verbo
- **Ativa:** o sujeito pratica a ação (O técnico escolheu os jogadores).
- **Passiva analítica:** ser + particípio (Os jogadores foram escolhidos pelo técnico).
- **Passiva sintética:** verbo + se (Vendem-se casas = casas são vendidas).

## Concordância verbal
O verbo concorda com o sujeito em número e pessoa:
- Faltam dois alunos (sujeito plural).
- Verbos **fazer** (tempo) e **haver** (existir) ficam no singular: Faz dois anos; Havia muitas pessoas.

## Dica
Na passiva sintética, ache o sujeito: "Aluga-se apartamento" (singular) e "Alugam-se apartamentos" (plural).`,
  ),
  resumo(
    'lingua-portuguesa',
    '9º ano',
    'port9-conectivos-crase',
    'Conectivos, orações e crase',
    'Relações de sentido e quando usar o acento grave',
    `
## Relações de sentido dos conectivos
- **Adição:** e, além disso.
- **Oposição:** mas, porém, contudo.
- **Causa:** porque, pois, já que.
- **Consequência/conclusão:** portanto, logo, por isso.
- **Concessão:** embora, apesar de.
- **Condição:** se, caso.

## Crase
Junção da preposição **a** com o artigo **a**: "Vou **à** escola" (ir **a** + **a** escola).
- Não há crase antes de **verbo**, **palavra masculina** ou **pronome pessoal**.
- Truque: troque por uma palavra masculina. Se aparecer "ao", há crase: "Vou ao colégio" → "Vou à escola".`,
  ),
  resumo(
    'lingua-portuguesa',
    '1ª série EM',
    'port1-figuras',
    'Figuras de linguagem',
    'Metáfora, metonímia, hipérbole, ironia e outras',
    `
## As mais cobradas
- **Metáfora:** comparação implícita ("Seus olhos são estrelas").
- **Comparação:** com conectivo ("forte como um touro").
- **Metonímia:** troca por relação de proximidade ("Li Machado" = li a obra dele).
- **Hipérbole:** exagero ("Já disse um milhão de vezes").
- **Eufemismo:** suaviza ("Partiu desta para melhor").
- **Ironia:** diz o contrário do que pensa.
- **Antítese:** palavras opostas ("amor e ódio").
- **Paradoxo:** ideias contraditórias ("contentamento descontente").
- **Onomatopeia:** imita som ("tic-tac").

## Dica
Pergunte: o sentido é literal ou figurado? Qual é o efeito (humor, ênfase, crítica)?`,
  ),
  resumo(
    'lingua-portuguesa',
    '2ª série EM',
    'port2-coesao-coerencia',
    'Coesão e coerência textual',
    'O que liga e o que dá sentido ao texto',
    `
## Coesão
São os recursos que **ligam** as partes do texto:
- **Referencial:** pronomes e sinônimos que retomam (Ana chegou. **Ela** abriu a sala).
- **Sequencial:** conectivos (portanto, no entanto, além disso).

## Coerência
É a **lógica do sentido**: as ideias não se contradizem e fazem sentido no mundo. "Choveu muito, portanto a seca se agravou" é incoerente.

## Para a redação
Cada parágrafo deve abrir com uma ideia, desenvolver com argumento e **conectar-se ao anterior**. Varie os conectivos (não repita "além disso" em todo parágrafo).`,
  ),
  resumo(
    'lingua-portuguesa',
    '3ª série EM',
    'port3-generos-interpretacao',
    'Gêneros textuais e interpretação',
    'Como ler questões de Linguagens sem cair em pegadinhas',
    `
## Identifique o gênero
Notícia (informar), artigo de opinião (convencer), crônica (cotidiano), charge/tirinha (crítica com humor), propaganda (apelo ao consumo).

## Passo a passo da questão
1. Leia o **enunciado** antes do texto.
2. Marque o **gênero**, o **público** e a **intenção**.
3. Procure a **ideia central** (o que todo o texto defende).
4. Elimine alternativas com palavras como **sempre, nunca, apenas**, exceto se o texto as sustentar.
5. Em figuras de linguagem, pergunte qual é o **efeito de sentido**.

## Erro comum
Marcar uma alternativa verdadeira "no geral", mas que **não está no texto**. Na prova, vale o que o texto diz.`,
  ),

  resumo(
    'literatura',
    '1ª série EM',
    'lit1-origens-barroco',
    'Trovadorismo, Quinhentismo e Barroco',
    'As primeiras manifestações literárias em língua portuguesa e no Brasil',
    `
## Trovadorismo (Idade Média)
Cantigas de **amor** (voz masculina, amor inatingível), de **amigo** (voz feminina), de **escárnio** e **maldizer** (sátira).

## Quinhentismo (século XVI)
Literatura de **informação** (Carta de Caminha) e **jesuítica** (Anchieta, catequese).

## Barroco (século XVII)
Conflito entre fé e prazer, linguagem rebuscada, **antíteses** e **paradoxos**.
- **Cultismo:** jogo de palavras. **Conceptismo:** jogo de ideias.
- Nomes: Gregório de Matos (sátira) e Padre Antônio Vieira (sermões).`,
  ),
  resumo(
    'literatura',
    '2ª série EM',
    'lit2-romantismo',
    'Romantismo no Brasil',
    'Três gerações: indianismo, mal do século e poesia social',
    `
## Características
Subjetividade, idealização, nacionalismo, escapismo e valorização da natureza.

## Gerações poéticas
1. **Nacionalista/indianista:** Gonçalves Dias ("Canção do Exílio").
2. **Ultrarromântica:** Álvares de Azevedo (tédio, morte, "mal do século").
3. **Condoreira:** Castro Alves (poesia social e abolicionista, "Navio Negreiro").

## Prosa
José de Alencar: indianista (*Iracema*, *O Guarani*), urbano (*Senhora*), regionalista (*O Sertanejo*).`,
  ),
  resumo(
    'literatura',
    '2ª série EM',
    'lit2-realismo-naturalismo',
    'Realismo e Naturalismo',
    'Machado de Assis, Aluísio Azevedo e o olhar crítico',
    `
## Realismo
Reação ao Romantismo: objetividade, **análise psicológica**, **crítica social**. Marco: *Memórias Póstumas de Brás Cubas* (1881), de Machado de Assis, narrada por um "defunto-autor" irônico. Em *Dom Casmurro*, a dúvida sobre a traição de Capitu nunca é resolvida.

## Naturalismo
Determinismo: o ser humano é moldado pelo **meio**, pela **raça** e pelo **momento**. Aluísio Azevedo, *O Cortiço* (1890).

## Diferença rápida
Realismo foca na psicologia e na crítica; Naturalismo, nos instintos e no meio social.`,
  ),
  resumo(
    'literatura',
    '3ª série EM',
    'lit3-modernismo',
    'Modernismo brasileiro',
    'Semana de 22, geração de 30 e geração de 45',
    `
## 1ª fase (1922–1930)
Ruptura: verso livre, linguagem coloquial, nacionalismo crítico. Semana de Arte Moderna (SP, 1922). Mário de Andrade (*Macunaíma*), Oswald de Andrade (Manifesto Antropófago), Manuel Bandeira.

## 2ª fase (1930–1945)
**Romance regionalista de denúncia**: Graciliano Ramos (*Vidas Secas*), Rachel de Queiroz (*O Quinze*), Jorge Amado. Poesia: Drummond, Cecília Meireles, Murilo Mendes.

## 3ª fase (1945 em diante)
Experimentação e introspecção: Guimarães Rosa (*Grande Sertão: Veredas*), Clarice Lispector, João Cabral de Melo Neto.`,
  ),
  resumo(
    'literatura',
    '3ª série EM',
    'lit3-literatura-contemporanea',
    'Literatura contemporânea e vozes plurais',
    'Escrevivência, periferia e novos olhares',
    `
## O que mudou
A literatura contemporânea ampliou **quem escreve e sobre o quê**: mulheres, autores negros, indígenas e periféricos ganharam espaço.

## Nomes e conceitos
- **Conceição Evaristo** criou a **escrevivência**: escrita a partir da experiência de vida, sobretudo de mulheres negras.
- **Carolina Maria de Jesus** (*Quarto de Despejo*, 1960): diário de quem vivia numa favela de São Paulo.
- **Ailton Krenak** e **Daniel Munduruku**: vozes indígenas contemporâneas.

## Dica de prova
Questões de literatura recente pedem **leitura do trecho** e relação com o contexto social, não decoreba de datas.`,
  ),

  resumo(
    'ingles',
    '6º ano',
    'ing6-to-be',
    'Verb to be e pronomes pessoais',
    'I am, you are, he is: apresentação e identificação',
    `
## Verb to be
| pronome | presente |
|---|---|
| I | am |
| he, she, it | is |
| you, we, they | are |

## Negativa e pergunta
- Negativa: **I am not**, he **is not** (isn't), they **are not** (aren't).
- Pergunta: o verbo vem antes do sujeito: **Are you** a student?

## Vocabulário útil
brother (irmão), sister (irmã), Monday (segunda), Friday (sexta), green (verde).

## Erro comum
Dizer "I have 12 years" em vez de **I am 12 years old**.`,
  ),
  resumo(
    'ingles',
    '7º ano',
    'ing7-simple-present',
    'Simple present e advérbios de frequência',
    'Rotina, hábitos e fatos',
    `
## Formação
- I, you, we, they: **work**. He, she, it: **works** (com -s/-es: watches, goes).
- Negativa: **do not / does not** + verbo base (She **doesn't like** pizza).
- Pergunta: **Do/Does** + sujeito + verbo base (**Does** he study?).

## Advérbios de frequência
always > usually > often > sometimes > rarely > never. Vêm **antes** do verbo principal: I **usually** have breakfast at 7.

## Erro comum
"She doesn't likes": depois de does/doesn't o verbo volta à forma base.`,
  ),
  resumo(
    'ingles',
    '8º ano',
    'ing8-simple-past',
    'Simple past e verbos irregulares',
    'Contar o que aconteceu',
    `
## Verbos regulares
Acrescentam **-ed**: watch → watched; study → **studied**.

## Irregulares muito cobrados
go → went, buy → bought, eat → ate, write → wrote, see → saw, have → had.

## Negativa e pergunta
Use **did**: I **didn't go**; **Did** you see the game? O verbo volta à base.

## Verbo to be no passado
I/he/she/it **was**; you/we/they **were**.

## Marcadores de tempo
yesterday, last week, ago (two days ago).`,
  ),
  resumo(
    'ingles',
    '1ª série EM',
    'ing1-falsos-cognatos',
    'Falsos cognatos',
    'Palavras parecidas com o português, mas com outro sentido',
    `
## Os mais cobrados
| inglês | significa | NÃO é |
|---|---|---|
| pretend | fingir | pretender |
| library | biblioteca | livraria (bookstore) |
| college | faculdade | colégio |
| actually | na verdade | atualmente (currently) |
| push | empurrar | puxar (pull) |
| eventually | por fim | eventualmente (occasionally) |
| parents | pais | parentes (relatives) |

## Dica
Em prova, se a palavra parece fácil demais, desconfie: pode ser falso cognato. Use o **contexto** da frase.`,
  ),
  resumo(
    'ingles',
    '3ª série EM',
    'ing3-leitura-enem',
    'Leitura em inglês no ENEM e vestibulares',
    'Estratégias para entender o texto sem traduzir tudo',
    `
## Estratégias
1. Leia o enunciado (em português) e descubra **o que se pede**.
2. Identifique o **gênero** (notícia, anúncio, poema, tirinha).
3. **Skimming:** leia rápido para a ideia geral. **Scanning:** procure a informação específica.
4. Use **cognatos** (information, important) e o **contexto** para palavras novas.
5. Atenção aos conectivos: but, however (oposição), therefore, hence (conclusão), although, despite (concessão).

## Erro comum
Traduzir palavra por palavra. A prova avalia **compreensão**, não tradução.`,
  ),

  resumo(
    'espanhol',
    '1ª série EM',
    'esp1-falsos-amigos',
    'Falsos amigos entre espanhol e português',
    'Palavras que enganam o brasileiro',
    `
## Os clássicos
- **exquisito** = delicioso (não "esquisito"; esquisito = raro).
- **embarazada** = grávida (não "embaraçada").
- **oficina** = escritório (oficina mecânica = taller).
- **cena** = jantar (cena de filme = escena).
- **rato** = momento (o animal é ratón).

## Artigos
Em espanhol há o neutro **lo** (lo bueno, lo importante) e as contrações **al** (a + el) e **del** (de + el).

## Dica
Na prova de espanhol, o contexto do texto decide: releia a frase inteira antes de escolher.`,
  ),
  resumo(
    'espanhol',
    '3ª série EM',
    'esp3-conectores-leitura',
    'Conectores e leitura em espanhol',
    'Sin embargo, aunque, por lo tanto e outros',
    `
## Conectores
- **sin embargo / pero**: oposição.
- **aunque**: concessão (embora).
- **por lo tanto / por eso**: conclusão.
- **además**: adição.
- **porque / ya que**: causa.

## Falsos amigos de leitura
**todavía** = ainda; **apenas** = mal (Apenas llegó = Assim que chegou); **pelo** = cabelo.

## Dica
Leia o texto procurando a **tese** e os **conectores**: eles mostram a estrutura do argumento.`,
  ),

  resumo(
    'artes',
    '7º ano',
    'art7-cores-movimentos',
    'Cores, formas e movimentos artísticos',
    'Do Renascimento ao Modernismo brasileiro',
    `
## Cores
- **Primárias:** vermelho, amarelo, azul. **Secundárias:** laranja, verde, roxo.
- **Quentes** (vermelho, laranja, amarelo) e **frias** (azul, verde, violeta).
- **Complementares:** opostas no círculo cromático (azul e laranja).

## Movimentos
- **Renascimento:** perspectiva e humanismo (Leonardo da Vinci, Michelangelo).
- **Barroco:** contraste de luz e emoção (no Brasil, Aleijadinho).
- **Impressionismo:** luz e cor de um instante (Monet).
- **Cubismo:** formas geométricas, vários ângulos (Picasso).
- **Modernismo brasileiro:** Tarsila do Amaral (*Abaporu*, 1928).`,
  ),
  resumo(
    'artes',
    '1ª série EM',
    'art1-cultura-popular',
    'Música e cultura popular brasileira',
    'Samba, bossa nova, baião, frevo e capoeira',
    `
## Ritmos e origens
- **Samba:** raízes afro-brasileiras, Rio de Janeiro.
- **Choro:** Pixinguinha, "Carinhoso".
- **Bossa Nova** (fim dos anos 1950): João Gilberto e Tom Jobim.
- **Baião:** Luiz Gonzaga, Nordeste.
- **Tropicalismo** (1967–68): Caetano Veloso e Gilberto Gil mesclam cultura popular, rock e vanguarda.
- **Frevo:** Pernambuco, Patrimônio Imaterial da Humanidade.

## Manifestações
Capoeira (luta, dança e música), bumba meu boi (Maranhão), maracatu e congada.

## Por que importa
A cultura popular carrega a **memória** e a **identidade** de cada região.`,
  ),
];
