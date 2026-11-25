import { resumo, type ResumoG3 } from '../grande3/types';

/**
 * PB4 · Física (9º ano, Prof.ª "Dé"): Magnetismo e Eletromagnetismo (Apostila 3, módulos 11 e 12) e Astronomia
 * (Apostila 4, módulos 15 e 16). A prova é só teoria, sem cálculos. Dois resumos só, divididos por parte.
 * O primeiro resumo é o do Pedro (`pb4-fis-pedro`), e os outros dois são divididos por parte.
 */
const S = '9º ano' as const;
const FI = 'fisica';

export const RESUMOS_FISICA_PB4: ResumoG3[] = [
  resumo(
    FI,
    S,
    'pb4-fis-pedro',
    'Resumo do Pedro · Magnetismo, eletromagnetismo e astronomia',
    'Quadros de comparação, tecnologias pela descrição e o checklist de pegadinhas da professora',
    `## 1. Magnetismo (AP3, M11)
**Ímãs, polos e linhas de indução**
- Todo ímã tem dois polos: Norte (N) e Sul (S). **Polos iguais repelem; polos diferentes atraem.**
- Ao quebrar um ímã, cada pedaço vira um novo ímã N-S: **não se obtém um polo isolado**.
- As linhas de campo fora do ímã **saem de N e entram em S**; indicam direção e sentido do campo. Quanto mais próximas, mais intenso o campo.

**Atração, repulsão e bússolas**
- **Atração:** N de um ímã diante do S de outro; as linhas se conectam. **Repulsão:** N-N ou S-S; as linhas se afastam da região entre os ímãs.
- A ponta da agulha da bússola é seu polo norte; a agulha se alinha ao campo local e é **reta e tangente** à linha de campo (não se curva).

> **Pegadinha:** norte geográfico da Terra ≈ sul magnético terrestre; sul geográfico ≈ norte magnético. O polo N da bússola é atraído pelo sul magnético próximo ao norte geográfico.

**Campo da Terra e auroras**
- O campo magnético terrestre ajuda a orientar a bússola e desvia/canaliza partículas carregadas vindas do espaço.
- **Aurora boreal:** região polar do Hemisfério Norte. **Aurora austral:** região polar do Hemisfério Sul. Partículas energéticas interagem com gases da atmosfera, produzindo luz.
- Padrão da lista: separar ímãs, trem Maglev, interpretar três bússolas e identificar o hemisfério da aurora.

## 2. Eletromagnetismo (AP3, M12)
**Duas relações que NÃO podem ser confundidas**
| Corrente → campo | Variação de fluxo magnético → tensão |
|---|---|
| Corrente elétrica produz campo magnético em torno do condutor | **Indução eletromagnética (Faraday):** a mudança do fluxo magnético através do circuito gera tensão e pode produzir corrente se houver caminho fechado |
| Ex.: eletroímã, campainha, motor elétrico | Ex.: dínamo, gerador, carregador sem fio, fogão por indução |

> **Regra decisiva:** ímã e bobina parados entre si, sem outra mudança do fluxo, **não induzem corrente**. Aproximar ou afastar um ímã (ou girar a bobina) muda o fluxo e pode gerar corrente.

**Tecnologias: reconheça pela descrição**
| Dispositivo | Como funciona / transformação |
|---|---|
| Eletroímã / campainha | Corrente na bobina → campo magnético → atração de peça metálica; a campainha aciona o mecanismo |
| Alto-falante | Corrente variável na bobina interage com campo magnético → vibração do cone → som |
| Motor elétrico | Corrente em condutor dentro de campo magnético → força/torque → movimento (elétrica → mecânica) |
| Gerador / dínamo | Movimento relativo entre bobina e campo → variação do fluxo → tensão/corrente (mecânica → elétrica) |
| Carregamento sem fio | Corrente alternada na base → campo variável → tensão induzida na bobina receptora |
| Fogão de indução | Campo magnético variável induz correntes no recipiente adequado, que se aquece |

**Hidrelétrica e aplicações**
- Água represada escoa → gira a turbina → gira o conjunto do gerador (ímã/bobinas em movimento relativo) → variação do fluxo magnético → produção de energia elétrica.
- A mesma lógica de indução aparece em geradores eólicos e termelétricos; muda a fonte que faz a turbina girar.
- Questão da lista: **dínamo de bicicleta**: sem rotação, não há a variação necessária do fluxo e a lâmpada não acende; somente ter um ímã presente não basta.
- Outra aplicação: **magnetohipertermia** usa campo alternado para provocar aquecimento em nanopartículas magnéticas.

## 3. O nascimento da Astronomia (AP4, M15)
**Por que a Astronomia importa?** Permitiu construir calendários, organizar a agricultura, orientar viagens e navegação, marcar estações e desenvolver instrumentos e tecnologias. **Etnoastronomia:** estuda como diferentes povos e etnias observam, interpretam e usam o céu; esses conhecimentos fazem parte de suas culturas.

**Modelos do Universo: compare**
| Geocentrismo | Heliocentrismo |
|---|---|
| Terra no centro; modelo associado a **Aristóteles** e sistematizado por **Ptolomeu** | **Sol** no centro do Sistema Solar; proposta moderna de **Copérnico**, aprimorada por observações e leis |
| Explicava movimentos aparentes a partir da Terra, com mecanismos como **epiciclos** | **Galileu:** observações telescópicas (fases de Vênus e luas de Júpiter). **Kepler:** órbitas elípticas |

Atenção: heliocentrismo diz respeito ao **Sistema Solar**, não ao Sol como centro de todo o Universo.

**Evidências da forma aproximadamente esférica da Terra**
- **Eclipses lunares:** a sombra da Terra projetada na Lua é arredondada.
- **Constelações:** ao mudar de latitude, mudam as estrelas observáveis e sua posição no céu.
- **Navios e horizonte:** objetos distantes somem gradualmente de baixo para cima.
- **Eratóstenes:** comparou sombras solares em localidades diferentes para estimar a circunferência terrestre.

**Constelações e hemisférios**
- **Cruzeiro do Sul:** referência característica do céu austral; não é visível das latitudes mais altas do Hemisfério Norte.
- **Ursa Menor / Estrela Polar:** referências do céu do Hemisfério Norte; a visibilidade muda com a latitude.

> **Conexão com a lista:** um viajante no extremo norte NÃO deve usar o Cruzeiro do Sul como referência; a lista o apresenta como alternativa incorreta na questão de auroras.

## 4. Sistema Solar (AP4, M16)
- **Hierarquia:** Universo → galáxias → Via Láctea → Sistema Solar → Sol, planetas e outros corpos. O Sistema Solar formou-se há cerca de **4,6 bilhões de anos** de uma nuvem de gás e poeira.
- **Corpos luminosos** emitem luz própria (estrelas, como o Sol). **Iluminados** refletem luz (planetas, luas, asteroides).

**Planetas na ordem a partir do Sol**
| Planeta | Característica distintiva |
|---|---|
| Mercúrio | Menor planeta, rochoso, mais próximo do Sol |
| Vênus | Atmosfera muito densa; efeito estufa intenso; superfície muito quente |
| Terra | Água líquida abundante à superfície e vida conhecida |
| Marte | Planeta rochoso avermelhado; atmosfera rarefeita |
| Júpiter | Maior planeta; gigante gasoso e Grande Mancha Vermelha |
| Saturno | Gigante gasoso, com anéis muito evidentes |
| Urano | Gigante gelado; eixo de rotação muito inclinado |
| Netuno | Gigante gelado, mais distante do Sol entre os oito planetas |

**Memorize:** Mercúrio → Vênus → Terra → Marte → Júpiter → Saturno → Urano → Netuno. Quatro rochosos internos; quatro gigantes externos.

**Astros: não confunda as definições**
| Termo | O que é |
|---|---|
| Estrela | Corpo que produz luz própria por processos físicos em seu interior (ex.: Sol) |
| Planeta | Orbita uma estrela, tem forma aproximadamente esférica e domina a vizinhança de sua órbita |
| Planeta anão | Orbita o Sol, é aproximadamente esférico, mas não limpou sua vizinhança orbital (ex.: Plutão) |
| Satélite natural | Corpo que orbita um planeta ou outro corpo maior (ex.: Lua) |
| Cometa | Corpo rico em gelo e poeira; próximo ao Sol pode formar coma e cauda |
| Asteroide | Corpo predominantemente rochoso/metálico que orbita o Sol |
| Meteoroide | Pequeno corpo natural no espaço |
| Meteoro | Fenômeno luminoso ao atravessar a atmosfera: a "estrela cadente" |
| Meteorito | Fragmento de um corpo espacial que atinge o solo |

## Checklist de pegadinhas da professora
- ☐ Polaridades N/S e repulsão; ☐ agulha da bússola tangente; ☐ norte geográfico ≈ sul magnético.
- ☐ Corrente produz campo ≠ indução por fluxo variável; ☐ gerador ≠ motor; ☐ ímã parado não basta.
- ☐ Boreal x austral; ☐ geocentrismo x heliocentrismo; ☐ planetas x anões; ☐ meteoroide x meteoro x meteorito.

*Resumo escrito por Pedro, a partir do roteiro de Física e da lista de nove exercícios de magnetismo e eletromagnetismo.*`,
  ),
  resumo(
    FI,
    S,
    'pb4-fis-magnetismo',
    'Física PB4 · Magnetismo e eletromagnetismo (módulos 11 e 12)',
    'Ímãs, bússola, campo da Terra, auroras, eletroímã, motor, indução e geradores',
    `## O que a professora cobra
A prova é **só teoria, sem cálculos**. Você precisa **reconhecer o princípio nos exercícios**: ele cai com certeza.

## Módulo 11: Magnetismo
### Ímãs e campo magnético
- Todo ímã tem **dois polos**, norte (N) e sul (S). Eles são **inseparáveis**: se você quebra o ímã, **cada pedaço vira um ímã novo com N e S**.
- **Polos iguais se repelem; polos opostos se atraem.**
- O **campo magnético** é representado por **linhas de campo**: **saem do polo norte e entram no polo sul** (por fora do ímã). Onde as linhas ficam mais juntas, o campo é **mais intenso** (nos polos).
- **Entre dois ímãs:** na **atração**, as linhas saem do N de um e vão para o S do outro. Na **repulsão**, as linhas se afastam e **não se ligam** (curvam e voltam cada uma para o seu ímã).
- A **limalha de ferro** do laboratório se alinha com o campo e mostra a forma das linhas.

### Bússola
- A bússola é um **ímã pequeno** (a agulha). A **ponta** da agulha é o **polo norte** da bússola.
- A agulha se alinha **tangente à linha de campo**, com a ponta no sentido do campo. Cuidado: a agulha é **reta** e não faz curva; a ponta fica sobre a linha e o resto fica tangente a ela.
- **Polo norte da agulha é atraído pelo polo sul magnético da Terra, que fica perto do polo norte geográfico.**

### O campo magnético da Terra
- A Terra funciona como um **ímã gigante**. O **polo norte geográfico coincide com o polo sul magnético** (e vice-versa).
- Por isso a agulha (ponta norte) aponta para o **norte geográfico**.

### Aurora boreal e aurora austral
- São **fenômenos luminosos** que acontecem **só perto dos polos**.
- As **partículas vindas do espaço** (vento solar) são **guiadas pelas linhas de campo** da Terra até os polos, onde o campo é mais intenso. Elas **colidem com os gases da atmosfera** e emitem **luz colorida**.
- **Aurora boreal:** perto do **polo Norte**. **Aurora austral:** perto do **polo Sul**.

## Módulo 12: Eletromagnetismo
### Ideia central: corrente e campo se geram
| Se há... | Acontece... | Exemplos |
|---|---|---|
| **Corrente elétrica** | Gera **campo magnético** | **Eletroímãs**, **motores elétricos** |
| **Variação de campo magnético** (movimento do ímã perto de uma bobina) | **Induz corrente elétrica** (Princípio da Indução, de **Faraday**) | **Geradores, dínamo, usina hidrelétrica** |

### Eletroímã (experimento do prego)
- **Fio enrolado em um prego** (bobina com núcleo de ferro) ligado a uma pilha: o prego vira um **ímã**.
- Quando a corrente é desligada, o campo **some**. Quanto **mais espiras** e **mais corrente**, mais forte.
- Usos: **campainha**, guindaste de ferro-velho, alto-falante, trens Maglev.

### Motor elétrico (experimento da bobina)
- Uma **corrente numa bobina colocada entre ímãs** cria um campo que **interage com o do ímã** e gera **força**, e a bobina **gira**.
- É a transformação de **energia elétrica em movimento**. Está em ventiladores, carros elétricos e eletrodomésticos. O primeiro foi feito por **Faraday, em 1821**.

### Indução eletromagnética (Faraday)
- **Variação do campo magnético** (aproximar ou afastar um ímã de uma bobina) **induz corrente elétrica** num circuito fechado.
- **Ímã parado perto do fio = sem variação = sem corrente.** (Pegadinha clássica.)
- **Dínamo da bicicleta:** só acende a lâmpada com a roda girando, porque o movimento faz o ímã variar o campo na bobina.
- **Usina hidrelétrica:** a água move a **turbina**, que gira ímãs perto de **bobinas**, e a variação do campo gera a **corrente**. Mesmo princípio nas usinas eólica e termelétrica.

### Tecnologias: qual é o princípio?
| Tecnologia | Como funciona |
|---|---|
| **Campainha** | Eletroímã: corrente cria campo que puxa uma peça |
| **Alto-falante** | Corrente que varia numa bobina junto de um ímã move um cone e produz som |
| **Motor elétrico** | Corrente + campo do ímã geram força e movimento |
| **Gerador / dínamo / hidrelétrica** | Movimento relativo ímã-bobina induz corrente |
| **Fogão de indução** e **carregador sem fio** | Campo magnético variável induz corrente (que esquenta a panela ou carrega a bateria) |
| **Magnetohipertermia** | Campo magnético alternado agita nanopartículas, que **esquentam e matam as células do tumor** |

## Truque de prova
Descreveu o funcionamento? Pergunte: a **corrente está virando campo** (eletroímã, motor) ou o **campo variável está virando corrente** (gerador, dínamo, indução)?`,
  ),
  resumo(
    FI,
    S,
    'pb4-fis-astronomia',
    'Física PB4 · Astronomia (módulos 15 e 16)',
    'Importância da astronomia, geocentrismo e heliocentrismo, origem do Universo e astros do Sistema Solar',
    `## Módulo 15: O nascimento da Astronomia
### Importância da astronomia
- Criou **calendários** e marcou as **estações** (plantio e colheita), ajudou na **navegação** e na **orientação**, e impulsionou a **ciência e a tecnologia**.
- **Etnoastronomia:** estuda como **povos e culturas** interpretam o céu. Exemplo: os **Tupi-Guarani** veem o **Homem Velho (Tuya'i)**, formado por Touro e Órion, com as Plêiades como penacho e o **Cinturão de Órion (Três Marias)** como o joelho. Para os povos do sul do Brasil, o surgimento dele indica a chegada do **verão**; no norte, da **estação chuvosa**.
- Há **constelações visíveis só em um hemisfério**: o **Cruzeiro do Sul** só no hemisfério **Sul**.

### Evidências da esfericidade da Terra
- A **sombra da Terra na Lua** (eclipse lunar) é **sempre circular**.
- **Navios** somem no horizonte começando pelo casco.
- As **constelações mudam** conforme a latitude do observador.
- **Eratóstenes** estimou a circunferência da Terra pela diferença das sombras; a **circunavegação** (Magalhães e Elcano) e as **fotos de satélite** confirmam.

### Geocentrismo x heliocentrismo
| | **Geocêntrico** | **Heliocêntrico** |
|---|---|---|
| **Astro central** | **Terra** (imóvel) | **Sol** |
| **Quem** | **Aristóteles** e **Cláudio Ptolomeu** (séc. II) | **Copérnico** (1543); **Galileu**, **Kepler** e **Newton** reforçaram |
| **Órbitas** | **Circulares** (com epiciclos) | Circulares em Copérnico; **elípticas** em **Kepler** |
| **Contribuições** | Explicava o movimento aparente dos astros | **Galileu**: luas de Júpiter e fases de Vênus (telescópio); **Kepler**: leis das órbitas; **Newton**: gravitação |

### Origem do Universo
- **Big Bang:** o Universo surgiu há cerca de **13,8 bilhões de anos**, de um estado **muito quente e denso**, e está em **expansão** (evidências: afastamento das galáxias e radiação cósmica de fundo).
- Outras ideias: a teoria do **Estado Estacionário** (superada) e **mitos de diversos povos**.

## Módulo 16: O Sistema Solar
### Via Láctea e Sistema Solar
- A **Via Láctea** é **uma das trilhões de galáxias** do Universo; o **Sistema Solar** é **um dos bilhões** de sistemas da nossa galáxia.
- **Origem do Sistema Solar:** uma **nuvem de gás e poeira** colapsou há cerca de **4,6 bilhões de anos**, formando o **Sol** e, no disco ao redor, os planetas.

### Luminosos e iluminados
- **Corpo luminoso** tem **luz própria**: as **estrelas** (como o **Sol**).
- **Corpo iluminado** só **reflete** luz: planetas, luas, cometas.
- **Estrela x planeta:** a estrela tem luz própria (fusão nuclear), é muito mais distante e **cintila**; o planeta reflete a luz do Sol, **brilha fixo** e **se move entre as estrelas** (por isso "errante"). **Vênus**, a "Estrela D'alva", é um **planeta**.

### Planetas
| Planeta | Característica |
|---|---|
| **Mercúrio** | Menor e mais próximo do Sol; sem atmosfera relevante; sem luas |
| **Vênus** | Atmosfera de CO₂, **efeito estufa** forte, o mais quente; gira ao contrário |
| **Terra** | Água líquida, **uma lua**, vida |
| **Marte** | "Planeta vermelho" (óxido de ferro); **Monte Olimpo** (25 km, maior vulcão do Sistema Solar); luas **Fobos e Deimos**; atmosfera de CO₂ |
| **Júpiter** | **Maior** planeta; **Grande Mancha Vermelha**; dezenas de luas |
| **Saturno** | **Anéis**; densidade menor que a da água |
| **Urano** | Gira "deitado", com o eixo muito inclinado; azul-esverdeado |
| **Netuno** | O **mais distante**; ventos muito fortes; azul |

- **Rochosos (terrestres):** Mercúrio, Vênus, Terra e Marte. **Gigantes gasosos:** Júpiter e Saturno. **Gigantes gelados:** Urano e Netuno.

### Os astros por definição
| Astro | O que é |
|---|---|
| **Estrela** | Esfera de gás com **luz própria** (fusão de hidrogênio). Ex.: Sol (anã amarela); Betelgeuse (supergigante vermelha) |
| **Planeta** | Orbita o Sol, é esférico e **limpou sua órbita** |
| **Planeta anão** | Orbita o Sol, é esférico, mas **não limpou a órbita**. Ex.: **Plutão**, Ceres, Éris |
| **Satélite natural (lua)** | Orbita um planeta |
| **Cometa** | **Núcleo de gelo, rochas e compostos orgânicos**; ao se aproximar do Sol forma uma **cauda luminosa**. Ex.: **Halley** (76 anos, visto em 1986, volta em 2061) |
| **Asteroide** | Corpo **rochoso**, em geral no **cinturão entre Marte e Júpiter** |
| **Meteoroide** | Fragmento rochoso no **espaço** |
| **Meteoro** | O **rastro luminoso** quando o fragmento entra na atmosfera |
| **Meteorito** | O fragmento que **chega ao solo** |

> **Erro científico:** a expressão **"estrela cadente"** está errada. É um **meteoro**, e não uma estrela.`,
  ),
];
