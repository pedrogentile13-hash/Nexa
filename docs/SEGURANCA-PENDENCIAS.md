# Segurança — pendências e pontos de atenção

Registro vivo. Cada varredura acrescenta uma seção no fim. Marque `[x]` quando resolver.

Legenda de risco: **Alto** (corrigir antes de crescer) · **Médio** · **Baixo** · **Info** (só saber).

---

## Varredura 1 — 2026-11-02 (revisão de código, sem testar o site no ar)

**Resultado:** nenhuma falha crítica. Sem segredos no código nem no histórico do git.
92 tabelas com RLS; funções `security definer` com `search_path` fixo; rotas de API com login;
webhook da Stripe com assinatura; uploads limitados (PDF/imagem, 6 MB).

### Pendências

- [ ] **P1 · Médio — chave que cifra as senhas das contas de escola**
  - **O quê:** `src/features/school-accounts/lib/secret.ts` usa `SCHOOL_PASSWORD_KEY` e, se ela
    não existir, usa `SUPABASE_SERVICE_ROLE_KEY`. Se a chave de serviço vazar, as senhas cifradas
    ficam expostas junto.
  - **ATENÇÃO — não troque a chave "no escuro":** definir `SCHOOL_PASSWORD_KEY` hoje muda a chave
    de cifragem e as senhas **já guardadas** deixam de abrir (`openPassword` devolve `null`).
  - **Como resolver certo:** (1) criar a migração para reencriptar: ler cada senha com a chave
    antiga, gravar com a nova (script de uma vez, no servidor); (2) só então definir
    `SCHOOL_PASSWORD_KEY` na Hostinger; (3) guardar a frase em local seguro (se perder, as senhas
    cifradas não voltam). Alternativa sem migração: aceitar o risco enquanto não houver escolas
    pagantes e fazer a troca quando houver poucas contas.
  - **Quem faz:** código (script de reencriptação) = eu; variável na Hostinger = você.

- [ ] **P2 · Baixo — CSP só em modo "relatar"**
  - **O quê:** `next.config.ts` envia `Content-Security-Policy-Report-Only`; a política estrita não
    bloqueia nada ainda.
  - **Resolver:** olhar os relatórios por alguns dias; se não houver violação legítima, trocar para
    `Content-Security-Policy` (ativa). Cuidado com AdSense, Analytics e Stripe (precisam estar na lista).

- [ ] **P3 · Baixo — sem limite de pedidos por minuto nas rotas de IA**
  - **O quê:** `/api/nexa-ia/stream` e `/api/staff-ia/stream` só têm a cota por plano.
  - **Resolver:** adicionar limite por usuário/minuto (ex.: 20/min) se notar abuso. Hoje o custo é
    limitado pela cota diária.

- [ ] **P4 · Baixo — `npm audit`: postcss (1 alta, 1 moderada) dentro do Next 15**
  - **O quê:** vulnerabilidades de leitura de arquivos via `sourceMappingURL` no PostCSS. É
    ferramenta de build; não processa dados de usuários.
  - **Resolver:** atualizar para o Next 16 quando estiver estável (mudança grande; testar tudo).
    Não use `npm audit fix --force` às cegas.

- [ ] **P5 · Info — limite de upload das ações do servidor em 14 MB**
  - **O quê:** `serverActions.bodySizeLimit = '14mb'` em `next.config.ts`; os uploads de redação e
    chat já recusam acima de 6 MB.
  - **Resolver (opcional):** reduzir para 8 MB.

### Ainda não testado (precisa do site no ar e de contas de teste)

- [ ] Abrir dados de outra escola/usuário trocando o id na URL (esperado: negado).
- [ ] Aluno tentando abrir `/escola` e `/admin`; conta de escola tentando abrir o Vestibular.
- [ ] Supabase → Authentication → **Rate limits** (login, e-mail, código de 6 dígitos).
- [ ] Supabase → **Advisors → Security** (tabelas sem RLS, funções expostas).
- [ ] **securityheaders.com**, **SSL Labs** e **Mozilla Observatory** com `nexastudy.com.br`.
- [ ] Webhook da Stripe: chamada sem assinatura deve ser recusada (já coberto por teste unitário).
- [ ] GitHub → Security: ligar **Dependabot** e **Secret scanning**.

---

<!-- Próximas varreduras: acrescentar abaixo, no mesmo formato (P6, P7…). -->
