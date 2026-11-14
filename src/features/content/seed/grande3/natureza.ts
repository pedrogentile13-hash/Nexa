import { resumo, type ResumoG3 } from './types';

/** Resumos de Ciências, Biologia, Física e Química. */
export const RESUMOS_NATUREZA: ResumoG3[] = [
  // ------------------------------------------------------------ Ciências
  resumo(
    'ciencias',
    '6º ano',
    'cie6-celula-terra',
    'Célula, rochas e movimentos da Terra',
    'Do menor ser vivo ao planeta inteiro',
    `
## Célula
É a unidade dos seres vivos. Pode haver organismos **unicelulares** (bactérias) e **pluricelulares** (plantas e animais). Só se enxergam com microscópio.

## Rochas
- **Magmáticas:** do resfriamento do magma (granito, basalto).
- **Sedimentares:** acúmulo e compactação de sedimentos (arenito); guardam fósseis.
- **Metamórficas:** transformadas por calor e pressão (mármore, do calcário).

## Movimentos da Terra
- **Rotação:** em torno do próprio eixo, ~24 h, gera dia e noite.
- **Translação:** em torno do Sol, ~365 dias; com a inclinação do eixo, gera as **estações**.`,
  ),
  resumo(
    'ciencias',
    '7º ano',
    'cie7-ecossistemas',
    'Ecossistemas e cadeias alimentares',
    'Quem come quem e como a energia flui',
    `
## Níveis tróficos
- **Produtores:** fazem fotossíntese (plantas, algas).
- **Consumidores:** primários (herbívoros), secundários e terciários (carnívoros).
- **Decompositores:** fungos e bactérias; devolvem nutrientes ao solo.

## Fluxo de energia
A energia **diminui** a cada nível (parte vira calor), por isso as cadeias são curtas. A matéria circula; a energia só flui.

## Relações ecológicas
Mutualismo (abelha e flor), parasitismo (lombriga), predação, competição.

## Biomas do Brasil
Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa e Pantanal.`,
  ),
  resumo(
    'ciencias',
    '7º ano',
    'cie7-saude-vacinas',
    'Saúde, doenças e vacinas',
    'Como o corpo se defende e como evitar doenças',
    `
## Agentes causadores
Vírus, bactérias, protozoários, fungos e vermes.

## Prevenção
- **Vacinas:** treinam o sistema imunológico sem causar a doença.
- **Saneamento básico:** água tratada e esgoto evitam doenças como cólera e esquistossomose.
- **Combate ao mosquito Aedes aegypti** (dengue, zika, chikungunya): eliminar água parada.

## Imunidade coletiva
Quando muita gente está vacinada, a circulação do agente cai e protege até quem não pode se vacinar.

## Erro comum
Antibiótico age contra **bactérias**, não contra vírus.`,
  ),
  resumo(
    'ciencias',
    '8º ano',
    'cie8-corpo-humano',
    'Sistemas do corpo humano',
    'Digestório, respiratório, circulatório e excretor',
    `
## Digestório
Boca (mastigação, amilase), estômago (proteínas), **intestino delgado** (digestão final e absorção), intestino grosso (água e formação das fezes).

## Respiratório
O ar chega aos **alvéolos**, onde ocorrem as trocas gasosas (entra O₂, sai CO₂).

## Circulatório
O **coração** bombeia o sangue. As **hemácias** transportam oxigênio; os glóbulos brancos defendem; as plaquetas coagulam.

## Excretor
Os **rins** filtram o sangue e produzem a urina.

## Endócrino
Hormônios, como a **insulina** (pâncreas), regulam funções do corpo.`,
  ),
  resumo(
    'ciencias',
    '8º ano',
    'cie8-reproducao-adolescencia',
    'Reprodução humana e adolescência',
    'Puberdade, fecundação e prevenção',
    `
## Puberdade
Hormônios (testosterona e estrogênio) provocam as mudanças do corpo. Cada pessoa tem seu ritmo.

## Fecundação
União do espermatozoide com o óvulo, formando o **zigoto**, que se desenvolve em embrião.

## Prevenção
- **Camisinha:** previne gravidez e ISTs.
- Outros métodos evitam só a gravidez.
- Procure serviços de saúde e converse com adultos de confiança.

## Respeito
Consentimento, respeito e acolhimento da diversidade fazem parte da saúde.`,
  ),
  resumo(
    'ciencias',
    '9º ano',
    'cie9-hereditariedade-evolucao',
    'Hereditariedade e evolução',
    'Genes, Mendel e seleção natural',
    `
## Hereditariedade
Os **genes** ficam no DNA, nos cromossomos. Humanos têm **46** cromossomos nas células do corpo; os gametas têm 23.

## Mendel
Cruzou ervilhas e mostrou que as características passam por fatores **dominantes** e **recessivos**. Aa × Aa dá 1/4 AA, 1/2 Aa, 1/4 aa.

## Evolução
**Darwin e Wallace:** os indivíduos variam; os mais adaptados ao ambiente sobrevivem e se reproduzem mais. Ao longo das gerações, a característica vantajosa se torna mais comum.

## Evidências
Fósseis, anatomia comparada e semelhanças de DNA.`,
  ),
  resumo(
    'ciencias',
    '9º ano',
    'cie9-universo-energia',
    'Sistema Solar, universo e energia elétrica',
    'Planetas, ano-luz e consumo em casa',
    `
## Sistema Solar
Planetas em ordem: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno. Júpiter é o maior.

## Distâncias
**Ano-luz** é medida de **distância** (o que a luz percorre em um ano).

## Eletricidade em casa
Potência (W) × tempo (h) = energia. Um chuveiro de 5.000 W por 0,5 h gasta 2,5 kWh. Para economizar: banho mais curto e aparelhos eficientes.

## Fontes de energia
Renováveis (solar, eólica, hidráulica) e não renováveis (petróleo, carvão).`,
  ),

  // ------------------------------------------------------------ Biologia
  resumo(
    'biologia',
    '1ª série EM',
    'bio1-citologia',
    'Citologia: a célula',
    'Organelas, membrana e tipos celulares',
    `
## Tipos
- **Procarionte:** sem núcleo definido (bactérias).
- **Eucarionte:** com núcleo (animais, plantas, fungos, protozoários).

## Organelas e funções
- **Mitocôndria:** respiração celular (ATP).
- **Cloroplasto:** fotossíntese.
- **Ribossomo:** síntese de proteínas.
- **Lisossomo:** digestão intracelular.
- **Complexo golgiense:** empacota e secreta.

## Membrana plasmática
Bicamada de fosfolipídios com proteínas. **Difusão** e **osmose** não gastam energia; o **transporte ativo** gasta ATP.

## Diferença planta × animal
Plantas têm parede celular de celulose e cloroplastos.`,
  ),
  resumo(
    'biologia',
    '1ª série EM',
    'bio1-fotossintese-respiracao',
    'Fotossíntese e respiração celular',
    'Como a célula produz energia',
    `
## Fotossíntese
CO₂ + H₂O + luz → glicose + O₂. Ocorre nos **cloroplastos**.

## Respiração aeróbia
Glicose + O₂ → CO₂ + H₂O + **ATP**. Ocorre nas **mitocôndrias**.

## Relação
Os produtos de um processo são os reagentes do outro.

## Fermentação
Sem oxigênio, as leveduras produzem **etanol** e CO₂; músculos produzem **ácido lático**.`,
  ),
  resumo(
    'biologia',
    '1ª série EM',
    'bio1-ecologia',
    'Ecologia, ciclos e problemas ambientais',
    'Cadeias, ciclos da matéria e impactos humanos',
    `
## Conceitos
População (mesma espécie), comunidade (várias populações), ecossistema (comunidade + ambiente).

## Ciclos
**Carbono, nitrogênio e água** circulam entre seres vivos e ambiente. Bactérias fixam o N₂ do ar.

## Problemas ambientais
- **Efeito estufa intensificado:** CO₂ e metano.
- **Eutrofização:** excesso de nutrientes, algas, queda do oxigênio, morte de peixes.
- **Bioacumulação:** poluentes (mercúrio) se concentram no topo da cadeia.
- **Desmatamento:** perda de biodiversidade e de umidade (rios voadores).`,
  ),
  resumo(
    'biologia',
    '2ª série EM',
    'bio2-genetica',
    'Genética mendeliana e sangue',
    'Cruzamentos, heredogramas e sistema ABO',
    `
## Primeira lei de Mendel
Cada característica é determinada por um par de alelos que se separam na formação dos gametas.

## Cruzamentos
- Aa × Aa: 25% AA, 50% Aa, 25% aa (3:1 em fenótipo).
- Aa × aa: 50% Aa, 50% aa.

## Sistema ABO
Alelos IA, IB e i. IA e IB são **codominantes**; i é recessivo. Tipo O = ii. Tipo AB = IAIB.

## Herança ligada ao X
Daltonismo e hemofilia são mais comuns em homens, pois têm um só cromossomo X.`,
  ),
  resumo(
    'biologia',
    '2ª série EM',
    'bio2-dna-biotecnologia',
    'DNA, síntese de proteínas e biotecnologia',
    'Do gene à proteína e aplicações',
    `
## DNA e RNA
- **DNA:** bases A, T, C e G (A pareia com T; C com G).
- **RNA:** no lugar de T, tem **U** (uracila).

## Do gene à proteína
**Transcrição:** DNA → RNA mensageiro (no núcleo). **Tradução:** RNA → proteína (nos ribossomos).

## Biotecnologia
- **Transgênicos:** recebem gene de outra espécie.
- **Clonagem:** cópia geneticamente idêntica (ovelha Dolly, 1996).
- **Teste de paternidade:** compara trechos do DNA.
- **Células-tronco:** podem originar vários tipos celulares.`,
  ),
  resumo(
    'biologia',
    '3ª série EM',
    'bio3-evolucao',
    'Evolução e especiação',
    'Darwin, teoria sintética e evidências',
    `
## Lamarck × Darwin
- **Lamarck:** uso e desuso, herança de caracteres adquiridos (superada).
- **Darwin:** **seleção natural** sobre variações herdáveis.

## Teoria sintética
Une a seleção natural à genética: a variabilidade vem de **mutação** e **recombinação**.

## Evidências
Fósseis, anatomia comparada (**homologia**: braço humano e asa de morcego; **analogia**: asa de inseto e de ave), embriologia e DNA.

## Especiação
Populações isoladas geograficamente acumulam diferenças até não se cruzarem mais (especiação **alopátrica**).`,
  ),
  resumo(
    'biologia',
    '3ª série EM',
    'bio3-fisiologia-humana',
    'Fisiologia humana',
    'Sistemas e como trabalham juntos',
    `
## Visão geral
- **Nervoso:** encéfalo, medula e nervos (comando e resposta rápida).
- **Endócrino:** hormônios (insulina regula a glicose).
- **Circulatório:** coração, vasos e sangue.
- **Respiratório:** trocas gasosas nos alvéolos.
- **Digestório:** quebra e absorção de nutrientes.
- **Excretor:** rins filtram o sangue.
- **Imunológico:** defesa (anticorpos).

## Saúde pública
Hipertensão e diabetes são doenças crônicas comuns; prevenção inclui alimentação, atividade física e acompanhamento médico.`,
  ),
  resumo(
    'biologia',
    '3ª série EM',
    'bio3-doencas-saude',
    'Doenças, vacinas e saúde pública',
    'Transmissão, prevenção e resistência a antibióticos',
    `
## Exemplos
- **Dengue:** vírus transmitido pelo *Aedes aegypti*.
- **Doença de Chagas:** protozoário transmitido pelo barbeiro.
- **Esquistossomose:** vermes ligados à água contaminada.
- **Tuberculose:** bactéria, transmissão pelo ar.

## Vacina × soro
- **Vacina:** estimula o corpo a produzir anticorpos (imunidade ativa).
- **Soro:** já traz anticorpos prontos (imunidade passiva), como o soro antiofídico.

## Resistência a antibióticos
O uso inadequado seleciona bactérias resistentes. Tome só com prescrição e **termine o tratamento**.`,
  ),

  // ------------------------------------------------------------ Física
  resumo(
    'fisica',
    '1ª série EM',
    'fis1-cinematica',
    'Cinemática: movimento uniforme e variado',
    'Velocidade, aceleração e as fórmulas essenciais',
    `
## MU (velocidade constante)
s = s₀ + v·t. Velocidade média = Δs ÷ Δt.

## MUV (aceleração constante)
- v = v₀ + a·t
- s = s₀ + v₀·t + a·t²/2
- v² = v₀² + 2·a·Δs

## Conversão
km/h ÷ 3,6 = m/s. 72 km/h = 20 m/s.

## Queda livre
Sem ar, a aceleração é g ≈ 10 m/s² para todos os corpos.

## Erro comum
Misturar unidades (km/h com segundos).`,
  ),
  resumo(
    'fisica',
    '1ª série EM',
    'fis1-leis-newton',
    'Leis de Newton',
    'Inércia, F = m·a e ação e reação',
    `
## 1ª Lei (inércia)
Um corpo mantém repouso ou movimento retilíneo uniforme se a força resultante for nula. O cinto de segurança protege por causa da inércia.

## 2ª Lei
**F = m·a.** Massa em kg, aceleração em m/s², força em N.

## 3ª Lei (ação e reação)
Forças de mesmo módulo e sentidos opostos, aplicadas em **corpos diferentes**. Remar: a água é empurrada para trás e o barco vai para a frente.

## Peso
P = m·g. Na Terra, 70 kg pesam ~700 N. **Massa** (kg) e **peso** (N) são diferentes.`,
  ),
  resumo(
    'fisica',
    '1ª série EM',
    'fis1-energia',
    'Trabalho, energia e potência',
    'Cinética, potencial e conservação',
    `
## Fórmulas
- **Trabalho:** τ = F · d (em joules).
- **Energia cinética:** Ec = m·v²/2.
- **Energia potencial gravitacional:** Ep = m·g·h.
- **Potência:** P = τ ÷ Δt (watts).

## Conservação
Sem atrito, Ep + Ec se mantém. Um corpo caindo de 20 m chega a 20 m/s (v = √(2·g·h)).

## Consumo
E (kWh) = P (kW) × t (h).`,
  ),
  resumo(
    'fisica',
    '2ª série EM',
    'fis2-termologia',
    'Termologia: temperatura e calor',
    'Escalas, calor sensível e propagação',
    `
## Escalas
K = C + 273. F = 1,8·C + 32.

## Calor sensível
Q = m · c · ΔT. A água tem c = 1 cal/g·°C (alto calor específico: demora a esquentar e a esfriar).

## Propagação
**Condução** (contato, metais), **convecção** (fluidos) e **irradiação** (única que atravessa o vácuo, como o calor do Sol).

## Erro comum
Achar que "frio" é uma energia: o que existe é transferência de **calor** do corpo mais quente para o mais frio.`,
  ),
  resumo(
    'fisica',
    '2ª série EM',
    'fis2-ondas-optica',
    'Ondas, som e óptica',
    'Frequência, velocidade, reflexão e refração',
    `
## Ondas
**v = λ · f.** Período T = 1/f. Ondas **mecânicas** (som) precisam de meio; **eletromagnéticas** (luz) se propagam no vácuo.

## Som
Velocidade ~340 m/s no ar. O trovão chega depois do relâmpago.

## Óptica
- **Reflexão:** no espelho plano, a imagem fica à mesma distância atrás do espelho.
- **Refração:** a luz muda de direção ao passar de um meio a outro.
- **Cores:** o objeto parece vermelho porque reflete o vermelho e absorve as outras.`,
  ),
  resumo(
    'fisica',
    '3ª série EM',
    'fis3-eletricidade',
    'Eletricidade: corrente, tensão e resistência',
    'Lei de Ohm e circuitos',
    `
## Grandezas
Tensão U (volts), corrente i (ampères), resistência R (ohms).

## Lei de Ohm
**U = R · i.**

## Potência elétrica
**P = U · i.** Um aparelho de 220 V que puxa 5 A tem 1.100 W.

## Associações de resistores
- **Série:** Req = R₁ + R₂ + ... (mesma corrente).
- **Paralelo:** 1/Req = 1/R₁ + 1/R₂ (mesma tensão). Dois iguais: Req = R/2.`,
  ),
  resumo(
    'fisica',
    '3ª série EM',
    'fis3-eletromagnetismo',
    'Eletrostática e magnetismo',
    'Cargas, campos e indução',
    `
## Eletrostática
Cargas de mesmo sinal se **repelem**; de sinais diferentes se **atraem**. Eletrizar por atrito, contato ou indução.

## Magnetismo
Todo ímã tem polos norte e sul; polos iguais se repelem. Uma corrente elétrica gera **campo magnético** (eletroímã).

## Indução eletromagnética
Variar o fluxo magnético em uma bobina gera **corrente elétrica**: princípio dos geradores e transformadores.

## Aplicações
Motores, alto-falantes, carregadores por indução.`,
  ),
  resumo(
    'fisica',
    '1ª série EM',
    'fis1-impulso-gravitacao',
    'Quantidade de movimento e gravitação',
    'Colisões e a atração entre massas',
    `
## Quantidade de movimento
Q = m · v. Num sistema isolado, a quantidade de movimento **se conserva** (colisões, explosões).

## Impulso
I = F · Δt = variação de Q. Por isso o air bag aumenta o tempo da colisão e reduz a força.

## Gravitação universal
A força entre duas massas cresce com as massas e diminui com o **quadrado** da distância. Mantém a Lua em órbita e gera as marés.`,
  ),

  // ------------------------------------------------------------ Química
  resumo(
    'quimica',
    '1ª série EM',
    'qui1-atomo-tabela',
    'Átomo, íons e tabela periódica',
    'Prótons, nêutrons, elétrons e famílias',
    `
## O átomo
- **Z** (número atômico) = prótons.
- **A** (massa) = prótons + nêutrons. **Nêutrons = A − Z.**
- No átomo neutro, elétrons = prótons.

## Íons
- **Cátion:** perde elétrons (Na⁺).
- **Ânion:** ganha elétrons (Cl⁻).

## Isótopos
Mesmo Z, A diferente (carbono-12 e carbono-14).

## Tabela periódica
Famílias com propriedades parecidas: metais alcalinos (1A), halogênios (7A), gases nobres (8A).`,
  ),
  resumo(
    'quimica',
    '1ª série EM',
    'qui1-ligacoes-funcoes',
    'Ligações químicas e funções inorgânicas',
    'Iônica, covalente, ácidos, bases e sais',
    `
## Ligações
- **Iônica:** metal + ametal, transferência de elétrons (NaCl).
- **Covalente:** compartilhamento entre ametais (H₂O, CO₂).
- **Metálica:** metais, elétrons livres.

## Funções
- **Ácidos:** liberam H⁺ em água (HCl, H₂SO₄).
- **Bases:** liberam OH⁻ (NaOH).
- **Sais:** ácido + base (NaCl).
- **Óxidos:** compostos de oxigênio e outro elemento (CO₂).

## Polaridade
A água é polar e dissolve substâncias polares; óleo é apolar.`,
  ),
  resumo(
    'quimica',
    '1ª série EM',
    'qui1-mol',
    'Mol e massa molar',
    'Contar átomos pela massa',
    `
## Ideia
1 mol = **6 × 10²³** partículas (constante de Avogadro).

## Massa molar
Soma das massas atômicas: H₂O = 2·1 + 16 = **18 g/mol**; CO₂ = 12 + 32 = **44 g/mol**.

## Fórmulas
- n = m ÷ M (mols = massa ÷ massa molar)
- m = n · M

## Gases
Nas CNTP, 1 mol ocupa ~22,4 L.

## Exemplo
90 g de água: n = 90 ÷ 18 = **5 mol**.`,
  ),
  resumo(
    'quimica',
    '2ª série EM',
    'qui2-solucoes',
    'Soluções e concentração',
    'g/L, mol/L e diluição',
    `
## Componentes
**Soluto** (o que dissolve) e **solvente** (onde dissolve).

## Concentração
- **Comum:** C = m ÷ V (g/L).
- **Molar:** M = n ÷ V (mol/L).

## Diluição
Acrescentar solvente **não muda a quantidade de soluto**: **C₁·V₁ = C₂·V₂**.

## Exemplo
100 mL de 4 mol/L diluídos a 400 mL ficam 1 mol/L.

## Erro comum
Esquecer de converter mL em L.`,
  ),
  resumo(
    'quimica',
    '2ª série EM',
    'qui2-ph-acidos-bases',
    'pH e equilíbrio ácido-base',
    'Escala de pH e neutralização',
    `
## Escala (25 °C)
- pH < 7: **ácido**; pH = 7: neutro; pH > 7: **básico**.
- pH = −log [H⁺]. Cada unidade de pH muda a concentração **10 vezes**.
- pH + pOH = 14.

## Neutralização
Ácido + base → sal + água.

## Exemplos
Suco de limão (pH ~2), água pura (7), água sanitária (~12).

## Dica
Chuva "normal" é levemente ácida (CO₂); a **chuva ácida** vem de óxidos de enxofre e nitrogênio.`,
  ),
  resumo(
    'quimica',
    '3ª série EM',
    'qui3-estequiometria',
    'Estequiometria',
    'Quanto reage e quanto se forma',
    `
## Passo a passo
1. **Balanceie** a equação.
2. Converta massa em **mol**.
3. Use a **proporção** dos coeficientes.
4. Converta de volta para massa ou volume.

## Exemplo
CH₄ + 2 O₂ → CO₂ + 2 H₂O. De 16 g de CH₄ (1 mol) saem 1 mol de CO₂ = **44 g**.

## Lei de Lavoisier
Em sistema fechado, a **massa se conserva**.

## Reagente limitante
É o que acaba primeiro e define quanto produto se forma.`,
  ),
  resumo(
    'quimica',
    '3ª série EM',
    'qui3-gases',
    'Estudo dos gases',
    'Boyle, Charles e a equação de estado',
    `
## Transformações (gás ideal)
- **Boyle** (T constante): P·V = constante.
- **Charles** (P constante): V/T = constante.
- **Gay-Lussac** (V constante): P/T = constante.

## Equação geral
P·V = n·R·T. A temperatura deve estar em **kelvin**.

## Exemplo
Comprimir um gás de 6 L a 1 atm até 2 atm (T constante) leva a **3 L**.`,
  ),
  resumo(
    'quimica',
    '3ª série EM',
    'qui3-organica',
    'Química orgânica: o essencial',
    'Hidrocarbonetos, funções e combustíveis',
    `
## Carbono
Faz 4 ligações e forma cadeias longas.

## Funções importantes
- **Hidrocarbonetos** (metano, propano, octano): combustíveis.
- **Álcoois** (etanol, -OH), **ácidos carboxílicos** (vinagre, -COOH), **ésteres** (aromas), **aminas**.

## Combustão
Combustível + O₂ → CO₂ + H₂O (+ energia). Etanol de cana é **renovável**; gasolina vem do petróleo.

## Isomeria
Mesma fórmula molecular, estruturas diferentes.`,
  ),
];
