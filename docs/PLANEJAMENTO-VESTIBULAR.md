# Planejamento — Nexa Vestibular (provas, simulados e IA)

Documento vivo. Marque `[x]` ao concluir. Itens marcados **(confirmar)** dependem de conferir o edital atual da banca.

## 1. Objetivo
Quem se prepara para ENEM, Fuvest, Unicamp e Unesp precisa de quatro coisas no mesmo lugar:
1. **Provas reais** (caderno e gabarito oficiais).
2. **Simulados completos** no formato de cada banca, com cronômetro.
3. **Simulados próprios**, criados com IA "no estilo" da banca e revisados por uma pessoa.
4. **Questões ricas**: texto-base longo, imagem, gráfico e tabela (é o que mais cai nessas provas).

## 2. O que já existe
| Peça | Estado |
|---|---|
| Banco de provas com capa, ano e edição; caderno e gabarito **abrem dentro do app** (PDF) | ✅ ENEM 2025 carregado |
| 60 temas oficiais de redação (ENEM, Fuvest, Unicamp, Unesp) e corretor de redação com IA por competência | ✅ |
| Treino de questões (sessões por matéria, dificuldade e prova), erros e revisões | ✅ |
| Motor de simulado v2: seções, tempo, modo prova, **recursos por questão** (texto longo, imagem, gráfico de barras/linhas/pizza, tabela) | ✅ (importação por código JSON e gerador de rascunho com IA no Admin) |
| Plano de estudo até a prova | ✅ |
| Gabaritos e cadernos de outros anos, Fuvest, Unicamp, Unesp | ⬜ só ENEM 2025 |
| Simulado completo no formato da banca (blocos, tempo oficial) | ⬜ |
| **Cartão-resposta digital** (marcar o caderno oficial e corrigir) | ⬜ |
| Simulados próprios por banca, em série | ⬜ |
| Banco de imagens e gráficos autorais | ⬜ |
| Trilhas por matéria e por banca | ⬜ |

## 3. Formatos das provas (confirmar nos editais)
| Banca | Estrutura usada como referência |
|---|---|
| **ENEM** | 2 dias. Dia 1: Linguagens e Humanas (90 questões) + Redação. Dia 2: Natureza e Matemática (90 questões). Cinco alternativas. Correção por TRI. |
| **Fuvest** | 1ª fase: 90 questões de múltipla escolha, cerca de 5 h. 2ª fase: discursivas (Português e Redação; conhecimentos específicos). |
| **Unicamp** | 1ª fase: 72 questões, cerca de 5 h. 2ª fase: discursiva, em dois dias. |
| **Unesp** | 1ª fase: 90 questões. 2ª fase: discursiva. |

## 4. Fases

### Fase A. Provas reais completas (rápida)
- [ ] Cadernos e gabaritos: ENEM 2017–2024, Fuvest, Unicamp e Unesp recentes (só **links oficiais** das bancas; o leitor já abre na página).
- [ ] Ficha de cada edição: ano, aplicação, cor do caderno, link do gabarito.
- **Você faz:** juntar os endereços oficiais (INEP, Fuvest, Comvest, Vunesp). **Eu faço:** o SQL de cadastro e a tela.

### Fase B. Cartão-resposta digital (valor alto, risco baixo)
O aluno faz a prova no **PDF oficial** e marca as respostas no app; o app corrige com o **gabarito oficial** e mostra acertos por matéria.
- [ ] Gabarito digitado por edição: número da questão, alternativa correta, área e se foi anulada.
- [ ] Tela de marcação (grade de bolinhas, uma por questão) com cronômetro opcional.
- [ ] Resultado por área e por assunto, com **nota estimada** (aviso claro: o ENEM usa TRI, o app só aproxima).
- [ ] As questões erradas entram na revisão.
- **Por que primeiro:** não copia as questões da banca (só o gabarito, que é público), então evita problema de direitos.

### Fase C. Simulados próprios no estilo da banca
Pipeline (IA rascunha, humano publica):
1. Escolher banca, área, assunto e nível.
2. A IA gera o **texto-base** (original), o **recurso** (gráfico, tabela ou imagem) e a questão com 5 alternativas e explicação.
3. Checagem automática: uma só correta, alternativas distintas, conta conferida por uma segunda passada da IA sem ver o gabarito.
4. Revisão humana no Admin e publicação.
- **Estilo ENEM:** situação-problema, texto-base longo, interdisciplinaridade, habilidades da Matriz de Referência.
- **Estilo Fuvest/Unicamp/Unesp:** mais conteudista, enunciado direto, nível mais alto, às vezes com imagem ou mapa.
- Composição de um simulado completo: 45 questões por área (ENEM), com tempo da banca.
- [ ] Biblioteca de **prompts por banca** (texto pronto no Admin).
- [ ] Meta inicial: 4 simulados curtos (1 por área) por banca, depois completos.

### Fase D. Questões ricas (imagem, gráfico, texto longo)
O motor já suporta; falta **produção e experiência**:
- [ ] Gráficos e tabelas **autorais** (gerados por código, com dados inventados e coerentes).
- [ ] Imagens e esquemas autorais em SVG (leves, nítidos no celular, com texto alternativo).
- [ ] Leitura confortável de textos longos no celular (recolher e expandir, fonte, zoom da imagem).
- [ ] Zoom e tela cheia em gráficos e mapas.

### Fase E. Trilhas e plano por banca
- [ ] Trilha por matéria (do básico ao nível da prova) usando os pacotes do Study.
- [ ] Trilha por banca (o que mais cai na Fuvest, no ENEM etc.).
- [ ] Cronograma até a data da prova, com revisão espaçada.

### Fase F. Desempenho e IA
- [ ] Desempenho por habilidade e assunto, e "o que estudar hoje".
- [ ] Correção de redação refinada por banca (já existe a base).
- [ ] Tutor de IA que explica a questão errada passo a passo.

## 5. Direitos autorais e cuidado com as provas
- Prova oficial: **link para o site da banca** e leitura dentro do app (como já é feito). Não copiar o texto das questões para o banco sem confirmar a licença.
- Gabarito (lista de letras) e metadados são factuais: podem ser digitados.
- Simulados próprios: 100% originais, "no estilo de".
- Todo conteúdo de IA passa por revisão antes de publicar.

## 6. Ordem sugerida
1. **Fase B** (cartão-resposta), porque entrega o simulado real sem produzir questões.
2. **Fase A** em paralelo (mais provas para o cartão-resposta).
3. **Fase C e D** (simulados próprios com recursos ricos).
4. **Fase E e F**.

## 7. Divisão de trabalho
- **Eu:** modelo de dados, telas, importadores, gerador de rascunho, testes.
- **Você:** endereços oficiais e gabaritos, revisão do conteúdo gerado, decisão do que publicar.
