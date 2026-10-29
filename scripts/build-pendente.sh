#!/usr/bin/env bash
# Gera supabase/pendente-agora.sql: as migrations desde a 11 (sem comentários e
# linhas em branco, para caber numa colagem no celular) + o cadastro do Anglo.
# A lista abaixo é o que ainda NÃO foi aplicado no Supabase de produção.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILES=(
  20261003000300_contas_da_escola
  20261003000400_logo_local
  20261003000500_chat_professor
  20261003000600_limite_ia
  20261003000700_painel_escola
  20261003000800_planejamento
  20261003000900_mural
  20261003001000_redacao
  20261003001100_selo_escola
  20261003001200_admin_restrito 20261003001300_nexaia_material 20261003001400_eventos_no_calendario
)
strip() { grep -vE '^\s*--' "$1" | grep -vE '^\s*$' | sed 's/[[:space:]]*$//'; }
{
  for f in "${FILES[@]}"; do
    echo "-- ===== ${f} ====="
    strip "${ROOT}/supabase/migrations/${f}.sql"
    echo
  done
  echo "-- ===== cadastro do Anglo (logo e cores) ====="
  strip "${ROOT}/supabase/seed-anglo-morumbi.sql"
} > "${ROOT}/supabase/pendente-agora.sql"
wc -l "${ROOT}/supabase/pendente-agora.sql"
