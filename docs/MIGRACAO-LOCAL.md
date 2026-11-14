# Migração do desenvolvimento: da nuvem para o computador

Objetivo: trabalhar no Nexa pelo **computador**, enviando pelo **GitHub Desktop**, e a **Hostinger continua publicando sozinha**,
exatamente como hoje. **Nada do que existe hoje é apagado, movido ou renomeado.**

## 1. O que NÃO muda (por isso é seguro)

| Peça                           | Como é hoje                                   | Depois da migração                        |
| ------------------------------ | --------------------------------------------- | ----------------------------------------- |
| Código                         | GitHub `pedrogentile13-hash/Nexa`             | **o mesmo repositório**                   |
| Branch que a Hostinger publica | `claude/nexa-review-architecture-o6q9zu`      | **a mesma** (não renomear, não apagar)    |
| Deploy                         | a Hostinger vê um push nessa branch e publica | **igual**: push pelo GitHub Desktop       |
| Banco                          | Supabase (SQL rodado à mão)                   | **o mesmo**                               |
| Variáveis (chaves)             | painel da Hostinger                           | **ficam lá** (só se copia para uso local) |
| Pagamentos                     | Stripe                                        | **o mesmo**                               |

A migração só muda **onde você digita**: antes era a sessão na nuvem, agora é o seu computador.
O GitHub é a única "ponte". Tudo que foi feito até agora está **enviado ao GitHub** (confirmado: o último commit é
`a6cb885`, idêntico no GitHub e na nuvem; não há nada só na nuvem).

## 2. Regras de ouro (leia antes de tudo)

1. **Nunca renomeie, apague ou recrie** a branch `claude/nexa-review-architecture-o6q9zu`. É ela que a Hostinger observa.
2. **Nunca use "force push"** (push forçado). O GitHub Desktop só oferece isso se você insistir; se pedir, **cancele**.
3. **Sempre "Fetch/Pull origin" antes de começar** a trabalhar. Evita conflito entre computador e nuvem.
4. **Nunca commite chaves.** O arquivo `.env.local` fica só no seu computador (já está no `.gitignore`).
5. **No computador use a chave de TESTE do Stripe**, nunca a de produção.
6. **Um lugar escrevendo por vez.** Se ainda usar a sessão na nuvem, faça pull no computador antes de mexer.
7. **Antes de enviar:** rode `npm run verify` (confere tipos, lint e testes) e `npm run format`.

## 3. Instalar no computador (uma vez só)

1. **GitHub Desktop** (desktop.github.com) e entre com a conta que é dona do repositório.
2. **Node 22 LTS** (nodejs.org). Para conferir: abra o terminal e digite `node -v` (deve mostrar `v22…`).
3. **VS Code** (ou outro editor) — opcional, mas recomendado.
4. No GitHub Desktop: **File → Clone repository → URL** → `https://github.com/pedrogentile13-hash/Nexa` → escolha uma pasta
   **fora** do OneDrive/Dropbox/Google Drive (essas pastas sincronizam `node_modules` e atrapalham).
5. No GitHub Desktop, em **Current Branch**, escolha **`claude/nexa-review-architecture-o6q9zu`** (aba "Remote"/"Remote branches"
   se não aparecer; ele cria a cópia local sozinho). **Não trabalhe na `main`**: ela está desatualizada e a Hostinger não a usa.
6. Botão **Open in Visual Studio Code** (ou abra a pasta no editor). No terminal do editor:

```
npm ci
```

## 4. Chaves (.env.local) — com cuidado

1. Copie `.env.example` para `.env.local` (Windows: `copy .env.example .env.local` · Mac/Linux: `cp .env.example .env.local`).
2. Abra o painel da **Hostinger → Variáveis de ambiente** e copie os valores para o `.env.local`. **Não envie chaves por chat nem e-mail.**
3. O que é essencial para abrir o app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
4. Para as funções de IA: `GEMINI_API_KEY` (e `GEMINI_MODEL`, se usa). Para o painel de escolas: `SUPABASE_SERVICE_ROLE_KEY`.
5. **Stripe local = só chaves de teste** (`sk_test…` ou `rk_test…`). Não copie `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` nem os `STRIPE_PRICE_*` de produção.

> ⚠️ Atenção: com as chaves do Supabase da produção, o app no seu computador **usa o banco real**. O que você criar, apagar
> ou publicar logado acontece de verdade no site. Para experimentos perigosos, crie um segundo projeto Supabase (grátis) só para testes.

Depois rode:

```
node scripts/verificar-ambiente.mjs
```

Ele confere Node, branch, endereço do GitHub, `.env.local` e avisa se algo é perigoso (**nunca mostra os valores das chaves**).

## 5. Rodar e testar

```
npm run dev        # abre em http://localhost:3000
npm run verify     # tipos + lint + testes (rode antes de enviar)
npm run format     # arruma a formatação (o CI confere isso)
```

## 6. Fluxo do dia a dia (GitHub Desktop → Hostinger)

1. **Fetch origin** → se aparecer "Pull origin", clique.
2. Trabalhe no código. Teste com `npm run dev`.
3. `npm run verify`.
4. GitHub Desktop: marque os arquivos, escreva um **resumo** claro do que mudou, clique **Commit to claude/nexa-review-architecture-o6q9zu**.
5. Clique **Push origin**.
6. **A Hostinger detecta o push e publica sozinha.** Espere o deploy terminar no painel e confira o site.
7. Se mexeu no banco: rode o SQL no Supabase (veja o item 8).

> Dica: commits pequenos e frequentes. Cada commit é um ponto de volta.

## 7. Se algo der errado (nada se perde)

- **O deploy quebrou:** no GitHub Desktop → **History** → clique no commit ruim → botão direito → **Revert Changes in Commit** → **Push origin**.
  Isso cria um commit novo que desfaz o anterior (não apaga histórico) e a Hostinger republica a versão boa.
- **Voltar a uma versão específica:** na Hostinger, refaça o deploy do commit anterior, ou use o Revert acima.
- **Ponto de segurança de hoje:** o commit `a6cb885` é o estado completo antes da migração. Para marcá-lo: **History** → botão direito
  no commit `a6cb885` → **Create Tag…** → nome `backup-antes-da-migracao-local` → **Push origin** (envia a etiqueta).
- **Conflito ao fazer pull:** não force nada. O GitHub Desktop mostra os arquivos em conflito; abra no editor, escolha o que fica,
  faça o commit de "merge" e dê push. Na dúvida, **pare e peça ajuda** antes de continuar.
- **Apaguei algo sem querer (ainda sem commit):** GitHub Desktop → botão direito no arquivo → **Discard Changes** só vale para o que
  você quer descartar; para recuperar algo já commitado, use o **History**.

## 8. SQL do banco (continua à mão)

O banco **não** é atualizado pelo deploy. Toda migration nova em `supabase/migrations/` precisa ser rodada no Supabase → **SQL Editor**.
O arquivo `supabase/setup-completo.sql` junta tudo e é **seguro rodar de novo** (gere com `bash scripts/build-setup-sql.sh`; no Windows use o Git Bash).

Migrations recentes (confirme no Supabase que todas foram rodadas):

| Arquivo                                    | Para quê                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `20261109000200_enem_2025_arquivos`        | cadernos e gabaritos do ENEM 2025                                                                                 |
| `20261109000300_billing_alerts`            | alertas de cobrança (Stripe)                                                                                      |
| `20261109000400_escola_com_vestibular`     | Vestibular dentro do Nexa Escolas                                                                                 |
| `20261109000500_biblioteca_series`         | filtro por série na Biblioteca                                                                                    |
| `20261109000600_cartao_resposta`           | cartão-resposta e correção                                                                                        |
| `20261109000700_boletim_por_serie`         | boletim por série                                                                                                 |
| `20261110000100_nexa_coins`                | Nexa Coins + redações-modelo do corretor PRO                                                                      |
| `20261110000200_gabarito_por_caderno`      | gabarito por cor de caderno                                                                                       |
| `20261111000100_provas_oficiais_2018_2026` | links de provas e gabaritos (ENEM, FUVEST, UNICAMP, ITA, IME, UNESP) + gabaritos por caderno do ENEM e da UNICAMP |
| `20261111000200_questoes_discursivas` | questões discursivas com correção por IA (quiz e simulado) |

## 9. O que vive FORA do Git (guarde em lugar seguro, faça backup)

| Item                             | Onde está           | Cuidado                                                                                                          |
| -------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Chaves e segredos                | painel da Hostinger | copie só para `.env.local`; nunca para o GitHub                                                                  |
| `keystore` do app Android        | só com você         | **sem ele não há atualização do app na Play Store.** Faça 2 cópias (pen drive + nuvem privada) e anote as senhas |
| Dados do Supabase                | Supabase            | use _Database → Backups_ (ou exporte) antes de mudanças grandes                                                  |
| Produtos e preços                | Stripe              | os `STRIPE_PRICE_*` ficam na Hostinger                                                                           |
| Domínio e DNS                    | Hostinger/registro  | não mexa durante a migração                                                                                      |
| Histórico das conversas com a IA | sessão na nuvem     | o código e os commits já estão no GitHub; o que importa está em `docs/` e no histórico do Git                    |

## 10. Checklist de aceitação (só considere migrado quando todos estiverem marcados)

- [ ] `node scripts/verificar-ambiente.mjs` sem nenhum **ERRO**
- [ ] `npm run dev` abre o app e o login funciona
- [ ] `npm run verify` passa (tipos, lint, testes)
- [ ] Um commit pequeno de teste (ex.: uma linha neste arquivo) → **Push origin** → a Hostinger publicou sozinha
- [ ] O site continua normal depois do deploy de teste
- [ ] A etiqueta `backup-antes-da-migracao-local` está no GitHub (item 7)
- [ ] A `keystore` e as senhas têm backup
- [ ] Você sabe fazer **Revert** (item 7)

Só depois disso desligue o fluxo antigo. Até lá, a nuvem continua valendo como reserva.
