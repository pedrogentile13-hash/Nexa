# Nexa — Roadmap

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
