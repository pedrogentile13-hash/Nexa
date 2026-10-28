# Nexa — Roadmap

## Prioridades definidas (28/10)

1. **Aprimorar a IA** (frente 1 abaixo)
2. **Chat da escola com bot por professor** — a maior inovação
3. **Eventos exclusivos de escolas; comunidades livres**
4. **Painel escolar**: direção > coordenação > professores
5. **Planejamento do professor alimenta a IA** → resumos e simulados automáticos de alta qualidade

### Como se encaixam (ordem de dependência)

```
 Papéis e hierarquia da escola ──┬──► Painel escolar (4)
 (direção/coordenação/professor) ├──► Eventos só de escola (3)
                                 ├──► Chat + bot por professor (2)
                                 └──► Planejamento do professor (5) ──► IA gera resumo/simulado (5)
 Limite de uso + custo da IA ──────────► tudo que usa IA (1, 2, 5)
```

**Primeiro tijolo comum:** a hierarquia de papéis. Hoje existem `student`, `teacher_admin`,
`school_admin` e `admin`. Faltam pelo menos **direção** e **coordenação** como níveis
distintos (a coordenação vê o professor; o professor não vê a coordenação). Sem isso, painel,
eventos e chat não têm como saber quem pode o quê.

### 2 · Chat da escola com bot por professor

**Ideia:** cada professor tem um assistente que responde as dúvidas repetitivas da turma
("quando é a entrega?", "o que cai na prova?", "qual o material?").

**Regra de ouro: o bot só afirma o que o professor cadastrou.** Datas e regras vêm de
uma base do professor (*"Base de respostas"*): perguntas e respostas prontas, mais os
eventos/tarefas do calendário da turma. A IA só serve para *entender a pergunta do aluno*
e achar a resposta certa; ela **não improvisa** data, nota ou regra.

| Situação | O que o bot faz |
|---|---|
| Pergunta bate com uma resposta pronta | responde, mostrando "resposta do Prof. X" |
| Pergunta é sobre data/tarefa e existe no calendário | responde com o dado do calendário, citando a fonte |
| Não sabe ou confiança baixa | diz "não tenho essa informação" e **encaminha ao professor** (fila de dúvidas) |
| Pergunta de conteúdo da matéria | responde como tutor (modo "Explicar"), marcada como **resposta da IA** |
| Assunto sensível (saúde, bullying, nota individual) | não responde; encaminha à coordenação |

- O professor vê **o que os alunos perguntam** e o que o bot não soube responder → vira a lista do que precisa ser cadastrado.
- Cada resposta tem 👍/👎; resposta ruim some da base automática até o professor revisar.
- **Cuidado jurídico:** chat é entre turma e bot/professor, **sem mensagem privada de adulto com menor**. Mensagens ficam registradas e visíveis à coordenação. Horário de silêncio configurável.
- Dúvida frequente: **100% determinística primeiro** (palavras-chave/embeddings contra a base) e IA só como apoio — barato, previsível e não alucina.

### 3 · Eventos: só escola cria; comunidades continuam livres
- Tabela de eventos com `school_id`; **criar** exige papel de escola (coordenação/direção; professor para o que é da própria turma). Aluno só **vê e confirma presença**.
- Comunidades continuam abertas, mas **sem poder de criar evento oficial** (podem ter encontros/avisos próprios, rotulados como "não oficial").
- Evento oficial aparece no calendário da agenda e dispara aviso push à turma/série certa.
- Ajuste necessário: revisar o que a comunidade faz hoje com "evento" para não misturar os dois.

### 4 · Painel escolar (direção > coordenação > professores)
| Quem | Vê | Faz |
|---|---|---|
| **Direção** | indicadores da escola toda: engajamento, turmas em risco, uso por professor | cria eventos/avisos gerais, gerencia coordenações |
| **Coordenação** | séries/turmas sob ela; professores; dúvidas sem resposta; eventos | cria eventos, aprova avisos, vê relatórios por turma |
| **Professor** | só as próprias turmas e matérias | calendário, base do bot, planejamento, simulados, resumos |

- Tudo escopado por RLS à escola (e à turma, no caso do professor). Nenhum nível enxerga nota **individual** de aluno fora de quem tem esse direito.
- **Aprimoramento do professor:** painel de "o que a turma mais errou", sugestões de reforço e atividades geradas pela IA, com tempo economizado visível.

### 5 · Planejamento do professor → IA (resumos e simulados de alta qualidade)
**Fluxo:**
1. O professor cadastra o **planejamento**: conteúdo por bimestre/aula, objetivos, material de referência (PDF/slides/texto), nível, estilo de cobrança.
2. A IA recebe **esse material como fonte** (não o conhecimento genérico) e gera resumo, flashcards ou simulado **"no estilo do professor"**.
3. O professor **revisa e aprova** antes de publicar para a turma (nada vai ao aluno sem aprovação; selo "revisado pelo professor").

**Qualidade — onde isso costuma falhar e como evitar:**
- Gerar *a partir do material do professor* (citando trecho-fonte), não de memória do modelo → menos erro e mais fidelidade.
- Simulado: 1 resposta certa verificável pela fonte, explicação de cada alternativa, nível de dificuldade declarado, e checagem automática de formato (já existe o validador `parseSimuladoCode`).
- "Treinamento do professor": na prática **não é treinar o modelo**, é dar a ele contexto (planejamento, exemplos de questões que o professor aprovou/rejeitou, seu vocabulário). Cada aprovação/rejeição melhora os exemplos usados depois. Barato e sem retreino.
- Direitos autorais: o material subido é do professor/escola; termo de uso deve dizer isso.

### Ordem sugerida de construção
1. **Papéis e hierarquia** + tabela de eventos escolares + RLS (base de tudo).
2. **Painel do professor** (calendário e base de respostas) e **bot por professor** (começar sem IA, só base + busca; IA depois).
3. **Painel da coordenação/direção** e eventos oficiais com aviso.
4. **Planejamento → IA** (resumo primeiro, simulado depois).
5. **Limite de uso, custo e 👍/👎** entram junto desde o passo 2, não depois.

---


Quatro frentes, em ordem de dependência. O que está marcado **(a confirmar)**
é suposição minha e precisa de uma resposta antes de virar tarefa.

---

## 1. Melhorar a IA

**Já está no ar:** NexaAI Tutor com 4 modos (explicar, me guie, me desafie, só a dica),
contexto de notas/assuntos fracos/jornada, e "Explicar com IA" no leitor de resumo.

### Ordem de construção
| # | Recurso | Depende de | Migration |
|---|---|---|---|
| 1 | **Caderno de erros inteligente** — cada questão errada vira entrada; a IA diz *por que* errou (conceito, distração, interpretação) e gera mini-simulado só do que o aluno erra | tabelas de desempenho (já existem) | sim |
| 2 | **Corretor de redação** (5 competências ENEM, 0–200) com evolução ao longo do tempo e "erro que mais se repete" | — | sim |
| 3 | **Cronograma adaptativo** — data da prova + horas por dia → plano que se reorganiza quando o aluno falta ou erra | desempenho, agenda | sim |
| 4 | **Tira-dúvida por foto** (Gemini aceita imagem) + 2 questões parecidas | consentimento LGPD obrigatório | não |
| 5 | **Resumo/flashcards/quiz a partir de PDF do aluno** (+ áudio) | — | talvez |
| 6 | **Painel do professor com IA** — "quem está em risco em Matemática?" | Nexa Escolas (frente 3) | não |

### Infraestrutura que precisa vir junto (antes de abrir para mais gente)
- **Limite de uso por aluno/dia** e tabela `ai_usage` (quem, qual recurso, tokens, custo). Hoje não há teto: um aluno pode gastar a cota inteira.
- **👍/👎 em cada resposta** — é o único jeito de saber se o tutor está ajudando.
- **Modelo por tarefa**: modelo barato para explicar trecho, melhor para redação.
- **Cache** de explicações repetidas do mesmo trecho de resumo.
- **Guardrails para menores**: filtro de conteúdo, não repetir dados pessoais (já no prompt), aviso claro de que o texto vai ao Google.
- **Fallback já existe** (lista de modelos em `GEMINI_MODEL`); falta alerta quando o principal falha muito.

---

## 2. Comunidade — resolver a comunicação da escola

**Problema (a confirmar):** ainda não sei o que exatamente falha na comunicação da sua escola.
Minha hipótese: avisos oficiais (provas, trabalhos, mudanças de horário) se perdem em grupos
de WhatsApp, e o aluno não sabe o que é oficial nem o que já foi dito. Se for outra coisa, o desenho muda.

### Base que já existe
`communities`, `community_members`, moderação, notificações, agenda.

### Proposta
1. **Mural de avisos oficiais** por escola → série → turma, só professor/coordenação publica, com **confirmação de leitura** ("12 de 30 viram") e notificação push.
2. **Calendário único** de provas/trabalhos/eventos alimentado pelos avisos (a agenda já existe).
3. **Dúvidas por matéria** com resposta do professor ou da IA (marcada como "resposta da IA") — o histórico fica pesquisável, então a mesma dúvida não se repete 30 vezes.
4. **Canal professor ↔ turma** (só texto, horário de silêncio configurável, sem mensagem privada com menor — risco jurídico).
5. **Representante de turma**: papel que pode pedir aviso/avisar a turma, com aprovação do professor.
6. **Moderação**: reaproveitar a que existe + relatório para coordenação.

**Ponto de decisão:** a comunidade é *aberta* (alunos de escolas diferentes) ou *fechada por escola*?
Recomendo **fechada por escola** para o Anglo (RLS por `school_id`), e a aberta só no Nexa Vestibular.

---

## 3. Estruturar Nexa Escolas e Nexa Vestibular

Mesmo núcleo (conta, IA, estudar, desempenho), duas "caras". A jornada já é escolhida no cadastro
(`profiles.journey`: `school` | `vestibular` | `both`).

| | **Nexa Escolas** | **Nexa Vestibular** |
|---|---|---|
| Quem usa | aluno, professor, coordenação | vestibulando, autodidata |
| Organização | escola → turma → matéria | curso-alvo → provas → matérias cobradas |
| Cobrança | contrato com a escola (por aluno/ano) | assinatura individual **(a confirmar)** |
| Foco | boletim, avisos, agenda, turma | simulados ENEM/FUVEST, redação, cronograma até a prova |
| IA | tutor do conteúdo da série | redação, plano até a prova, caderno de erros |
| Comunidade | fechada por escola | aberta, por curso/prova |
| Métrica de sucesso | % de alunos ativos por turma | horas estudadas e evolução em simulados |

### Tarefas
- Separar **feature flags por jornada** (hoje a navegação já diverge; falta o resto: o que aparece em Perfil, Início, notificações).
- Vestibular: **meta por curso/nota de corte**, contagem regressiva, banco de simulados por prova.
- Escolas: **papéis claros** — aluno, professor (`teacher_admin`), coordenação (`school_admin`), admin da plataforma — e telas próprias para cada um.
- Definir o que é **gratuito** em cada lado para o piloto.

---

## 4. Plano de implantação — Colégio Anglo Morumbi

**Objetivo:** o Anglo usa o Nexa como "sistema da escola", com marca, login e cadastro próprios.

### Arquitetura recomendada
> Desenho técnico detalhado (subdomínio, tema, convites, RLS, infra, estimativas): **[`PLANO-ANGLO.md`](./PLANO-ANGLO.md)**.

Não criar um sistema separado. Usar **um Nexa multi-escola**, onde o Anglo é um *tenant*:
- Já temos `schools` e `school_id` em perfis, professores e conteúdo. A base para isolar por escola (RLS) existe.
- **Subdomínio com a marca**: `anglo.nexastudy.com.br` — logo, cores e nome da escola; o resto é o mesmo código.
- **Login e cadastro próprios** (a escolha entre estas depende de uma resposta da escola):
  - **Cadastro por convite**: a secretaria sobe uma planilha (nome, turma, matrícula, e-mail do responsável) e o sistema gera convite/código por turma. O aluno não escolhe "escola" — já entra vinculado.
  - **E-mail institucional** (se a escola usa Google Workspace): login com Google restrito ao domínio da escola.
  - **Responsável**: conta ou aprovação por e-mail, obrigatória para menores de 18.
- Por que não deploy/banco separado: dobra custo e manutenção, e cada correção teria que ser feita duas vezes. Só se justifica se a escola exigir isolamento físico por contrato.

### Fases
| Fase | Duração (estimativa) | O que acontece | Saída |
|---|---|---|---|
| **0 · Descoberta e aprovação** | 2–3 sem | reunião com direção/TI/coordenação; levantar o problema real de comunicação; definir quem assina; DPO/jurídico da escola | escopo escrito + aceite |
| **1 · Fundação do tenant** | 3–4 sem | subdomínio e tema, cadastro por convite/planilha, papéis (aluno/professor/coordenação), RLS por escola testada, consentimento LGPD obrigatório | ambiente do Anglo funcionando em staging |
| **2 · Comunicação** | 3–4 sem | mural de avisos com confirmação de leitura, calendário, dúvidas por matéria | o problema levantado na fase 0 resolvido no piloto |
| **3 · Piloto controlado** | 4–6 sem | 1 série ou 2 turmas, 3–5 professores; suporte direto | métricas (abaixo) e feedback |
| **4 · Expansão** | contínuo | demais séries, painel do professor com IA, relatório para coordenação | go/no-go por série |

### Métricas do piloto
- % de alunos que entram no app ao menos 3×/semana
- % de avisos lidos em 24h
- Quantidade de dúvidas respondidas (e % pela IA vs. professor)
- Nota de utilidade do tutor (👍/👎)
- Tickets de suporte por semana

### Pré-requisitos jurídicos e de segurança (não pulam)
- **Contrato** definindo escola como controladora e o Nexa como operador; DPA anexo.
- **Consentimento do responsável** para menores — o app já registra versão do documento e data; falta torná-lo obrigatório.
- **Aviso de que a IA envia texto ao Google** (e política de retenção).
- **Backups** do Supabase e plano de restauração; hoje o app roda em hospedagem compartilhada — para uma escola inteira, avaliar plano com mais folga.
- **Monitoramento** e canal de suporte com horário combinado.

### Riscos
| Risco | Mitigação |
|---|---|
| Escola exige SSO/integração com sistema acadêmico existente | descobrir na fase 0; começar só com planilha |
| Professores não adotam | começar pelos 3–5 que já querem; treino de 30 min; avisos só pelo Nexa durante o piloto |
| Custo de IA estoura | limite por aluno/dia + `ai_usage` antes da fase 3 |
| Vazamento entre escolas | teste automático de RLS por escola (já temos testes SQL; ampliar) |
| Fundador estudante vs. contrato com escola | definir CNPJ/MEI ou responsável legal antes de assinar |

---

## Perguntas em aberto
1. **Qual é exatamente o problema de comunicação** na sua escola? (aviso perdido, professor sem canal, dúvida sem resposta, pais sem informação…)
2. Com quem no Anglo você já conversou? Há **apoio da direção/coordenação** ou isso ainda é só ideia?
3. A escola usa **Google Workspace** ou outro sistema (ex.: Sponte, Arco) para matrícula/notas?
4. Quem seria o **responsável legal** pelo Nexa no contrato (você é menor de idade?)
5. Nexa Vestibular será **pago** individualmente, ou grátis no piloto?
