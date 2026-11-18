# Planejamento de conteúdo — Nexa Study e Nexa Vestibular

Documento vivo. Marque `[x]` ao concluir. Datas são metas, não promessas: ajuste conforme o seu tempo.

---

## 1. Como o conteúdo funciona no app (base do plano)

| Peça | O que é | Onde mora |
|---|---|---|
| **Matéria** | 21 matérias no catálogo (Português, Matemática, Biologia, Física, Química, História, Geografia, Inglês, Redação etc.), agrupadas em 4 áreas | `subject_catalog` |
| **Tópico** | Assunto dentro da matéria, com séries (`grade_levels`) | `content_topics` |
| **Recurso** | `resumo`, `quiz`, `simulado`, `podcast`, `video`, `imagem`, `musica` | `resources` |
| **Trilha** | Sequência de lições de uma matéria | `tracks` → `track_sections` → `track_lessons` |
| **Questão** | Pertence a um quiz/simulado; tem dificuldade (`facil/medio/dificil`), habilidades e tipos de erro | `questions` |
| **Contexto** | `school` ou `vestibular`: **separa o que conta no boletim** (Study) do que é treino de prova (Vestibular) | `resources.context` |
| **Provas** | ENEM, FUVEST, UNICAMP, UNESP, ITA e IME já cadastradas | `exams` |

**Regras que o plano respeita**
- Questão de vestibular **não entra no boletim escolar** (o `context` cuida disso).
- Um conteúdo pode ser **global** (todos veem) ou **da escola** (`school_id`, só aquela escola).
- O painel já tem **gerador de rascunho com IA** (simulado por matéria/tópico/série/dificuldade, até 20 questões) e **importação de simulado**. Rascunho **nunca** vai direto ao ar: precisa de revisão e de `is_published`.
- Fórmulas agora saem em símbolos de verdade (LaTeX): dá para produzir Matemática, Física e Química.

---

## 2. Princípios

1. **IA rascunha, humano publica.** Toda questão passa por revisão. Erro de gabarito destrói a confiança do aluno.
2. **Profundidade antes de largura.** Poucos tópicos muito bem feitos vencem muitos tópicos fracos.
3. **Começar pelo que mais cai e pelo que a escola piloto usa.**
4. **Original.** Texto e questões autorais, "no estilo de". Prova oficial de terceiros só com licença verificada.
5. **Um tópico = um pacote completo** (ver seção 3), nunca peças soltas.

---

## 3. Unidade de produção: o "pacote de tópico"

Cada tópico publicado entrega:

| Item | Padrão | Tempo estimado (IA + revisão) |
|---|---|---|
| **Resumo** | 300–500 palavras, exemplo resolvido, "erros comuns", 1 quadro-resumo | 15 min |
| **Quiz** | 8–10 questões (3 fáceis, 4 médias, 2–3 difíceis) com explicação em cada alternativa | 25 min |
| **Mini-trilha** (opcional) | 3–5 lições curtas encadeadas | 20 min |
| **Mídia** (opcional) | imagem/esquema ou vídeo curto | variável |

Meta de ritmo realista (você sozinho, com a escola): **8 pacotes por semana** em ~4 horas, em 2 blocos (ver seção 7).

### Checklist de qualidade (todo pacote)
- [ ] Alinhado à série e ao tópico (BNCC no Study; Matriz de Referência no Vestibular).
- [ ] **Todas as contas conferidas** (resolva você mesmo ou peça à IA para resolver sem ver o gabarito e compare).
- [ ] Uma única alternativa correta; as erradas são erros plausíveis (não absurdos).
- [ ] Explicação diz **por que** cada errada está errada.
- [ ] Linguagem na idade certa; frases curtas (leitura no celular).
- [ ] Fórmulas em LaTeX (`$...$`), sem texto solto como `x^2`.
- [ ] Imagem com texto alternativo; sem texto ou imagem copiados de terceiros.
- [ ] Dificuldade marcada, tópico e série preenchidos.
- [ ] Publicado só depois do aval (rascunho → revisado → publicado).

### Modelo de pedido à IA (cole e preencha)
```
Matéria: <...>   Tópico: <...>   Série: <...>   Contexto: <escolar | vestibular/ENEM>
Faça: (1) resumo de 400 palavras com um exemplo resolvido e "erros comuns";
(2) 10 questões de múltipla escolha (3 fáceis, 4 médias, 3 difíceis), uma alternativa correta,
distratores plausíveis, explicação de cada alternativa; fórmulas em LaTeX entre $...$.
Não invente fatos, datas ou dados. Se não tiver certeza, escreva [CONFERIR].
```
Tudo que vier com `[CONFERIR]` tem de ser verificado antes de publicar.

---

## 4. Nexa Study (escolar): o que produzir

**Fonte da verdade:** BNCC por série (6º–9º EF e 1º–3º EM) **e o plano de ensino dos professores do colégio piloto**. O gerador do painel aceita "planejamento do professor" como fonte única: use isso para alinhar com a escola.

### 4.1 Matérias, em ordem de prioridade
1. Matemática · 2. Língua Portuguesa · 3. Ciências/Biologia · 4. História · 5. Geografia · 6. Física · 7. Química · 8. Inglês · 9. Produção de Texto · (depois) Literatura, Filosofia, Sociologia, Espanhol.

### 4.2 Mapa de cobertura (matéria × série)
Marque o que já tem **pacote completo publicado**. Meta da fase 1 em **negrito**.

| Matéria | 6º | 7º | 8º | 9º | 1º EM | 2º EM | 3º EM |
|---|---|---|---|---|---|---|---|
| Matemática | **[ ]** | **[ ]** | **[ ]** | **[ ]** | **[ ]** | [ ] | [ ] |
| Português | **[ ]** | **[ ]** | **[ ]** | **[ ]** | **[ ]** | [ ] | [ ] |
| Ciências / Biologia | **[ ]** | **[ ]** | **[ ]** | **[ ]** | **[ ]** | [ ] | [ ] |
| História | **[ ]** | **[ ]** | **[ ]** | **[ ]** | [ ] | [ ] | [ ] |
| Geografia | **[ ]** | **[ ]** | **[ ]** | **[ ]** | [ ] | [ ] | [ ] |
| Física | — | — | — | **[ ]** | **[ ]** | [ ] | [ ] |
| Química | — | — | — | **[ ]** | **[ ]** | [ ] | [ ] |
| Inglês | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

### 4.3 Como escolher os tópicos de cada célula
1. Pegue o **plano de ensino** (ou o planejamento bimestral) do professor.
2. Liste **4–6 tópicos por bimestre**.
3. Priorize: (a) o que vai cair na próxima prova da escola, (b) o que os alunos mais erram (use **Desempenho/Revisões** do painel quando houver dados), (c) o que tem pouca coisa boa na internet em português.
4. Cada tópico vira **1 pacote** (seção 3).

### 4.4 Metas do Study
| Prazo | Meta |
|---|---|
| 30 dias | **48 pacotes** (8 matérias-chave × 6 tópicos) + **8 mini-trilhas** |
| 60 dias | 120 pacotes + 1 **simulado bimestral** por matéria-chave (20 questões) |
| 90 dias | Cobertura das 7 séries nas 5 matérias principais |

---

## 5. Nexa Vestibular: o que produzir

**Fonte da verdade:** **Matriz de Referência do ENEM (INEP)**: 4 áreas + Redação com as 5 competências. Depois, FUVEST, UNICAMP e UNESP. **ENEM primeiro**: é a maior audiência.

### 5.1 Estrutura
- **Linguagens, Códigos e suas Tecnologias** (Português, Literatura, Inglês/Espanhol, Artes, Ed. Física) + Redação
- **Matemática e suas Tecnologias**
- **Ciências da Natureza** (Física, Química, Biologia)
- **Ciências Humanas** (História, Geografia, Filosofia, Sociologia)

### 5.2 Tópicos de alta recorrência para começar
*(Lista de partida. Confira na Matriz de Referência e em provas recentes antes de fechar.)*

| Área | Tópicos prioritários |
|---|---|
| Matemática | Razão, proporção e porcentagem · Estatística e gráficos · Geometria plana e espacial · Funções (1º e 2º grau) · Probabilidade · Análise combinatória · Escalas e unidades |
| Natureza | Ecologia · Genética · Citologia · Fisiologia · Cinemática e dinâmica · Eletricidade · Termologia · Estequiometria · Soluções · Química orgânica · Eletroquímica |
| Humanas | Brasil República e Era Vargas · Ditadura militar · Urbanização · Meio ambiente · Geopolítica · Cartografia · Cidadania, cultura e movimentos sociais · Filosofia política |
| Linguagens | Interpretação de texto · Gêneros textuais · Variação linguística · Figuras de linguagem · Modernismo · Língua estrangeira (leitura) |

### 5.3 Redação (diferencial do produto)
- [ ] **20 propostas de tema** no estilo ENEM (social, cultural, ambiental, tecnologia), cada uma com textos de apoio autorais.
- [ ] **Rubrica das 5 competências** (0–200 cada) alinhada ao que a IA usa para corrigir.
- [ ] **30 repertórios socioculturais** organizados por tema (filmes, livros, dados, filósofos).
- [ ] **8 redações-modelo comentadas** (nota 1000, nota 600, nota 400), parágrafo a parágrafo.
- [ ] **Banco de conectivos e estruturas de proposta de intervenção** (os 5 elementos).

### 5.4 Tipos de conteúdo por tópico
| Formato | Uso |
|---|---|
| **Resumo "direto ao ponto"** | Teoria + 3 armadilhas de prova do tópico |
| **Quiz de fixação** (8–10 questões) | Treino por tópico, com contexto de prova |
| **Simulado curto por área** (15 questões, 45 min) | Rotina semanal |
| **Simulado completo** (45 questões + redação) | Mensal, com cronômetro |
| **Flashcards/Revisão** | Fórmulas, datas, conceitos (alimenta a fila de revisões) |

### 5.5 Regra de ouro das questões
- **Estilo ENEM**: texto-base, contextualização, interdisciplinar, calculadora desnecessária quando possível.
- **Habilidades marcadas** (`skills`) e **tipo de erro** em cada questão: isso alimenta o "pontos fracos" do Desempenho.
- **Original**: nada de copiar prova oficial. Se quiser usar provas anteriores, conferir licença e citar a fonte.

### 5.6 Metas do Vestibular
| Prazo | Meta |
|---|---|
| 30 dias | **32 pacotes** (4 áreas × 8 tópicos) + **4 simulados curtos** (1 por área) + **5 propostas de redação** com rubrica |
| 60 dias | 80 pacotes + 1 **simulado completo** + 20 propostas + 15 repertórios |
| 90 dias | Cobertura da Matriz do ENEM nos tópicos de alta recorrência; começar FUVEST/UNICAMP |

---

## 6. Fases

| Fase | Quando | Entrega |
|---|---|---|
| **0 · Fundação** | Semana 1 | Lista de tópicos por matéria×série (Study) e por área (Vestibular) cadastrada em `content_topics`; modelo de pacote; checklist; template de pedido à IA |
| **1 · Núcleo** | Semanas 2–5 | Metas de 30 dias (Study: 48 pacotes · Vestibular: 32 pacotes + redação inicial) |
| **2 · Escala** | Semanas 6–13 | Metas de 60 e 90 dias; simulados completos; flashcards |
| **3 · Qualidade contínua** | Sempre | Revisar questões ruins; atualizar com provas novas; novos vestibulares |

---

## 7. Rotina semanal sugerida (fundador estudante)

| Dia | Bloco | O que fazer | Tempo |
|---|---|---|---|
| Seg/Ter | **Geração** | Escolher 8 tópicos da semana; gerar resumo + quiz com a IA | 2 h |
| Qui/Sex | **Revisão e publicação** | Conferir contas e gabaritos; ajustar; publicar | 2 h |
| Dom | **Medição** | Ver uso: quais pacotes foram abertos, taxa de acerto por questão | 30 min |

Sinal de questão ruim para revisar: **acerto acima de 95%** (fácil demais), **abaixo de 15%** (provável erro de gabarito ou enunciado confuso) ou muita gente marcando a mesma errada.

---

## 8. O que posso construir no código para acelerar

- [ ] **Semente de tópicos** (SQL) com a taxonomia da seção 4 e 5 em `content_topics` (matéria, série, ordem).
- [ ] **"Gerar pacote do tópico" em um clique** no painel: cria resumo + quiz como rascunho, já ligados ao tópico e à série.
- [ ] **Painel de cobertura** (matéria × tópico: tem resumo? quiz? simulado? publicado?), como as tabelas das seções 4.2 e 5.
- [ ] **Estado de revisão** (rascunho → revisado → publicado) e quem revisou.
- [ ] **Botão "reportar erro" na questão** para o aluno avisar de gabarito errado.
- [ ] **Importação em lote** (planilha) de questões revisadas.
- [ ] **Correção de redação por competência** com a rubrica da seção 5.3.

---

## 9. Riscos e cuidados

| Risco | O que fazer |
|---|---|
| IA erra gabarito ou conta | Revisão obrigatória; tudo com `[CONFERIR]` verificado; começar por conteúdo que você domina |
| Direitos autorais | Conteúdo autoral; provas oficiais só com licença; citar fontes de dados |
| Conteúdo desalinhado com a escola | Usar o plano de ensino do professor como fonte única no gerador |
| Misturar Study com Vestibular | Manter o `context` correto em cada recurso |
| Excesso de quantidade, pouca qualidade | Cumprir o checklist; cortar tópicos antes de cortar a revisão |
| Menores de idade | Linguagem adequada; nada de conteúdo sensível sem contexto pedagógico |

---

## 10. Próximos passos (esta semana)
1. [ ] Pedir ao colégio piloto o **plano de ensino** das matérias-chave.
2. [ ] Escolher os **6 primeiros tópicos de Matemática** (Study) e os **8 de Matemática do ENEM** (Vestibular).
3. [ ] Gerar e revisar os **2 primeiros pacotes** como teste do processo; cronometrar o tempo real.
4. [ ] Decidir quais itens da seção 8 construir primeiro.
