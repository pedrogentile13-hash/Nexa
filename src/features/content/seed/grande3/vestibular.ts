import { resumo, type ResumoG3 } from './types';

/** Educação Financeira, Pensamento Computacional, método de estudo e o pacote do Vestibular (redação, estratégia e planos de estudo). */
export const RESUMOS_HABILIDADES: ResumoG3[] = [
  resumo(
    'educacao-financeira',
    '7º ano',
    'fin7-consumo',
    'Consumo consciente e orçamento',
    'Desejo × necessidade, comparar preços e poupar',
    `
## Necessidade × desejo
Antes de comprar, pergunte: preciso disso agora? Cabe no meu orçamento?

## Comparar preços
Compare o **preço por unidade** (por kg, por litro), não o do pacote.

## Orçamento 50-30-20
50% necessidades, 30% desejos, 20% poupança. É um ponto de partida, não uma regra fixa.

## Reserva de emergência
Dinheiro guardado para imprevistos, para não precisar de crédito caro.`,
  ),
  resumo(
    'educacao-financeira',
    '9º ano',
    'fin9-credito',
    'Juros, crédito e dívidas',
    'Como as dívidas crescem e como evitar',
    `
## Crédito tem custo
Parcelar com juros faz o produto sair mais caro. Compare o total parcelado com o preço à vista.

## Os mais caros
**Rotativo do cartão** e **cheque especial** estão entre os créditos mais caros do país.

## Pagamento mínimo
Pagar só o mínimo da fatura deixa o resto crescer em juros compostos.

## Regra de ouro
Se não cabe no orçamento sem dívida, espere e junte dinheiro.`,
  ),
  resumo(
    'educacao-financeira',
    '1ª série EM',
    'fin1-investimentos',
    'Investimentos e inflação',
    'Ganho real, risco e golpes',
    `
## Inflação
É a alta geral dos preços. Dinheiro parado perde poder de compra.

## Ganho real
Rendimento − inflação (aproximadamente). Rendeu 10% com inflação de 5%: ganho real ≈ 5%.

## Risco e diversificação
Mais retorno costuma vir com mais risco. **Diversificar** reduz o impacto de uma aplicação ruim.

## Sinal de golpe
"Rendimento garantido e alto, sem risco" é característica de pirâmide financeira.`,
  ),
  resumo(
    'pensamento-computacional',
    '7º ano',
    'pc7-algoritmos',
    'Algoritmos e os pilares do pensamento computacional',
    'Decomposição, padrões, abstração e algoritmos',
    `
## Os 4 pilares
- **Decomposição:** dividir o problema em partes menores.
- **Reconhecimento de padrões:** perceber o que se repete.
- **Abstração:** focar no essencial.
- **Algoritmo:** sequência finita e ordenada de passos.

## Estruturas
- **Sequência:** um passo depois do outro.
- **Decisão:** se… então… senão.
- **Repetição:** repita enquanto / para i de 1 até n.

## Exemplo
soma ← 0; para i de 1 até 5: soma ← soma + i → soma = 15.`,
  ),
  resumo(
    'pensamento-computacional',
    '9º ano',
    'pc9-binario',
    'Sistema binário e dados',
    'Como o computador representa números',
    `
## Base 2
Só dois símbolos: 0 e 1 (**bits**). Cada posição vale uma potência de 2: 1, 2, 4, 8, 16…

## Converter
- Binário → decimal: some as potências onde há 1. 1011 = 8 + 2 + 1 = **11**.
- Decimal → binário: divida por 2 e leia os restos de baixo para cima.

## Medidas
8 bits = 1 byte; 1 KB = 1.024 bytes; com n bits há 2ⁿ valores.`,
  ),
  resumo(
    'pensamento-computacional',
    '1ª série EM',
    'pc1-logica',
    'Lógica booleana e programação',
    'E, OU, NÃO e estruturas de decisão',
    `
## Operadores
- **E (AND):** verdadeiro só se os dois forem verdadeiros.
- **OU (OR):** verdadeiro se pelo menos um for verdadeiro.
- **NÃO (NOT):** inverte o valor.

## Resto da divisão
n % 2 = 0 → par; n % 2 = 1 → ímpar.

## Busca binária
Numa lista **ordenada**, corte pela metade a cada passo: 1.024 itens precisam de no máximo 11 comparações.`,
  ),
  resumo(
    'lingua-portuguesa',
    '9º ano',
    'metodo-estudar-melhor',
    'Como estudar melhor: método que funciona',
    'Prática de lembrar, revisão espaçada e erros',
    `
## Faça
- **Teste-se:** feche o material e tente lembrar (prática de recuperação).
- **Espace as revisões:** volte ao conteúdo em dias diferentes, em vez de uma maratona.
- **Resolva questões:** é onde o conteúdo vira habilidade.
- **Use os erros:** cada erro mostra o que ainda não está firme.

## Evite
Reler muitas vezes, grifar tudo e só assistir videoaulas aceleradas: dão **sensação** de aprendizado, mas fixam pouco.

## No Nexa
Quiz com correção na hora, simulados e a tela de **Revisões**, que mostra o que rever hoje.`,
  ),
];

/** Resumos da Biblioteca do Vestibular: redação, estratégia de prova e planos de estudo. */
export const RESUMOS_VESTIBULAR: ResumoG3[] = [
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'vest-redacao-competencias',
    'Redação ENEM: as 5 competências',
    'O que cada competência avalia e como pontuar',
    `
## As 5 competências (0 a 200 cada, total 1.000)
1. **Norma-padrão:** ortografia, concordância, regência, pontuação.
2. **Tema e tipo textual:** dissertativo-argumentativo, com repertório legitimado e pertinente.
3. **Projeto de texto:** seleção e organização dos argumentos.
4. **Coesão:** conectivos e retomadas.
5. **Proposta de intervenção:** agente, ação, meio/modo, finalidade e detalhamento, respeitando os direitos humanos.

## Zera a redação
Fuga total ao tema, texto não dissertativo-argumentativo, até 7 linhas, cópia dos textos motivadores, partes desconectadas.`,
    'vestibular',
  ),
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'vest-redacao-estrutura',
    'Estrutura da redação nota alta',
    'Introdução, desenvolvimento e conclusão em 30 linhas',
    `
## Introdução (5–7 linhas)
Contextualize com um **repertório**, apresente a **tese** e anuncie os dois argumentos.

## Desenvolvimento (2 parágrafos de 7–9 linhas)
Tópico frasal → explicação → **repertório/dado** → fechamento ligado à tese.

## Conclusão (5–7 linhas)
Retome a tese e faça a **proposta de intervenção completa** (agente, ação, meio, finalidade e detalhamento).

## Checklist
Conectivo no início de cada parágrafo, sem "eu", sem gírias, sem perguntas retóricas em excesso.`,
    'vestibular',
  ),
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'vest-redacao-repertorio',
    'Repertório sociocultural que funciona',
    'Como usar filósofos, leis e dados sem forçar',
    `
## O que é repertório produtivo
Informação de fora dos textos motivadores, **verdadeira** e **ligada ao argumento**.

## Fontes coringas
- **Constituição de 1988** (art. 5º: igualdade; art. 6º: direitos sociais; art. 205: educação).
- **Pensadores:** Bauman (modernidade líquida), Durkheim (fato social), Kant (dignidade), Paulo Freire (educação libertadora).
- **Dados** de IBGE, OMS, ONU, quando você tiver certeza do número.

## Erro comum
Citar alguém famoso sem explicar a relação com o problema. O repertório precisa **trabalhar** no argumento.`,
    'vestibular',
  ),
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'vest-fuvest-unicamp-redacao',
    'Redação na Fuvest, Unicamp e Unesp',
    'Diferenças em relação ao ENEM',
    `
## Fuvest
Dissertação a partir de uma coletânea; não exige proposta de intervenção. Valoriza reflexão crítica e autoria.

## Unicamp
**Gêneros variados** (carta, artigo, discurso, relato…): cumprir o gênero e a situação de comunicação é decisivo. Confira no edital do ano quantas propostas há e quantos textos escrever.

## Unesp
Dissertação argumentativa a partir de coletânea.

## Dica
Leia o edital do ano: formatos e critérios podem mudar.`,
    'vestibular',
  ),
  resumo(
    'matematica',
    'Pré-vestibular',
    'vest-matematica-que-mais-cai',
    'Matemática no ENEM: o que mais cai',
    'Os temas que aparecem em quase toda prova',
    `
## Prioridades
- **Razão, proporção, escala e regra de três.**
- **Porcentagem** (aumentos, descontos, juros).
- **Estatística:** média, mediana, moda, leitura de gráficos e tabelas.
- **Geometria plana e espacial:** áreas, volumes, planificações.
- **Funções** (afim e quadrática) em situações do dia a dia.
- **Probabilidade e contagem.**

## Estratégia
As questões trazem muito texto: grife os dados, monte a conta e confira as **unidades**. Pule as longas e volte depois.`,
    'vestibular',
  ),
  resumo(
    'biologia',
    'Pré-vestibular',
    'vest-natureza-que-mais-cai',
    'Ciências da Natureza no ENEM: o que mais cai',
    'Temas de Biologia, Química e Física mais frequentes',
    `
## Biologia
Ecologia e problemas ambientais, saúde e doenças, genética, citologia.

## Química
Química ambiental, soluções e concentração, estequiometria, química orgânica (combustíveis), reações de oxirredução.

## Física
Eletricidade e consumo de energia, mecânica (movimento, energia), ondas e óptica, termologia.

## Estratégia
O ENEM gosta de **contexto do cotidiano** (saneamento, energia em casa, alimentos). Relacione o conceito com o problema real da questão.`,
    'vestibular',
  ),
  resumo(
    'historia',
    'Pré-vestibular',
    'vest-humanas-que-mais-cai',
    'Ciências Humanas no ENEM: o que mais cai',
    'História, Geografia, Filosofia e Sociologia',
    `
## História
Brasil Colônia, escravidão e resistência, Era Vargas, ditadura militar e redemocratização, cidadania.

## Geografia
Urbanização, questões ambientais, agropecuária, energia, globalização, cartografia.

## Filosofia e Sociologia
Ética, política (contratualistas), cidadania, trabalho, cultura, racismo e desigualdade.

## Estratégia
Leia o **texto-base** com atenção: muitas respostas estão nele. Desconfie de alternativas com juízos absolutos.`,
    'vestibular',
  ),
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'vest-estrategia-prova',
    'Estratégia de prova: tempo e chute inteligente',
    'Como não deixar pontos na mesa',
    `
## Tempo
ENEM 1º dia: 5h30 para 90 questões + redação. 2º dia: 5h para 90 questões. Reserve ~1h10 para a redação.

## Ordem
Faça primeiro as **fáceis**, marque as difíceis e volte. Não gaste mais de 4 minutos numa questão travada.

## Chute
No ENEM não há desconto por erro: **nunca deixe em branco**. Elimine alternativas e chute entre as que sobrarem.

## Cartão-resposta
Passe as respostas aos poucos (a cada bloco), não só no fim.`,
    'vestibular',
  ),
  resumo(
    'matematica',
    'Pré-vestibular',
    'vest-tri',
    'TRI: como o ENEM calcula sua nota',
    'Por que acertar as fáceis vale mais que chutar as difíceis',
    `
## Ideia
A Teoria de Resposta ao Item avalia a **coerência** das suas respostas. Cada questão tem dificuldade, discriminação e chance de acerto ao acaso.

## Na prática
- Acertar as **fáceis** é essencial: errar fácil e acertar difícil parece chute e vale menos.
- Duas pessoas com o mesmo número de acertos podem ter notas diferentes.

## Estratégia
Garanta as fáceis e médias com calma; nas difíceis, raciocine e chute com eliminação.`,
    'vestibular',
  ),
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'vest-erros-revisao',
    'Como usar seus erros para subir a nota',
    'Caderno de erros e revisão no Nexa',
    `
## Por que os erros valem ouro
Cada erro aponta **exatamente** o que falta. Revisar os erros rende mais que estudar tudo de novo.

## Classifique o erro
1. **Conteúdo:** não sabia a matéria → resumo + questões.
2. **Interpretação:** leu errado → releia enunciados com calma.
3. **Atenção/conta:** sabia, mas errou → confira unidades e sinais.

## No Nexa
Em **Erros e revisões**, refaça as questões erradas e use os resumos e simulados para fechar a lacuna.`,
    'vestibular',
  ),

  // ------------------------------------------------------------ Planos de estudo (guias)
  resumo(
    'matematica',
    'Pré-vestibular',
    'plano-enem-12-semanas',
    'Plano de estudo: ENEM em 12 semanas',
    'Cronograma semana a semana com conteúdos, simulados e redação',
    `
> Plano sugerido pelo Nexa. Ajuste ao seu tempo; a trilha "Plano ENEM 12 semanas" traz os materiais de cada etapa.

## Rotina semanal
- 4 dias de conteúdo (1 área por dia) + questões.
- 1 redação por semana.
- 1 simulado a cada 2 semanas.
- 1 dia para revisar erros.

## Cronograma
| semanas | foco |
|---|---|
| 1–2 | Matemática básica (porcentagem, razão, estatística) + estrutura da redação |
| 3–4 | Natureza: ecologia, saúde, eletricidade |
| 5–6 | Humanas: Brasil Colônia ao Império, urbanização |
| 7–8 | Linguagens: interpretação, gêneros, literatura |
| 9–10 | Geometria, funções, química (soluções e estequiometria) |
| 11 | Simulados completos e revisão de erros |
| 12 | Reta final: revisar resumos, redação e descanso |`,
    'vestibular',
  ),
  resumo(
    'matematica',
    'Pré-vestibular',
    'plano-enem-6-meses',
    'Plano de estudo: ENEM em 6 meses',
    'Três fases: base, aprofundamento e reta final',
    `
> Plano sugerido pelo Nexa. A trilha "Plano ENEM 6 meses" organiza os materiais por fase.

## Fase 1 · Base (meses 1–2)
Todas as áreas no nível básico. Uma redação a cada 15 dias. Quizzes diários.

## Fase 2 · Aprofundamento (meses 3–4)
Temas que mais caem. Redação semanal. Um simulado por área a cada 2 semanas.

## Fase 3 · Reta final (meses 5–6)
Simulados completos com tempo de prova, revisão de erros, resumos e duas redações por semana.

## Regra de ouro
Se faltou um dia, não compense virando a noite: retome o plano no dia seguinte.`,
    'vestibular',
  ),
  resumo(
    'historia',
    'Pré-vestibular',
    'plano-fuvest',
    'Plano de estudo: Fuvest (1ª e 2ª fase)',
    'Como dividir a preparação entre as duas fases',
    `
> Plano sugerido pelo Nexa. Confira o edital e a lista de obras de leitura obrigatória do ano.

## 1ª fase (objetiva)
Prova longa, com todas as disciplinas. Treine com simulados de 1ª fase e controle o tempo.

## 2ª fase (discursiva)
Respostas escritas: mostre o raciocínio, use os termos técnicos e seja objetivo. Redação dissertativa.

## Distribuição sugerida
- Até 2 meses antes da 1ª fase: 70% objetivas, 30% discursivas e redação.
- Depois da 1ª fase: 80% discursivas e redação das disciplinas da sua carreira.

## Leitura
Leia as obras obrigatórias com antecedência, uma por mês.`,
    'vestibular',
  ),
  resumo(
    'biologia',
    'Pré-vestibular',
    'plano-unicamp-unesp',
    'Plano de estudo: Unicamp e Unesp',
    'Interdisciplinaridade e gêneros de redação',
    `
> Plano sugerido pelo Nexa. Confira os editais do ano.

## Unicamp
- 1ª fase interdisciplinar, com 4 alternativas por questão.
- 2ª fase discursiva por área + redação com **gêneros variados**: treine carta, artigo e discurso.

## Unesp
- 1ª fase de conhecimentos gerais.
- 2ª fase com questões discursivas e redação dissertativa.

## Rotina
3 dias de conteúdo e questões, 1 dia de discursivas, 1 redação por semana (alternando gêneros), revisão de erros no fim de semana.`,
    'vestibular',
  ),
  resumo(
    'lingua-portuguesa',
    'Pré-vestibular',
    'plano-reta-final-30-dias',
    'Plano de estudo: reta final em 30 dias',
    'O que fazer no último mês antes da prova',
    `
> Plano sugerido pelo Nexa. A trilha "Reta final 30 dias" reúne os materiais.

## Semanas 1 e 2
Simulados completos (2 por semana) e revisão de **todos** os erros. Uma redação a cada 3 dias.

## Semana 3
Resumos dos temas que mais caem e refação das questões erradas.

## Semana 4
Ritmo leve: revisão de resumos, uma redação e descanso. Na véspera, nada de conteúdo novo: organize documentos, horário e trajeto.

## Cuidados
Sono regular, alimentação e pausas. Cansaço derruba mais pontos que um tema a menos.`,
    'vestibular',
  ),
  resumo(
    'fisica',
    'Pré-vestibular',
    'plano-ita-ime',
    'Plano de estudo: ITA e IME',
    'Base sólida em exatas e treino de discursivas',
    `
> Plano sugerido pelo Nexa. Os simulados "fundamentos" do Nexa cobrem a base; ITA e IME exigem aprofundamento além deles.

## Pilares
Matemática, Física e Química com profundidade, além de Português e Inglês.

## Rotina
- Teoria + exercícios de nível crescente todos os dias.
- Uma lista de discursivas por semana (mostrar todo o desenvolvimento).
- Provas anteriores (ITA e IME na Biblioteca) cronometradas a cada 15 dias.

## Dica
Domine primeiro a base (funções, trigonometria, cinemática, estequiometria) antes de tentar questões olímpicas.`,
    'vestibular',
  ),
];
