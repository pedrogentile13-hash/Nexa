import { md, mo, type PacoteMisto } from './types';

/**
 * Simulados de SEGUNDA FASE dos vestibulares discursivos (Fuvest, Unicamp, Unesp): poucas objetivas de aquecimento e a
 * maior parte discursiva, corrigida por IA. Questões originais, no estilo das bancas (não são provas oficiais).
 * O ENEM segue só com simulados objetivos.
 */
export const SEGUNDA_FASE_MISTO: PacoteMisto[] = [
  {
    slug: 'fuvest-2fase-humanas-linguagens',
    kind: 'simulado',
    context: 'vestibular',
    banca: 'fuvest',
    subject: 'historia',
    grade: 'Pré-vestibular',
    title: 'Fuvest · 2ª fase · Humanas e Linguagens (estilo)',
    subtitle: '2 objetivas e 8 discursivas, com correção por IA',
    description:
      'Simulado no estilo da 2ª fase da Fuvest: respostas dissertativas curtas e objetivas, que cobram argumento, repertório e clareza.',
    minutes: 120,
    questoes: [
      mo(
        'medio',
        'Texto: "A Constituição de 1988 ampliou direitos sociais e consolidou a participação popular por meio de plebiscitos, referendos e iniciativa popular." O texto destaca, no processo de redemocratização, a:',
        [
          'restrição do voto às elites',
          'ampliação de instrumentos de participação direta',
          'centralização do poder no Executivo',
          'proibição de partidos políticos',
        ],
        1,
        'A Constituição de 1988 criou e valorizou mecanismos de democracia direta (plebiscito, referendo, iniciativa popular).',
      ),
      mo(
        'medio',
        'Em "Os sertões", Euclides da Cunha descreve o conflito de Canudos relacionando o ambiente ao homem do sertão. Essa obra é considerada:',
        [
          'romance romântico indianista',
          'obra que mistura ciência, jornalismo e literatura, de crítica à República',
          'poesia parnasiana',
          'dramaturgia modernista',
        ],
        1,
        '"Os sertões" combina reportagem, ensaio científico e prosa literária, denunciando a violência republicana.',
      ),
      md(
        'medio',
        'Explique de que modo a Revolução Industrial transformou as relações de trabalho na Inglaterra do século XIX. Mencione duas mudanças.',
        'A mecanização e as fábricas deslocaram o trabalho artesanal e doméstico para a produção em larga escala, com operários assalariados submetidos a disciplina de horários, jornadas muito longas e salários baixos. Houve uso de mão de obra feminina e infantil em condições precárias, urbanização acelerada e surgimento da classe operária, que organizou sindicatos e lutou por direitos trabalhistas.',
        [
          'Cita duas mudanças corretas (assalariamento, jornada, trabalho infantil/feminino, disciplina fabril, sindicatos)',
          'Contrasta com o trabalho artesanal anterior',
          'Escreve de forma clara e articulada',
        ],
      ),
      md(
        'medio',
        'O que foi a Lei de Terras de 1850 e que relação teve com o fim do tráfico de escravizados e com a imigração?',
        'A Lei de Terras (1850) determinou que a terra só poderia ser adquirida por compra, e não por posse, dificultando o acesso de pobres, libertos e futuros imigrantes à propriedade. Foi promulgada no mesmo ano da Lei Eusébio de Queirós, que proibiu o tráfico de escravizados: com o fim da oferta de africanos, previa-se a necessidade de trabalhadores livres, e a restrição fundiária garantia que eles dependeriam do trabalho nas grandes fazendas, mantendo a concentração de terras.',
        [
          'Explica que a terra passou a ser comprada, não ocupada',
          'Relaciona ao fim do tráfico (1850) e à substituição da mão de obra',
          'Conclui sobre a concentração fundiária',
        ],
      ),
      md(
        'dificil',
        'Distinga Estado de nação e explique por que pode haver nações sem Estado. Dê um exemplo.',
        'Estado é a organização política e jurídica com território, governo e soberania; nação é uma comunidade humana que compartilha identidade cultural, língua, história e sentimento de pertencimento. Pode haver nações sem Estado próprio, como os curdos, espalhados por Turquia, Iraque, Síria e Irã, ou os palestinos e povos indígenas em vários países, que mantêm identidade comum sem soberania política sobre seu território.',
        [
          'Define corretamente Estado e nação',
          'Explica a possibilidade de nação sem Estado',
          'Dá exemplo adequado',
        ],
      ),
      md(
        'dificil',
        'A Guerra Fria foi marcada por conflitos "por procuração". Explique o termo, utilizando a Guerra da Coreia ou a do Vietnã.',
        'Guerras por procuração são conflitos em que as superpotências não se enfrentam diretamente, mas apoiam lados opostos num conflito local, com armas, dinheiro e assessores. Na Guerra do Vietnã, a URSS e a China apoiaram o Vietnã do Norte comunista, e os EUA intervieram militarmente ao lado do Sul, para conter o avanço do comunismo (teoria do dominó), sem que EUA e URSS entrassem em guerra direta.',
        [
          'Define guerra por procuração',
          'Aplica a um caso real com os lados corretos',
          'Relaciona ao risco de confronto nuclear direto',
        ],
      ),
      md(
        'dificil',
        'Em um texto de opinião, "O voto de adolescentes de 16 e 17 anos é uma forma de ampliar a cidadania". Explique, com um argumento, por que essa afirmação pode ser defendida ou criticada.',
        'Resposta de posicionamento: quem defende pode argumentar que o voto facultativo aos 16 e 17 anos estimula a participação política precoce, valoriza a educação para a cidadania e dá voz a um grupo afetado por políticas de educação e emprego. Quem critica pode afirmar que falta maturidade, informação ou autonomia para decidir, ou que é preciso fortalecer antes a educação política na escola. O essencial é apresentar posição clara e argumento coerente com a realidade brasileira.',
        [
          'Assume uma posição clara',
          'Desenvolve ao menos um argumento coerente',
          'Mostra clareza e articulação dos argumentos',
        ],
      ),
      md(
        'dificil',
        'Analise a relação entre o crescimento das redes sociais e a disseminação de notícias falsas. Que medidas individuais podem reduzir esse problema?',
        'As redes sociais permitem compartilhar conteúdo rapidamente, e algoritmos que priorizam engajamento amplificam informações sensacionalistas, inclusive falsas, em bolhas que reforçam crenças prévias. Isso prejudica o debate público e decisões como o voto e a saúde. Medidas individuais: checar a fonte e a data, buscar a notícia em veículos confiáveis ou agências de checagem antes de compartilhar, desconfiar de títulos apelativos e diversificar as fontes.',
        [
          'Relaciona redes sociais e algoritmos à disseminação',
          'Aponta consequência social',
          'Propõe medidas individuais concretas',
        ],
      ),
      md(
        'dificil',
        'Explique o conceito de "função social da propriedade" e como ele se relaciona ao debate sobre reforma agrária no Brasil.',
        'A função social da propriedade, prevista na Constituição de 1988, estabelece que o direito de propriedade não é absoluto: a terra deve ser usada de modo produtivo, com respeito ao meio ambiente e às leis trabalhistas. A propriedade que não cumpre essa função pode ser desapropriada para fins de reforma agrária. Isso sustenta o debate sobre redistribuir terras improdutivas para famílias sem-terra, frente à elevada concentração fundiária no país.',
        [
          'Explica que a propriedade deve cumprir função social',
          'Relaciona à desapropriação e à reforma agrária',
          'Menciona a concentração fundiária brasileira',
        ],
      ),
      md(
        'dificil',
        'Interprete a afirmação: "A linguagem não é apenas um instrumento de comunicação, mas também de poder." Dê um exemplo de como o uso da língua pode excluir ou incluir pessoas.',
        'A língua organiza o pensamento e as relações sociais: quem domina a norma culta e os códigos prestigiados tem mais acesso a empregos, textos jurídicos e instituições, enquanto variações regionais ou populares sofrem preconceito linguístico. Assim, a língua pode excluir (documentos e serviços em linguagem hermética, ridicularização de sotaques) ou incluir (linguagem simples e acessível, Libras, respeito às variedades linguísticas). Nomear ou silenciar grupos também é exercício de poder.',
        [
          'Interpreta a linguagem como forma de poder',
          'Apresenta exemplo de exclusão ou inclusão',
          'Mostra argumentação coerente',
        ],
      ),
    ],
  },
  {
    slug: 'fuvest-2fase-exatas-natureza',
    kind: 'simulado',
    context: 'vestibular',
    banca: 'fuvest',
    subject: 'matematica',
    grade: 'Pré-vestibular',
    title: 'Fuvest · 2ª fase · Exatas e Natureza (estilo)',
    subtitle: '2 objetivas e 9 discursivas, com correção por IA',
    description:
      'Simulado no estilo da 2ª fase da Fuvest em Matemática, Física, Química e Biologia: o desenvolvimento do raciocínio vale tanto quanto o resultado.',
    minutes: 120,
    questoes: [
      mo(
        'medio',
        'Uma partícula é lançada horizontalmente do alto de uma mesa de 1,25 m de altura (g = 10 m/s²). O tempo de queda até o chão é:',
        ['0,25 s', '0,5 s', '1 s', '1,25 s'],
        1,
        'h = g·t²/2 → 1,25 = 5t² → t² = 0,25 → t = 0,5 s.',
      ),
      mo(
        'medio',
        'A reação entre 0,2 mol de HCl e 0,1 mol de NaOH em solução produz, no máximo, quantos mols de NaCl?',
        ['0,05 mol', '0,1 mol', '0,2 mol', '0,3 mol'],
        1,
        'Reagem 1:1; o NaOH (0,1 mol) é o limitante: forma 0,1 mol de NaCl.',
      ),
      md(
        'medio',
        'Resolva e justifique: a soma de dois números positivos é 12 e o produto deles é 35. Quais são os números? Mostre como encontrá-los sem tentativa e erro.',
        'Sejam x e y com x + y = 12 e x·y = 35. Eles são raízes de t² − 12t + 35 = 0. Δ = 144 − 140 = 4, logo t = (12 ± 2) ÷ 2, ou seja, t = 7 ou t = 5. Os números são 5 e 7 (5 + 7 = 12; 5 × 7 = 35).',
        [
          'Monta a equação do 2º grau a partir de soma e produto',
          'Resolve corretamente (Δ = 4)',
          'Chega a 5 e 7 e verifica',
        ],
      ),
      md(
        'medio',
        'Um carro de 800 kg viaja a 72 km/h e freia até parar em 40 m. Determine, mostrando as contas, a força média de frenagem.',
        'Convertendo: 72 km/h = 20 m/s. Pela energia: o trabalho da força de frenagem é igual à variação da energia cinética: F·d = m·v²/2, ou F × 40 = 800 × 400 ÷ 2 = 160.000, logo F = 4.000 N. (Equivalente por cinemática: a = v²/2d = 5 m/s²; F = m·a = 4.000 N.)',
        [
          'Converte 72 km/h em 20 m/s',
          'Usa teorema da energia cinética ou cinemática + F = ma',
          'Chega a 4.000 N com unidades',
        ],
      ),
      md(
        'dificil',
        'Uma solução tem 4 g de NaOH (M = 40 g/mol) dissolvidos em água até 500 mL. Calcule a concentração em mol/L e o pH da solução (base forte, 25 °C).',
        'n = 4 ÷ 40 = 0,1 mol; [NaOH] = 0,1 mol ÷ 0,5 L = 0,2 mol/L. A base é forte e se dissocia totalmente: [OH⁻] = 0,2 mol/L. pOH = −log 0,2 = 0,7 e pH = 14 − 0,7 = 13,3.',
        ['Calcula 0,1 mol e 0,2 mol/L', 'Usa [OH⁻] = 0,2 e pOH ≈ 0,7', 'Chega a pH ≈ 13,3'],
      ),
      md(
        'dificil',
        'Explique por que a molécula de água é polar e como isso explica a capacidade da água de dissolver compostos iônicos como o NaCl.',
        'Na molécula de água a geometria é angular e o oxigênio é mais eletronegativo que o hidrogênio, criando uma distribuição desigual de cargas: polo parcialmente negativo no oxigênio e positivo nos hidrogênios (dipolo). Ao contato com NaCl, os polos da água se orientam: o oxigênio (δ−) atrai Na⁺ e os hidrogênios (δ+) atraem Cl⁻, enfraquecendo a rede cristalina e envolvendo os íons (solvatação), o que leva à dissolução.',
        [
          'Explica polaridade por geometria e eletronegatividade',
          'Descreve interação íon–dipolo com Na⁺ e Cl⁻',
          'Conclui sobre a dissolução do sal',
        ],
      ),
      md(
        'dificil',
        'Em uma população de coelhos, o alelo para pelagem escura (B) é dominante sobre o claro (b). Um macho escuro cruza com uma fêmea clara e nasce um filhote claro. Qual o genótipo dos pais? Qual a probabilidade de um segundo filhote ser claro?',
        'O filhote claro é bb e recebeu um b de cada genitor. A fêmea clara é bb. O macho escuro tem fenótipo B_ e, como transmitiu b, é Bb. Cruzamento Bb × bb: gametas B e b × b e b, resultando 50% Bb (escuros) e 50% bb (claros). A probabilidade de o segundo filhote ser claro é 1/2 (50%).',
        ['Deduz bb para a fêmea e Bb para o macho', 'Monta o cruzamento Bb × bb', 'Chega a 50%'],
      ),
      md(
        'dificil',
        'Explique como o ciclo do carbono é afetado pela queima de combustíveis fósseis e pelo desmatamento e cite uma consequência climática.',
        'No ciclo natural, o carbono circula entre atmosfera (CO₂), plantas (fotossíntese), animais (alimentação), decomposição e oceanos. A queima de combustíveis fósseis libera CO₂ que estava armazenado por milhões de anos, e o desmatamento reduz a absorção de CO₂ pelas plantas e libera o carbono presente na biomassa queimada ou decomposta. O aumento de CO₂ intensifica o efeito estufa e causa aquecimento global, com mais eventos climáticos extremos e elevação do nível do mar.',
        [
          'Descreve o ciclo (fotossíntese/respiração/decomposição)',
          'Explica o papel dos combustíveis fósseis e do desmatamento',
          'Cita consequência climática',
        ],
      ),
      md(
        'dificil',
        'Um objeto de 2 kg está a 5 m de altura. Calcule sua energia mecânica total e a velocidade com que atinge o solo, desprezando o atrito (g = 10 m/s²). Explique a conservação de energia.',
        'No alto, em repouso, a energia é só potencial: Ep = m·g·h = 2 × 10 × 5 = 100 J. Sem atrito a energia mecânica se conserva: ao chegar ao chão toda ela vira cinética, 100 = m·v²/2 = v², logo v = 10 m/s. A energia potencial se transforma em cinética, e o total permanece 100 J.',
        [
          'Calcula Ep = 100 J',
          'Aplica a conservação e obtém v = 10 m/s',
          'Explica a transformação de potencial em cinética',
        ],
      ),
      md(
        'dificil',
        'Um reservatório cilíndrico tem raio de 1 m e 2 m de altura. Calcule o volume em litros (use π ≈ 3) e o tempo para enchê-lo com uma torneira de vazão 50 L/min. Mostre as etapas.',
        'Volume = π·r²·h = 3 × 1² × 2 = 6 m³. Como 1 m³ = 1.000 L, o volume é 6.000 L. Tempo = volume ÷ vazão = 6.000 ÷ 50 = 120 minutos, ou seja, 2 horas.',
        ['Aplica V = π·r²·h e obtém 6 m³', 'Converte para 6.000 L', 'Calcula 120 min (2 h)'],
      ),
    ],
  },
  {
    slug: 'unicamp-2fase-interdisciplinar',
    kind: 'simulado',
    context: 'vestibular',
    banca: 'unicamp',
    subject: 'ciencias',
    grade: 'Pré-vestibular',
    title: 'Unicamp · 2ª fase · Interdisciplinar (estilo)',
    subtitle: '2 objetivas e 8 discursivas, com correção por IA',
    description:
      'Questões contextualizadas e interdisciplinares no estilo da Unicamp: leitura de texto, dado ou gráfico e resposta com argumento.',
    minutes: 120,
    questoes: [
      mo(
        'medio',
        'Um estudo mostra que cidades arborizadas têm temperatura média até 3 °C menor que áreas sem árvores. A principal explicação é:',
        [
          'as árvores emitem calor por fotossíntese',
          'a sombra e a evapotranspiração reduzem o aquecimento',
          'o asfalto reflete a luz',
          'a umidade diminui',
        ],
        1,
        'Sombra e evapotranspiração resfriam o ambiente.',
      ),
      mo(
        'medio',
        'Num gráfico de barras, a produção de milho passou de 50 mil t (2018) para 65 mil t (2022). O aumento percentual foi de:',
        ['15%', '23%', '30%', '65%'],
        2,
        '(65 − 50) ÷ 50 = 0,30 = 30%.',
      ),
      md(
        'medio',
        'Um texto informa que o consumo de água por pessoa no Brasil gira em torno de 150 litros por dia. Calcule o consumo mensal (30 dias) de uma família de 4 pessoas e proponha duas ações para reduzi-lo em 20%.',
        'Consumo diário da família: 4 × 150 = 600 L; em 30 dias: 18.000 L (18 m³). Reduzir 20% significa economizar 3.600 L por mês, chegando a 14.400 L. Ações: fechar a torneira ao escovar os dentes e ensaboar a louça, reduzir o tempo de banho, reaproveitar água da máquina ou da chuva, consertar vazamentos e usar descarga de duplo acionamento.',
        [
          'Calcula 18.000 L por mês',
          'Calcula a redução de 20% (3.600 L)',
          'Propõe duas ações plausíveis',
        ],
      ),
      md(
        'medio',
        'Explique o que é biodiversidade e por que sua perda pode afetar a segurança alimentar humana.',
        'Biodiversidade é a variedade de seres vivos, de genes e de ecossistemas. Sua perda enfraquece o equilíbrio ecológico e serviços como polinização, controle de pragas e fertilidade do solo, de que a agricultura depende. Menor diversidade genética de plantas e animais cultivados também torna as lavouras mais vulneráveis a doenças e a mudanças climáticas, ameaçando a oferta de alimentos.',
        [
          'Define biodiversidade',
          'Relaciona a serviços ecossistêmicos (polinização, pragas, solo)',
          'Conclui sobre o impacto na segurança alimentar',
        ],
      ),
      md(
        'dificil',
        'Em uma pesquisa de opinião com 1.200 pessoas, 45% apoiam uma proposta. Calcule quantas pessoas apoiam e explique por que a margem de erro importa ao interpretar o resultado.',
        '45% de 1.200 = 540 pessoas. A margem de erro indica quanto o resultado da amostra pode diferir do valor real da população; com margem de, por exemplo, 3 pontos, o apoio verdadeiro está entre 42% e 48%. Isso importa porque diferenças pequenas entre propostas podem estar dentro da margem de erro e não ser estatisticamente relevantes.',
        [
          'Calcula 540 pessoas',
          'Explica o significado da margem de erro',
          'Relaciona à interpretação de diferenças pequenas',
        ],
      ),
      md(
        'dificil',
        'Explique por que a luz do Sol demora cerca de 8 minutos para chegar à Terra e como isso evidencia que olhar para o céu é olhar para o passado.',
        'A luz viaja a cerca de 300.000 km/s, e a distância Terra–Sol é de aproximadamente 150 milhões de km: t = 150.000.000 ÷ 300.000 = 500 s, ou cerca de 8 minutos. Portanto vemos o Sol como ele era 8 minutos atrás. Com estrelas mais distantes a luz leva anos (ano-luz), então observamos sua imagem do passado.',
        [
          'Usa velocidade da luz e distância para chegar a ~500 s',
          'Interpreta que o que vemos é o passado',
          'Generaliza para as estrelas (ano-luz)',
        ],
      ),
      md(
        'dificil',
        'Discuta duas vantagens e duas limitações do uso de energia solar fotovoltaica no Brasil.',
        'Vantagens: o país tem alta irradiação solar ao longo do ano, a fonte é renovável e emite pouco gás de efeito estufa na operação, e permite geração distribuída (telhados), reduzindo a conta de luz. Limitações: intermitência (não gera à noite ou com nuvens), necessidade de armazenamento ou de rede de apoio, custo inicial dos painéis e impacto do descarte e da produção dos módulos.',
        [
          'Apresenta duas vantagens corretas',
          'Apresenta duas limitações corretas',
          'Argumenta com clareza',
        ],
      ),
      md(
        'dificil',
        'Um texto afirma que "tecnologia sozinha não resolve problemas sociais". Dê um exemplo concreto que ilustre essa ideia e justifique.',
        'Exemplo: a distribuição de computadores a escolas sem formação dos professores, internet ou manutenção não melhora a aprendizagem; os equipamentos ficam sem uso. A tecnologia é uma ferramenta que depende de políticas públicas, formação, infraestrutura e participação social para gerar resultado. Outro exemplo é o aplicativo de transporte, que amplia opções, mas não resolve a precarização do trabalho dos motoristas.',
        [
          'Apresenta exemplo concreto adequado',
          'Justifica que outros fatores sociais são necessários',
          'Conclui coerentemente',
        ],
      ),
      md(
        'dificil',
        'A partir do conceito de "pegada de carbono", proponha três ações de uma pessoa para reduzi-la e explique qual delas teria maior efeito.',
        'A pegada de carbono é a quantidade de gases de efeito estufa emitida direta ou indiretamente por uma pessoa, produto ou atividade. Ações: usar transporte coletivo, bicicleta ou caminhada em vez do carro; reduzir o consumo de carne bovina; economizar energia e evitar desperdício de alimentos. Em geral, abrir mão do automóvel individual e do consumo intenso de carne têm grande efeito, pois transporte e produção pecuária são grandes fontes de emissão.',
        ['Define pegada de carbono', 'Propõe três ações plausíveis', 'Justifica a de maior efeito'],
      ),
      md(
        'dificil',
        'Escreva um parágrafo (5 a 8 linhas) sobre o papel da ciência na formulação de políticas públicas durante uma epidemia, com pelo menos um argumento.',
        'Resposta aberta; espera-se tese clara de que a ciência deve orientar as decisões (isolamento, vacinação, protocolos), com argumentos como: fornece dados e modelos para prever o avanço da doença, avalia a eficácia de medidas e vacinas, combate a desinformação e dá transparência às decisões. Pode mencionar limites, como incertezas e a necessidade de considerar dimensões sociais e econômicas.',
        [
          'Tese clara sobre o papel da ciência',
          'Argumento desenvolvido com exemplo',
          'Organização, clareza e linguagem adequada',
        ],
      ),
    ],
  },
  {
    slug: 'unesp-2fase-humanas-linguagens',
    kind: 'simulado',
    context: 'vestibular',
    banca: 'unesp',
    subject: 'lingua-portuguesa',
    grade: 'Pré-vestibular',
    title: 'Unesp · 2ª fase · Linguagens e Humanas (estilo)',
    subtitle: '2 objetivas e 8 discursivas, com correção por IA',
    description:
      'Simulado no estilo da 2ª fase da Unesp: leitura de textos, interpretação e respostas dissertativas em Língua Portuguesa, História e Geografia.',
    minutes: 120,
    questoes: [
      mo(
        'medio',
        'Em "Quem espera sempre alcança", o sentido predominante é de:',
        [
          'inatividade garante o êxito',
          'paciência e perseverança levam ao resultado, conforme o ditado popular',
          'ameaça',
          'ironia',
        ],
        1,
        'O provérbio valoriza a paciência.',
      ),
      mo(
        'medio',
        'A Revolução Industrial favoreceu, no século XIX, o imperialismo europeu na África e na Ásia, principalmente por causa da busca por:',
        [
          'isolamento comercial',
          'matérias-primas e mercados consumidores',
          'igualdade entre os povos',
          'reservas de ouro apenas',
        ],
        1,
        'A industrialização exigia matérias-primas, mercados e áreas de investimento.',
      ),
      md(
        'medio',
        'Explique a diferença entre linguagem formal e informal e indique em qual situação cada uma é adequada.',
        'A linguagem formal segue a norma-padrão, evita gírias e abreviações e é usada em situações de maior distanciamento ou monitoramento, como provas, textos acadêmicos, entrevistas de emprego e documentos oficiais. A informal é espontânea, aceita gírias e construções coloquiais e é adequada a conversas entre amigos, família e mensagens pessoais. A adequação depende do interlocutor, do contexto e do gênero.',
        [
          'Diferencia formal e informal',
          'Indica uma situação adequada para cada',
          'Menciona a adequação ao contexto',
        ],
      ),
      md(
        'medio',
        'Defina "êxodo rural" e aponte duas consequências para as cidades que recebem os migrantes.',
        'Êxodo rural é o deslocamento de população do campo para as cidades, motivado por mecanização, concentração de terras, falta de emprego e busca de melhores condições. Consequências nas cidades: crescimento desordenado e formação de favelas, pressão sobre moradia, saúde, educação e transporte, desemprego e informalidade, além de problemas ambientais.',
        ['Define êxodo rural', 'Cita duas consequências urbanas', 'Relaciona às causas'],
      ),
      md(
        'dificil',
        'Compare a escravidão colonial no Brasil e o trabalho assalariado dos imigrantes europeus nas fazendas de café do final do século XIX, apontando uma semelhança e uma diferença.',
        'Diferença: os escravizados eram tratados como propriedade, sem salário nem liberdade, enquanto os imigrantes eram trabalhadores livres, com contratos e pagamento (embora muitas vezes em condições duras, com endividamento no sistema de parceria). Semelhança possível: ambos sustentavam a economia agroexportadora em latifúndios, com exploração intensa do trabalho e controle pelos fazendeiros, que concentravam terra e poder.',
        [
          'Aponta uma diferença correta (propriedade x liberdade/salário)',
          'Aponta uma semelhança plausível (latifúndio, exploração)',
          'Relaciona ao contexto da economia cafeeira',
        ],
      ),
      md(
        'dificil',
        'Leia: "A leitura não é apenas decifrar palavras, mas compreender o mundo." Explique essa ideia e relacione-a ao papel da escola.',
        'A frase afirma que ler envolve mais que decodificar letras: é interpretar o que o texto diz, relacioná-lo ao contexto, à experiência e ao conhecimento prévio, para entender a realidade e agir sobre ela. À escola cabe desenvolver leitores críticos, que questionam, comparam fontes e usam a leitura para participar da vida social, e não apenas ensinar a decodificar.',
        [
          'Interpreta a ideia central do trecho',
          'Relaciona leitura, contexto e compreensão do mundo',
          'Articula o papel da escola',
        ],
      ),
      md(
        'dificil',
        'Explique o que é o semiárido nordestino e uma política pública que busca convivência com a seca.',
        'O semiárido é a região do Nordeste com chuvas escassas e irregulares, altas temperaturas e predomínio da Caatinga. A seca é recorrente, mas a convivência com ela é possível com políticas como o Programa de Cisternas (captação de água da chuva para consumo e produção), tecnologias sociais e a transposição do Rio São Francisco, além de crédito e assistência técnica aos agricultores familiares.',
        [
          'Caracteriza o semiárido (chuva irregular, Caatinga)',
          'Cita política pública coerente',
          'Explica o objetivo da convivência com a seca',
        ],
      ),
      md(
        'dificil',
        'O que foi o Iluminismo e de que forma suas ideias influenciaram a Independência dos Estados Unidos e a Revolução Francesa?',
        'O Iluminismo foi um movimento intelectual do século XVIII que defendia a razão, a liberdade individual, a tolerância e a crítica ao absolutismo e aos privilégios. Seus princípios (soberania popular, direitos naturais, separação de poderes) fundamentaram a Declaração de Independência dos EUA (1776) e a Declaração dos Direitos do Homem e do Cidadão (1789), inspirando as revoluções contra o poder absoluto.',
        ['Define o Iluminismo e seus princípios', 'Relaciona aos EUA', 'Relaciona à França'],
      ),
      md(
        'dificil',
        'Reescreva a frase em linguagem formal, preservando o sentido: "Tipo, a galera tá ligada que o negócio é estudar mais pra passar na prova." Em seguida, comente o que mudou.',
        'Versão formal: "Os estudantes sabem que é necessário estudar mais para ser aprovado na prova." Mudanças: eliminação de gírias e marcas de oralidade ("tipo", "galera", "tá ligada", "negócio", "pra"), uso de vocabulário mais preciso e da norma-padrão, e organização mais clara da frase.',
        [
          'Apresenta reescrita formal com o mesmo sentido',
          'Elimina gírias e oralidade',
          'Comenta as mudanças',
        ],
      ),
      md(
        'dificil',
        'Escreva um parágrafo argumentativo (5 a 8 linhas) sobre "Os desafios da mobilidade urbana nas grandes cidades brasileiras", com tese e uma proposta de intervenção.',
        'Resposta aberta; espera-se tese clara (a mobilidade urbana é desafio por causa do uso excessivo do automóvel e do transporte público insuficiente), argumento ou dado (congestionamentos, tempo perdido, poluição, desigualdade no acesso), e proposta viável (investimento em transporte coletivo de qualidade, ciclovias, integração tarifária, planejamento urbano), com coesão e linguagem formal.',
        [
          'Tese clara',
          'Argumento desenvolvido',
          'Proposta de intervenção viável',
          'Coesão e correção linguística',
        ],
      ),
    ],
  },
];
