import { resumo, type ResumoG3 } from '../grande3/types';

/**
 * PB4 · Produção de Texto (9º ano): redação dissertativo-argumentativa no padrão Enem, com o tema
 * "cancelamento nas redes sociais". Resumos de estudo do Nexa (os modelos são originais).
 */
const S = '9º ano' as const;
const PT = 'producao-de-texto';

export const RESUMOS_REDACAO_PB4: ResumoG3[] = [
  resumo(
    PT,
    S,
    'pb4-red-estrutura',
    'Produção de Texto PB4 · A estrutura da redação (4 parágrafos)',
    'Introdução, dois desenvolvimentos e conclusão com proposta de intervenção',
    `## O gênero
O **texto dissertativo-argumentativo** defende um **ponto de vista (tese)** sobre um tema social, com **argumentos** e uma **proposta de intervenção** para o problema. Escreva na **3ª pessoa** ou de forma impessoal, na **norma-padrão**, com **título** (opcional).

## A estrutura de 4 parágrafos
| Parágrafo | Função | O que entra |
|---|---|---|
| **1º · Introdução** | apresentar | contextualização do tema + **tese** + (opcional) anúncio dos argumentos |
| **2º · Desenvolvimento 1** | argumentar | **tópico frasal** + argumento + **repertório** + explicação |
| **3º · Desenvolvimento 2** | argumentar | **outro** argumento, com repertório ou exemplo |
| **4º · Conclusão** | fechar | **retomada** da tese + **proposta de intervenção completa** |

## Introdução: fórmula
1. **Contexto:** um fato, dado, citação, lei, obra ou conceito que "abre" o tema.
2. **Problematização:** o que torna o tema um problema hoje.
3. **Tese:** sua opinião, clara e em uma frase (ex.: "Nesse sentido, o cancelamento…, pois…").

## Desenvolvimento: fórmula
**Tópico frasal** → **argumento** → **repertório** (prova do argumento) → **explicação** (o que o repertório mostra) → **fecho** (liga ao tema).

> Dica de mestre: cada desenvolvimento defende **uma ideia só**. Não misture dois argumentos num parágrafo.

## Conclusão: fórmula
1. **Retomada** da tese com **outras palavras** (nunca copie a introdução).
2. **Proposta de intervenção** com **5 elementos**: **agente**, **ação**, **meio/modo**, **finalidade** e **detalhamento**.
3. (Opcional) **fecho** com uma frase de efeito ou ligação com o repertório da introdução.

## Tamanho
Prove que sabe organizar: **7 a 30 linhas** (na prova, siga o limite da folha). Parágrafos equilibrados: nada de uma introdução de 2 linhas e um desenvolvimento de 12.

## Erros de estrutura que mais pesam
- Mais ou menos que 4 parágrafos quando a proposta pede quatro.
- Tese ausente ou escondida.
- Argumento sem prova (só opinião).
- Conclusão sem proposta ou com proposta vaga ("a sociedade deve conscientizar-se").`,
  ),
  resumo(
    PT,
    S,
    'pb4-red-competencias',
    'Produção de Texto PB4 · As 5 competências explicadas',
    'O que cada uma cobra, como chegar aos 200 pontos e o que zera',
    `## Como funciona a nota
A redação vale **até 1.000 pontos**: **5 competências**, de **0 a 200** cada (níveis 0, 40, 80, 120, 160 e 200).

## C1 · Norma-padrão
Domínio da **modalidade escrita formal**: ortografia, acentuação, pontuação, concordância, regência, crase, sintaxe e escolha de palavras.
- **Para 200:** no máximo poucos desvios, sem prejudicar a leitura.
- **Cuidado com:** oralidade ("a gente", "tipo", "né"), abreviações, gírias e repetição de palavras.

## C2 · Compreensão do tema e tipo textual
Entender a proposta, **desenvolver o tema completo** (não fugir nem "tangenciar") e usar **repertório sociocultural** em uma estrutura **dissertativo-argumentativa**.
- **Para 200:** repertório **legitimado**, **pertinente** e **produtivo** (aparece **dentro** do argumento) em todo o texto, com **três partes**: introdução, desenvolvimento e conclusão.

## C3 · Projeto de texto e argumentação
Selecionar, relacionar, organizar e interpretar informações e argumentos para **defender um ponto de vista**.
- **Para 200:** projeto de texto **estratégico**, com argumentos **bem encadeados** e **sem contradições**, com autoria (nada de cópia dos textos motivadores).

## C4 · Coesão
**Mecanismos linguísticos** que ligam as partes: conectivos, pronomes, sinônimos e outros.
- **Para 200:** **variedade** de conectivos entre as **frases** e entre os **parágrafos**, **sem repetições** e **sem inadequações**.

## C5 · Proposta de intervenção
Propor solução que **respeite os direitos humanos**, com os **5 elementos**: **agente** (quem), **ação** (o quê), **meio/modo** (como), **finalidade** (para quê) e **detalhamento** (explicar um dos itens anteriores).
- **Para 200:** os **5 elementos válidos**, **articulados** ao debate do texto.

## O que zera ou anula
- **Fuga total ao tema**; **não ser dissertativo-argumentativo**.
- **Menos de 7 linhas**; **cópia** dos textos motivadores como se fosse sua.
- **Impropérios**, desenhos ou textos desconexos.
- **Desrespeito aos direitos humanos** (por exemplo, "pena de morte", "castigo físico", linchamento): zera a **C5**.

## Estratégia
Escreva pensando nas **cinco notas** ao mesmo tempo: **norma** (C1), **tema e repertório** (C2), **argumentos** (C3), **conectivos** (C4) e **proposta completa** (C5).`,
  ),
  resumo(
    PT,
    S,
    'pb4-red-coesao',
    'Produção de Texto PB4 · Conectivos e coesão',
    'Tabela de conectivos por função e como evitar repetições',
    `## Por que conectivos?
Eles **ligam ideias** e mostram ao leitor a relação entre elas (oposição, causa, conclusão…). Na **C4**, a variedade é o que pontua.

## Conectivos por função
| Função | Para iniciar o parágrafo | Dentro do período |
|---|---|---|
| **Adição** | Além disso, Ademais, Outrossim | e, bem como, não só… mas também |
| **Oposição** | No entanto, Entretanto, Todavia, Contudo | mas, porém, embora, apesar de |
| **Causa** | Isso ocorre porque, Uma vez que | pois, visto que, já que, em virtude de |
| **Consequência** | Dessa forma, Assim, Por conseguinte | de modo que, de forma que, tanto que |
| **Exemplo** | Por exemplo, Como ilustração | como, tal como, a exemplo de |
| **Explicação** | Isto é, Ou seja | a saber, a fim de explicar |
| **Conclusão** | Portanto, Logo, Em suma, Diante disso | por isso, logo, então |
| **Finalidade** | — | a fim de, para que, com o intuito de |
| **Comparação** | Assim como, Da mesma forma | como, tal qual |

## Fórmulas por parágrafo
- **Introdução:** "Em primeira análise…", "Nesse contexto…", "Sob esse viés…".
- **Desenvolvimento 1:** "Em primeiro plano…", "Primeiramente…".
- **Desenvolvimento 2:** "Ademais…", "Outrossim…", "Além disso…".
- **Conclusão:** "Portanto…", "Em suma…", "Diante do exposto…", "Dessa forma…".

## Retomada (sem repetir palavras)
Troque a palavra por **sinônimos**, **pronomes** e **expressões**: *cancelamento* → "essa prática", "esse fenômeno", "tal linchamento digital", "o ato de excluir alguém do convívio virtual".

## Erros de coesão
- Repetir o mesmo conectivo ("Além disso" três vezes).
- Usar conectivo de oposição quando a ideia é de adição.
- Começar **todo** período com conectivo.
- Usar "pois" no início da frase (prefira "porque", "uma vez que").
- Abusar de "onde" para tudo (use "em que", "no qual").

## Treino
Una as frases com o conectivo certo:
"O cancelamento pune erros. Pode atingir inocentes." → "O cancelamento pune erros; **no entanto**, pode atingir inocentes."`,
  ),
  resumo(
    PT,
    S,
    'pb4-red-repertorio',
    'Produção de Texto PB4 · Banco de repertórios sobre cancelamento',
    'Leis, autores, obras e fatos reais para usar nos seus argumentos',
    `## O que é repertório produtivo?
**Repertório sociocultural** é o conhecimento que você traz de fora (leis, filosofia, sociologia, filmes, livros, fatos) para **provar** seu argumento. Para valer 200 na C2 ele precisa ser:
1. **Legitimado:** de uma área do saber (e verdadeiro!).
2. **Pertinente:** ligado ao tema.
3. **Produtivo:** usado **dentro** do argumento, **explicado** e conectado à tese.

> Fórmula: *Segundo [fonte], [ideia]. Desse modo, [como isso explica o cancelamento].*

## 1. Leis e direitos
| Repertório | Para que serve |
|---|---|
| **Constituição Federal, art. 5º** | garante a **liberdade de expressão** (IV) e a **inviolabilidade da honra e da imagem** (X). O cancelamento tensiona esses dois direitos. |
| **Marco Civil da Internet (Lei 12.965/2014)** | estabelece **direitos e deveres** no uso da internet; a liberdade de expressão tem **limites**. |
| **Lei nº 13.185/2015** | institui o **Programa de Combate à Intimidação Sistemática** (*bullying*). |
| **Lei nº 14.811/2024** | tipifica como crime a **intimidação sistemática, inclusive a virtual** (*cyberbullying*), no Código Penal. |
| **Lei Geral de Proteção de Dados (Lei 13.709/2018)** | protege **dados pessoais**; expor dados de alguém ("doxxing") é violação. |
| **Declaração Universal dos Direitos Humanos (1948), art. 12** | ninguém sofrerá **ataques à sua honra e reputação**. |

## 2. Filósofos e sociólogos
| Pensador | Ideia | Como usar |
|---|---|---|
| **Zygmunt Bauman** (*Modernidade líquida*) | relações **fluidas e efêmeras**; tudo é descartável | o cancelamento "descarta" pessoas como mercadoria |
| **Guy Debord** (*A sociedade do espetáculo*) | a vida social vira **espetáculo** | o linchamento virtual é um show para a plateia |
| **Michel Foucault** (*Vigiar e Punir*) | punição pública e **vigilância** como forma de controle | o cancelamento é uma punição pública sem julgamento formal |
| **Byung-Chul Han** (*No enxame*) | a **indignação digital** é rápida e coletiva, sem diálogo | "enxame" de indignados que não debate |
| **Djamila Ribeiro** (*O que é lugar de fala?*) | quem sempre foi silenciado precisa ser ouvido | o cancelamento pode **dar voz** a vítimas |
| **Aristóteles** (*Ética a Nicômaco*) | a virtude está no **meio-termo** | nem impunidade, nem linchamento: cobrar com **proporção** |
| **Hannah Arendt** | o pensar e o **julgar** exigem reflexão individual | julgar sem pensar é seguir a multidão |

## 3. Obras e fatos
- **Black Mirror, episódio "Queda livre" (*Nosedive*, 2016):** sociedade em que as pessoas se avaliam por notas nas redes e perdem acesso a direitos quando a nota cai. Serve para mostrar o **poder da aprovação social**.
- **Jon Ronson, *Humilhado* (*So You've Been Publicly Shamed*, 2015):** relata como pessoas comuns tiveram a vida destruída por **humilhações públicas na internet**.
- **Caso Justine Sacco (2013):** uma publicação ofensiva (considerada uma piada de mau gosto) viralizou, e ela foi demitida. Exemplo de **punição desproporcional e viral**.
- **Monica Lewinsky (TED, 2015, *O preço da vergonha*):** fala sobre os efeitos da **humilhação pública em rede**.
- **"Cultura do cancelamento" (*cancel culture*):** expressão popularizada na década de 2010 para a prática de **retirar apoio** a alguém por atos ou falas considerados ofensivos.

## 4. Conceitos úteis
**Linchamento virtual**, **tribunal da internet**, **efeito manada**, **câmara de eco** e **bolha de filtro** (Eli Pariser), **cyberbullying**, **saúde mental**, **letramento digital**, **responsabilização proporcional**.

## Como usar sem errar
- **Nunca invente** dados ou frases. Prefira conceitos e fatos que você conhece bem.
- **Uma ideia por repertório**: explique por que ele prova seu argumento.
- **Varie**: use leis na proposta e autores nos argumentos.`,
  ),
  resumo(
    PT,
    S,
    'pb4-red-tema',
    'Produção de Texto PB4 · O tema: cancelamento nas redes sociais',
    'Teses prontas, argumentos a favor e contra e propostas de intervenção',
    `## O que é "cancelar"?
É **retirar o apoio, boicotar ou expor publicamente** uma pessoa, marca ou figura pública por falas ou atitudes consideradas ofensivas, muitas vezes com **ataques coletivos** nas redes sociais.

## Por que o tema é polêmico?
- **A favor:** dá **voz** a quem sofre abusos e **cobra responsabilidade** de pessoas com poder.
- **Contra:** pode virar **linchamento virtual**, ignorar **contexto**, impedir **retratação** e causar **sofrimento psíquico**.

## Três posicionamentos possíveis
### A) Positivo (cancelamento como responsabilização)
**Tese:** "O cancelamento é um instrumento legítimo de cobrança, pois amplia a voz de quem foi silenciado."
- **Arg. 1:** redes dão **voz** a vítimas que a Justiça e a mídia ignoravam (lugar de fala).
- **Arg. 2:** a **pressão social** leva empresas e figuras públicas a **mudar atitudes** (responsabilização).

### B) Negativo (cancelamento como violência virtual)
**Tese:** "O cancelamento se tornou um linchamento virtual, que pune de modo desproporcional e sem direito de defesa."
- **Arg. 1:** **ausência de contraditório**: "tribunal da internet" (Foucault, Han).
- **Arg. 2:** **danos à saúde mental** e à vida real (cyberbullying, Lei 14.811/2024).

### C) Equilibrado (cobrar com proporção)
**Tese:** "O cancelamento pode ser positivo ou negativo, dependendo da proporção e do espaço para retratação."
- **Arg. 1:** pode **expor injustiças** reais.
- **Arg. 2:** vira **excesso** quando não há **diálogo** nem **aprendizado** (Aristóteles, meio-termo).

## Argumentos prontos (escolha dois)
1. **Voz às vítimas** (lugar de fala, Djamila Ribeiro).
2. **Efeito manada** e **ausência de contraditório** (Han, "enxame").
3. **Desproporção da pena** (Foucault; caso Justine Sacco).
4. **Cultura do descarte** (Bauman, relações líquidas).
5. **Saúde mental** (cyberbullying, Lei 14.811/2024).
6. **Falta de letramento digital** e de ética nas redes (educação).

## Propostas de intervenção (modelos)
| Elemento | Modelo 1 (educação) | Modelo 2 (leis e plataformas) |
|---|---|---|
| **Agente** | Ministério da Educação, em parceria com as escolas | Governo Federal, em parceria com as plataformas |
| **Ação** | incluir a educação midiática e digital no currículo | fortalecer a moderação e criar canais de denúncia e de direito de resposta |
| **Meio** | palestras, oficinas e debates com especialistas | equipes de moderação e campanhas educativas |
| **Finalidade** | formar jovens críticos e empáticos | reduzir o cyberbullying e garantir o contraditório |
| **Detalhamento** | os debates simulam casos reais de cancelamento | os canais respondem em prazo definido, com retratação pública |

## Frases de tese
- "Em um cenário em que a internet amplifica vozes, o cancelamento surge como ferramenta de cobrança; contudo, sua prática sem critérios…"
- "A cultura do cancelamento, longe de promover justiça, reproduz a lógica do linchamento…"`,
  ),
  resumo(
    PT,
    S,
    'pb4-red-modelos',
    'Produção de Texto PB4 · Três modelos de redação comentados',
    'Um texto positivo, um negativo e um equilibrado, com 4 parágrafos cada',
    `> Os textos abaixo são **modelos de estudo**: use a **estrutura** e as **ideias**, mas escreva o **seu** texto, com suas palavras.

## Modelo A · Posicionamento positivo
**Título: Quando a voz coletiva cobra justiça**

Nos anos 2010, a expressão "cultura do cancelamento" ganhou espaço no debate público. Nesse contexto, a Constituição Federal garante a liberdade de expressão, direito que as redes sociais ampliaram. Dessa forma, o cancelamento surge como instrumento legítimo de cobrança, pois dá voz a quem foi silenciado e responsabiliza quem tem poder.

Em primeiro plano, as redes sociais permitem que vítimas de abusos sejam ouvidas. Segundo a filósofa Djamila Ribeiro, o "lugar de fala" mostra que grupos historicamente silenciados têm o que dizer sobre as violências que sofrem. Nesse sentido, a mobilização online rompe o silêncio e leva casos ignorados ao conhecimento público.

Ademais, a pressão social obriga empresas e figuras públicas a rever atitudes. Quando uma marca perde clientes por um ato discriminatório, ela é levada a mudar suas práticas, o que mostra que a cobrança coletiva pode gerar transformação concreta. Assim, o cancelamento funciona como forma de fiscalização cidadã.

Portanto, o cancelamento pode ser um mecanismo de justiça social. Para que isso ocorra com responsabilidade, as plataformas digitais, em parceria com o Governo Federal, devem criar canais de denúncia e de direito de resposta, por meio de equipes de moderação, a fim de garantir que a cobrança seja proporcional e respeite a honra de todos.

## Modelo B · Posicionamento negativo
**Título: O tribunal sem juiz**

Em "Vigiar e Punir", Michel Foucault mostra que a punição pública sempre foi uma forma de controle social. Nesse sentido, a prática atual do cancelamento nas redes sociais reproduz esse espetáculo, sem direito de defesa. Dessa forma, o cancelamento tornou-se um linchamento virtual, que pune de modo desproporcional e fere a dignidade humana.

Em primeiro lugar, a ausência de contraditório faz da internet um tribunal sem juiz. Segundo o filósofo Byung-Chul Han, a indignação digital age como um "enxame": rápida, coletiva e incapaz de dialogar. Desse modo, uma pessoa pode ser condenada por um trecho tirado do contexto, sem espaço para esclarecer ou se retratar.

Além disso, esse linchamento causa danos graves à saúde mental. A Lei nº 14.811/2024 passou a tipificar a intimidação sistemática virtual, o que reconhece o sofrimento que os ataques coletivos provocam. Assim, a "punição" ultrapassa o ambiente digital e atinge a vida real, com ansiedade, isolamento e perda de oportunidades.

Em suma, é urgente combater a violência disfarçada de justiça. Para isso, o Ministério da Educação, em parceria com as escolas, deve incluir a educação midiática no currículo, por meio de debates e oficinas com casos reais, a fim de formar jovens críticos e empáticos no ambiente digital.

## Modelo C · Posicionamento equilibrado
**Título: Entre a cobrança e o linchamento**

Para Aristóteles, a virtude está no meio-termo entre o excesso e a falta. Nesse contexto, o cancelamento nas redes sociais ora se aproxima da cobrança necessária, ora do excesso do linchamento. Assim, a prática pode ser positiva ou negativa, a depender da proporção e do espaço para a retratação.

Por um lado, o cancelamento pode expor injustiças reais. Quando denúncias de abuso ou de discriminação viralizam, a pressão social leva instituições a agir. Isso mostra que a mobilização coletiva, quando baseada em fatos, é uma ferramenta legítima de cidadania.

Por outro lado, a lógica do descarte, que Zygmunt Bauman associa à "modernidade líquida", leva à exclusão imediata de pessoas, sem diálogo nem aprendizado. O caso da executiva de comunicação Justine Sacco, demitida após uma publicação que viralizou em 2013, ilustra como a punição pode ser desproporcional ao erro cometido.

Logo, é preciso equilibrar a responsabilização e a empatia. Cabe, portanto, às escolas, por meio de projetos de letramento digital, ensinar os jovens a distinguir crítica de agressão, com debates que simulem casos reais, a fim de que a cobrança seja proporcional e preserve o direito de se explicar.

## Como os modelos pontuam
- **C1:** norma-padrão, sem oralidade.
- **C2:** repertórios pertinentes e **explicados** no argumento.
- **C3:** uma ideia por parágrafo, com tese retomada.
- **C4:** conectivos variados entre parágrafos e frases.
- **C5:** agente + ação + meio + finalidade + detalhamento, ligados ao debate.`,
  ),
  resumo(
    PT,
    S,
    'pb4-red-checklist',
    'Produção de Texto PB4 · Checklist e erros comuns',
    'Revise seu texto em 2 minutos antes de entregar',
    `## Antes de escrever (3 minutos)
1. **Tema:** reescreva o tema com suas palavras. *Estou falando disso?*
2. **Tese:** uma frase com o seu posicionamento.
3. **Dois argumentos** e **dois repertórios**.
4. **Proposta** com agente, ação, meio, finalidade e detalhamento.

## Revisão final (checklist)
**Estrutura**
☐ 4 parágrafos (introdução, DI, DII, conclusão)
☐ Tese clara na introdução
☐ Cada desenvolvimento defende **uma** ideia
☐ Conclusão retoma a tese **sem copiar**

**Conteúdo**
☐ Repertório **verdadeiro**, pertinente e **explicado**
☐ Argumentos com causa e consequência
☐ Proposta com os **5 elementos**
☐ Respeito aos **direitos humanos**

**Língua**
☐ Sem oralidade ("a gente", "tipo", "né") e sem abreviações
☐ Pontuação, crase, concordância e acentos conferidos
☐ Conectivos **variados** e adequados
☐ Sem repetir a mesma palavra várias vezes

## Erros que mais custam pontos
| Erro | Como corrigir |
|---|---|
| **Fuga ao tema** (falar de redes sociais em geral) | volte sempre ao **cancelamento** |
| **Cópia dos textos motivadores** | use-os só como inspiração e escreva com suas palavras |
| **Proposta vaga** ("conscientizar a população") | diga **quem**, **o que**, **como**, **para quê** e **detalhe** |
| **Generalização** ("todos", "ninguém", "sempre") | troque por "muitos", "grande parte", "em geral" |
| **Primeira pessoa** ("eu acho") | prefira "é possível perceber", "nota-se" |
| **Repertório "colado"** | explique **como** ele prova o argumento |
| **Conclusão que traz argumento novo** | conclua com retomada + proposta |

## Frases que salvam
- **Tese:** "Diante disso, é inegável que…"
- **Transição:** "Soma-se a isso…", "Não se pode ignorar que…"
- **Proposta:** "Cabe, portanto, a [agente] [ação], por meio de [meio], a fim de [finalidade]."`,
  ),
];
