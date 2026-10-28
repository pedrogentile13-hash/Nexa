# SQL pendente — Nexa

Atualizado em 29/10/2026.

## Como rodar (celular ou computador)

1. Supabase → **SQL Editor**.
2. Cole **o conteúdo inteiro** de [`supabase/pendente-agora.sql`](../supabase/pendente-agora.sql) e rode **uma vez**.
3. Pode rodar de novo com segurança: o arquivo foi testado partindo do estado do banco **depois da migration 10**
   (primeira aplicação sem erro, e repetição sem erro). Para regenerar o arquivo: `scripts/build-pendente.sh`.

> Se aparecer erro falando de `school_title`, falta a migration 9 (`20261003000100_hierarquia_escolar.sql`):
> rode ela primeiro e depois o arquivo acima.

## O que o arquivo traz

| Migration | O que faz |
|---|---|
| `20261003000300_contas_da_escola` | Login das contas criadas pela escola; **fecha o buraco** em que um aluno escolhia a própria escola |
| `20261003000400_logo_local` | Aceita o logo guardado no próprio app (`/brand/schools/...`) |
| `20261003000500_chat_professor` | Chat da escola com o bot de cada professor (base de respostas, fila, limite por hora) |
| `20261003000600_limite_ia` | Limite diário de uso da IA por aluno |
| `20261003000700_painel_escola` | Números da escola para direção e coordenação |
| `20261003000800_planejamento` | Planejamento do professor (fonte da IA) |
| `20261003000900_mural` | Mural de avisos oficiais com confirmação de leitura |
| cadastro do Anglo | Nome, logo e a cor azul do Anglo |

## Variáveis na Hostinger

```
TENANT_ROOT_DOMAIN=nexastudy.com.br
SUPABASE_SERVICE_ROLE_KEY=<chave service_role do Supabase — SECRETA>
```
