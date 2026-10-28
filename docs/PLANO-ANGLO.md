# Plano técnico — `anglo.nexastudy.com.br`

> Complementa a frente 4 do [`ROADMAP.md`](./ROADMAP.md). É um **plano para discutir**:
> nenhuma linha de código foi escrita. Itens marcados **(verificar)** dependem de algo
> que não consegui confirmar daqui (Hostinger, Supabase, a escola).

> **Atualização (28/10):** o subdomínio `anglomorumbi.nexastudy.com.br` já chega ao app Nexa
> (a Hostinger o entrega com o nome original no cabeçalho `Host`), então o **Cloudflare não é
> necessário agora**. O app lê o `Host` direto. O suporte a proxy (cabeçalho + segredo) ficou
> pronto no código para quando houver muitas escolas. Cada nova escola ainda exige cadastrar o
> subdomínio na Hostinger (manual) — é o limite desta fase.
> Variável: `TENANT_ROOT_DOMAIN=nexastudy.com.br`. Implementado: `src/lib/tenant/*`, migration
> `20261003000200_escola_dominio.sql`, tela de entrada com a marca da escola.

## A ideia em uma frase

Um único Nexa, vários endereços. Quem entra por `anglo.nexastudy.com.br` vê a marca do
Anglo, cadastra-se por convite da escola e só enxerga dados do Anglo. Quem entra por
`nexastudy.com.br` continua com o Nexa de sempre.

```
anglo.nexastudy.com.br ─┐
colegio-x.nexastudy…  ──┼──► mesmo app Next.js ──► mesmo Supabase (RLS por school_id)
nexastudy.com.br      ──┘        │
                                 └─ middleware: Host → qual escola? → tema + regras de cadastro
```

## O que já existe e o que falta

| Peça | Hoje | Falta |
|---|---|---|
| Entidade escola | `schools`, `profiles.school_id`, `teacher_assignments`, turmas (`class_id`) | — |
| Papéis | `student`, `teacher_admin`, `school_admin`, `admin` | papel de **responsável** (parent) |
| Isolamento | RLS usa papel/escola em várias tabelas | **auditar todas** e testar vazamento entre escolas |
| Marca | cores/logo fixos (`--brand` etc. em `globals.css`) | tema por escola (variáveis CSS vindas do banco) |
| Endereço | um único host (`NEXT_PUBLIC_SITE_URL` fixo) | resolver escola pelo `Host`; URLs de e-mail/redirect por host |
| Cadastro | aberto: aluno escolhe a escola | **cadastro por convite/matrícula** que já vincula escola+turma |
| PWA/APK | manifest e ícones fixos | manifest dinâmico por host; APK próprio do Anglo (opcional) |

## Desenho

### 1. Resolver a escola pelo endereço
- Nova tabela `school_domains (host text pk, school_id uuid, active bool)` — ex.: `anglo.nexastudy.com.br → <id do Anglo>`.
- No `middleware.ts` (que já roda em toda requisição): ler `Host`, consultar `school_domains` (com cache em memória de ~60 s para não somar uma ida ao banco a cada clique) e passar o resultado adiante por **header interno** (`x-nexa-school`).
- Subdomínios **reservados** (`www`, `admin`, `api`, `app`, `mail`…) nunca viram escola.
- Host desconhecido → página "escola não encontrada", **não** cai no Nexa geral (evita um typo parecer outro produto).
- **Desenvolvimento local:** `anglo.localhost:3000` (funciona sem mexer no `hosts`).

### 2. Marca (tema por escola)
- Nova tabela `school_branding (school_id pk, display_name, logo_url, brand, brand_text, brand_soft, …)`.
- O layout raiz lê a escola do header e injeta as variáveis CSS (`--brand`, `--brand-soft`…) no `<html>`. O app inteiro já usa essas variáveis, então **não é preciso reescrever telas**.
- **Contraste obrigatório:** o código valida a cor escolhida (mínimo 4,5:1 para texto) e cai para um tom seguro se falhar — o app já foi ajustado para acessibilidade e uma cor ruim da escola não pode desfazer isso.
- Nome e logo no cabeçalho, tela de login, e-mails e splash.

### 3. Cadastro e login próprios
Duas formas; dá para ter as duas:

**A. Convite por planilha (recomendada para começar)**
1. Secretaria sobe CSV: `nome, matrícula, turma, e-mail do responsável`.
2. Tabela `school_roster` guarda cada linha com um **código de convite** (ex.: `ANG-7K4M-2Q`) e `claimed_by` (nulo até ser usado).
3. O aluno acessa `anglo.…/entrar`, digita o código, cria senha. Uma função `security definer` (`claim_invite`) faz tudo de uma vez: cria o vínculo `school_id`, turma e papel — **o aluno nunca escolhe a escola**, então não dá para entrar numa escola alheia.
4. Menores de 18: o responsável recebe o e-mail e aprova (reaproveita o consentimento LGPD que já existe).

**B. Google Workspace da escola** *(verificar se o Anglo usa)*
- Login com Google restrito ao domínio institucional; matrícula pelo e-mail. Mais simples para o aluno, depende de configuração pela TI da escola.

Cadastro aberto (`nexastudy.com.br`) **não funciona** em host de escola: ali só entra quem tem convite.

### 4. Impedir mistura entre escolas
- Sessão em `anglo.…` de um usuário cujo `school_id` ≠ Anglo → desloga e avisa. (Cookies do Supabase são **por host**, então uma sessão em `anglo.…` não vale em `nexastudy.com.br` — isso é bom: isolamento por padrão. Não compartilhar cookie em `.nexastudy.com.br`.)
- **Auditoria de RLS:** listar todas as tabelas com dado de aluno e conferir que a política restringe por escola. Para cada uma, um teste SQL "aluno da escola A não lê nada da B" (a suíte `supabase/tests` já tem o padrão).
- Admin da plataforma enxerga tudo; `school_admin` só a própria escola.

### 5. URLs, e-mail e redirecionamentos
- `NEXT_PUBLIC_SITE_URL` fixo hoje serve de base para links de confirmação e recuperação de senha. Precisa passar a **derivar do host da requisição** (validado contra `school_domains`, para não aceitar `Host` forjado).
- Supabase → Auth → Redirect URLs: permitir `https://*.nexastudy.com.br/**` **(verificar suporte a curinga no plano atual)**.
- E-mails de confirmação saem com o remetente/modelo global do Nexa. Personalizar por escola exige e-mail transacional próprio — ficar com o texto genérico no piloto.

### 6. App instalado (PWA / APK)
- `manifest.webmanifest` vira **dinâmico por host**: nome, ícone e `start_url` do Anglo.
- Opcional: APK separado do Anglo no PWABuilder apontando para `anglo.nexastudy.com.br` (com o ícone da escola) — pode virar "o app do Anglo" na Play Store, em conta de desenvolvedor da escola ou sua.

### 7. Infraestrutura (a parte mais incerta)
- **DNS:** registro curinga `*.nexastudy.com.br` apontando para o mesmo servidor, ou um registro por escola.
- **HTTPS:** cada subdomínio precisa de certificado. Certificado curinga costuma exigir DNS gerenciado em um provedor que o emita automaticamente.
- **Hostinger (verificar):** se o plano atual aceita subdomínios curinga/aliases para o mesmo app Node e emite SSL para cada um. Se não aceitar, as saídas são (a) cadastrar `anglo` manualmente como subdomínio na Hostinger apontando ao mesmo app — funciona para poucas escolas — ou (b) colocar um proxy na frente (ex.: Cloudflare, plano gratuito) que dá curinga e SSL, mantendo a Hostinger por trás.
- Isso deve ser descoberto **primeiro** (dia 1), porque decide se o resto é "só código" ou envolve mudar hospedagem.

## Tarefas e tamanho (dedicação parcial, 1 pessoa + IA)

| # | Tarefa | Estimativa |
|---|---|---|
| 0 | **Spike de infra:** subdomínio de teste na Hostinger com HTTPS e o mesmo app | 0,5–1 dia |
| 1 | Tabelas `school_domains`, `school_branding`, `school_roster` + migrations + testes | 1–2 dias |
| 2 | Middleware: resolver host → escola (+ cache, reservados, página de erro) | 1 dia |
| 3 | Tema por escola (injeção de variáveis, validação de contraste, logo/nome) | 1–2 dias |
| 4 | Cadastro por convite (`claim_invite`, tela `/entrar`, e-mail ao responsável) | 2–3 dias |
| 5 | Upload de planilha da secretaria (validação, relatório de linhas com erro) | 2 dias |
| 6 | Auditoria de RLS por escola + testes de vazamento | 2–3 dias |
| 7 | URLs/e-mail derivados do host; ajuste de Redirect URLs | 1 dia |
| 8 | Manifest dinâmico (e APK do Anglo, se quiserem) | 1 dia |
| 9 | Painel da coordenação (ver convites usados, turmas, ativos) | 2–3 dias |
| 10 | Teste ponta a ponta com `smoke.sh` enviando `Host: anglo…` | 0,5 dia |

**Total aproximado: 3–4 semanas de desenvolvimento**, sem contar a aprovação da escola e o
tempo de espera da TI/DNS. A fase de comunicação (mural de avisos) vem depois, sobre essa fundação.

## Riscos específicos

| Risco | O que fazer |
|---|---|
| Hospedagem não suporta curinga/SSL por subdomínio | spike no dia 1; plano B com proxy na frente |
| Esquecer RLS em uma tabela e vazar dado entre escolas | auditoria + teste automático para **toda** tabela nova |
| Cor da escola quebra o contraste | validação automática com fallback |
| Planilha da secretaria com erros (matrícula duplicada, e-mail inválido) | validação linha a linha com relatório, nada é importado pela metade |
| `Host` forjado para gerar link de e-mail malicioso | só aceitar hosts que existem em `school_domains` |
| Dependência de uma pessoa só | documentar o procedimento de "criar nova escola" como script único |

## Procedimento futuro: "onboarding de uma nova escola" (meta)
1. Inserir escola + domínio + branding (um script/painel admin).
2. Criar o registro DNS/subdomínio.
3. Subir a planilha de alunos e professores.
4. Enviar convites.
5. Rodar o teste de isolamento para a nova escola.

A meta é que a **segunda** escola seja questão de horas, não de semanas — é isso que transforma o Anglo num piloto e não num projeto sob medida.

## Decisões para você tomar (quando acordar)
1. **Subdomínio por escola** (`anglo.nexastudy.com.br`) ou domínio próprio da escola depois (`app.angloMorumbi.com.br`)? O desenho aguenta os dois; começar pelo subdomínio.
2. **Cadastro:** só por convite/planilha, ou também Google Workspace da escola?
3. **APK próprio do Anglo** (app na loja com o nome/ícone da escola) agora ou depois do piloto?
4. **Quem hospeda e quem paga** se a escola exigir contrato: continua na sua Hostinger/Supabase pessoal, ou migra para uma conta da empresa?
