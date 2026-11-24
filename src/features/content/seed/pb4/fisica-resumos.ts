import { resumo, type ResumoG3 } from '../grande3/types';

/**
 * PB4 · Física (9º ano, Prof.ª "Dé"): Magnetismo e Eletromagnetismo (Apostila 3, módulos 11 e 12) e Astronomia
 * (Apostila 4, módulos 15 e 16). A prova é só teoria, sem cálculos. Dois resumos só, divididos por parte.
 * O resumo do Pedro de Física entra aqui como `pb4-fis-pedro` quando o arquivo estiver disponível.
 */
const S = '9º ano' as const;
const FI = 'fisica';

export const RESUMOS_FISICA_PB4: ResumoG3[] = [
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
