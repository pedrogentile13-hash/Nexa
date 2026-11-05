#!/usr/bin/env bash
# ============================================================================
# Smoke test: o app sobe e serve as telas públicas?
#
# Existe por causa de um incidente: um deploy derrubou o site inteiro e nada
# na suíte percebeu. Os 159 testes de unidade cobrem funções puras — nenhum
# chegava a subir o servidor. Este sobe.
#
# Roda contra variáveis de ambiente FALSAS de propósito. Não é limitação: o
# que se quer provar aqui é que o app monta, serve HTML e não estoura quando o
# banco não responde — que é exatamente o estado em que ele quebrou. Com um
# Supabase de verdade, este teste passaria por outros motivos e deixaria de
# cobrir o caso que interessa.
#
# Uso: bash scripts/smoke.sh [porta]
# ============================================================================
set -uo pipefail

PORT="${1:-3210}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NEXT_PUBLIC_SUPABASE_URL="https://smoke.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="smoke-anon-key-aaaaaaaaaaaaaaaaaaaaaaaa"
export NEXT_PUBLIC_SITE_URL="http://localhost:${PORT}"

if [ ! -d .next ]; then
  echo "→ build ainda não existe, construindo…"
  npm run build >/dev/null 2>&1 || { echo "✗ build falhou"; exit 1; }
fi

echo "→ subindo o app na porta ${PORT}…"
npx next start -p "$PORT" >/tmp/nexa-smoke.log 2>&1 &
SERVER_PID=$!
# `kill` do grupo: `next start` sobe um filho, e matar só o pai deixa a porta presa.
# `pkill -P` pega o filho real: `npx` é só um invólucro, e matar só ele deixa
# o servidor de pé segurando a porta — foi o que aconteceu na primeira
# execução deste script.
trap 'pkill -P $SERVER_PID 2>/dev/null; kill $SERVER_PID 2>/dev/null; rm -rf "$TMP_DIR"' EXIT

for _ in $(seq 1 40); do
  curl -sf -o /dev/null "http://localhost:${PORT}/login" && break
  sleep 1
done

FAILED=0
TMP_DIR="$(mktemp -d)"

check() {
  local path="$1" expected="$2" label="$3"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}${path}")
  if [ "$code" = "$expected" ]; then
    printf '  ✓ %-28s %s\n' "$path" "$label"
  else
    printf '  ✗ %-28s esperava %s, veio %s\n' "$path" "$expected" "$code"
    FAILED=1
  fi
}

# Baixa a página UMA vez e procura no arquivo.
#
# A primeira versão disto era `curl … | grep -q`, e falhava mesmo com o
# conteúdo presente: `grep -q` sai no primeiro acerto e fecha o cano, o curl
# morre com erro de escrita (23), e o `pipefail` lá de cima transforma isso em
# falha do pipeline inteiro. O teste acusava ausência do que estava lá.
# Buscar antes e procurar depois elimina o cano — e de quebra faz uma
# requisição por página em vez de uma por verificação.
fetch() {
  local path="$1"
  local cache="${TMP_DIR}/$(echo "$path" | tr '/?=&' '____').html"
  [ -f "$cache" ] || curl -s "http://localhost:${PORT}${path}" -o "$cache"
  echo "$cache"
}

contains() {
  local path="$1" needle="$2" label="$3"
  local file
  file="$(fetch "$path")"
  if grep -q -F -- "$needle" "$file"; then
    printf '  ✓ %-28s %s\n' "$path" "$label"
  else
    printf '  ✗ %-28s não contém %s\n' "$path" "$needle"
    FAILED=1
  fi
}

echo "→ telas públicas respondem"
check /login 200 "tela de entrada"
check /politica-de-privacidade 200 "política de privacidade"
check /termos-de-uso 200 "termos de uso"
check /manifest.webmanifest 200 "manifest do PWA"

echo "→ o HTML servido tem o que precisa ter"
# O splash precisa estar no HTML BRUTO: injetado por JS, ele aparece tarde
# demais pra cobrir o vão da abertura.
contains /login 'id="nexa-splash"' "splash no HTML do servidor"
# O rastreador do AdSense lê HTML bruto; já falhou uma vez por estar via JS.
contains /login 'pagead2.googlesyndication.com' "script do AdSense no HTML bruto"
contains /manifest.webmanifest '"background_color":"#ffffff"' "splash nativo branco"

echo "→ rota protegida não serve conteúdo sem sessão"
# 307 (redireciona pro login) é o certo. 200 aqui significaria tela de aluno
# aberta a quem não entrou.
check /hoje 307 "redireciona para o login"

if [ "$FAILED" -eq 0 ]; then
  echo "✓ smoke test passou"
else
  echo "✗ smoke test falhou — log do servidor em /tmp/nexa-smoke.log"
fi
exit "$FAILED"
