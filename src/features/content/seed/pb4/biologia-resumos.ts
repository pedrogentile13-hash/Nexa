import { resumo, type ResumoG3 } from '../grande3/types';

/**
 * PB4 · Biologia (9º ano, Prof.ª Daiane Marin): Módulo 8 (Genes e a biotecnologia, AP3, pp. 383 a 390) e
 * Módulo 9 (Doenças genéticas e aconselhamento genético, AP4, pp. 345 a 350). PB em 26/11/2026.
 * Um resumo só: o do Pedro.
 */
const S = '9º ano' as const;
const BI = 'biologia';

export const RESUMOS_BIOLOGIA_PB4: ResumoG3[] = [
  resumo(
    BI,
    S,
    'pb4-bio-pedro',
    'Resumo do Pedro · Biologia: genética, biotecnologia e doenças genéticas',
    'AP3 M8 e AP4 M9: da herança dos alelos ao aconselhamento genético, com as pegadinhas da PB',
    `## 1. Genética: a linguagem da hereditariedade
**Onde ficam as informações genéticas?**
- **DNA:** molécula que armazena a informação hereditária; **gene:** segmento de DNA ligado à produção de um RNA ou produto funcional.
- **Cromossomos:** DNA associado a proteínas. **Homólogos:** par com genes nos mesmos loci, um de origem materna e outro paterna.
- **Alelos:** versões de um gene. **Lócus gênico:** posição ocupada por um gene em um cromossomo.

**Genótipo, fenótipo e tipos de alelos**
| Conceito | Definição / exemplo |
|---|---|
| Genótipo | Combinação de alelos: AA, Aa, aa |
| Fenótipo | Característica observável, influenciada pelo genótipo e, por vezes, pelo ambiente |
| Homozigoto | Dois alelos iguais: AA ou aa |
| Heterozigoto | Dois alelos diferentes: Aa |
| Dominante / recessivo | Em dominância completa, A se manifesta em AA e Aa; a aparece em aa |

**Cruzamento que precisa saber fazer**
Dominância completa, **Aa × Aa**: cada responsável fornece A ou a, e as combinações são AA, Aa, Aa, aa.
> **Genótipos: 25% AA, 50% Aa, 25% aa. Fenótipos: 75% dominante e 25% recessivo** (se A for totalmente dominante).

## 2. Sistema sanguíneo ABO
Existem **três alelos: IA, IB e i**. IA e IB são **codominantes**; ambos dominam sobre i.
| Fenótipo | Genótipos possíveis | Antígenos nas hemácias |
|---|---|---|
| A | IAIA ou IAi | A |
| B | IBIB ou IBi | B |
| AB | IAIB | A e B |
| O | ii | Nenhum A/B |

> **Aplicação:** cruzamento IAi × IBi, e os filhos possíveis são **A, B, AB e O (25% cada)**. Atenção: grupo sanguíneo ≠ genótipo único.

## 3. Imunização: vacinas e soros
| Vacina | Soro |
|---|---|
| Apresenta antígenos ou instruções para produzi-los; estimula resposta imune própria | Fornece anticorpos prontos contra um agente ou toxina |
| Imunização **ativa artificial** | Imunização **passiva artificial** |
| Proteção geralmente mais lenta, com possível memória imunológica | Efeito imediato ou rápido, mas temporário; sem formação de memória |
| Ex.: vacinação preventiva | Ex.: soro antiofídico após acidente |

> **Vacina = ensina o organismo a produzir sua defesa. Soro = entrega anticorpos já prontos.** Natural ativa: infecção; natural passiva: anticorpos maternos.

## 4. Biotecnologia e manipulação genética
**Técnicas e aplicações**
- **Terapia gênica:** busca tratar condições por introdução, alteração ou regulação de material genético em células.
- **CRISPR-Cas9:** ferramenta de edição de DNA; o RNA-guia direciona a Cas9 ao trecho-alvo para produzir um corte, permitindo alterações durante o reparo.
- **Células-tronco:** conseguem se autorrenovar e se diferenciar em tipos celulares; estudadas em medicina regenerativa.
- **Insulina humana por microrganismos transgênicos:** inserção do gene humano de interesse em microrganismos, produção da proteína e purificação.

**OGM x transgênico**
| OGM | Transgênico |
|---|---|
| Organismo cujo material genético foi modificado por engenharia genética | Tipo de OGM que recebeu material genético de outra espécie por engenharia genética |

> **Todo transgênico é OGM, mas nem todo OGM é transgênico.**

**Aspectos éticos**
- **Benefícios e riscos:** tratamentos, produção de medicamentos, possíveis efeitos não previstos, consentimento e acesso desigual.
- **Eugenia:** tentativa de selecionar ou restringir características hereditárias de populações humanas; historicamente associada a discriminação e violação de direitos.

## 5. Mutações e agentes mutagênicos
- **Mutação:** alteração na sequência do DNA; pode surgir espontaneamente ou por ação de agentes mutagênicos.
- **Exemplos de agentes:** radiação UV/ionizante e certas substâncias químicas. Nem toda mutação causa doença; alterações em células germinativas podem ser herdadas.

> **Atenção:** mutação é alteração do material genético; não significa necessariamente doença nem é sempre transmitida aos filhos.

## 6. Doenças genéticas e hereditariedade
| Tipo | Como reconhecer |
|---|---|
| Monogênica (mendeliana) | Relacionada principalmente à alteração em **um gene**, com padrões como dominante, recessivo ou ligado ao sexo |
| Poligênica | Influenciada por **muitos genes**; cada um pode contribuir para a característica |
| Multifatorial | Interação de variantes genéticas e **fatores ambientais** |

**Portador x afetado**
- **Portador** (em condição recessiva): geralmente heterozigoto, que possui o alelo associado à condição e pode transmiti-lo sem manifestar a doença.
- **Afetado:** manifesta a condição genética, conforme seu mecanismo de herança.

Exemplo recessivo: pais **Aa × Aa**, e os filhos são 25% aa (afetado), 50% Aa (portador) e 25% AA (não portador desse alelo). As proporções são **probabilidades para cada gestação**.

## 7. Alterações cromossômicas
| Alteração | Explicação |
|---|---|
| Numérica | Mudança na quantidade de cromossomos; exemplo: trissomia |
| Estrutural | Mudança na estrutura cromossômica, como deleção, duplicação, inversão ou translocação |
| Síndrome de Down | Em geral, **trissomia do cromossomo 21**: três cópias do cromossomo 21. É condição genética, **não doença contagiosa** |

**Aconselhamento genético e pré-natal**
- **Aconselhamento genético:** orientação profissional sobre histórico familiar, probabilidades, exames e decisões informadas; **não determina as escolhas das famílias**.
- **Acompanhamento pré-natal:** cuidados e exames durante a gestação para acompanhar a saúde materna e fetal e identificar riscos ou condições.

## 8. Quadro final: pegadinhas da PB
| Não confunda | Resposta-curinga |
|---|---|
| Alelo / gene | Alelo = versão; gene = segmento funcional de DNA |
| Homólogos / cromátides | Homólogos = cromossomos correspondentes; cromátides = cópias de um cromossomo duplicado |
| Dominante / frequente | Dominância não significa ser o alelo mais comum |
| Vacina / soro | Vacina ativa a resposta; soro fornece anticorpos |
| OGM / transgênico | Transgênico é um subconjunto dos OGMs |
| Monogênica / multifatorial | Um gene principal x genes + ambiente |
| Trissomia 21 | Alteração numérica: cromossomo extra |

**Checklist da Daiane:** genética e ABO, imunização, CRISPR, terapia gênica e células-tronco, OGMs/transgênicos e ética, mutações e doenças genéticas, aconselhamento e pré-natal.

*Resumo escrito por Pedro, a partir do roteiro da Prof.ª Daiane Marin (PB de 26/11/2026).*`,
  ),
];
