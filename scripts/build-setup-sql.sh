#!/usr/bin/env bash
# ============================================================================
# Gera supabase/setup-completo.sql — migrations + seed em um arquivo só, para
# colar no SQL Editor do Supabase sem instalar nada.
#
# O arquivo é gerado, não editado à mão: editar o resultado faz ele divergir
# das migrations no primeiro dia, e aí o banco do Supabase deixa de ser o mesmo
# banco que os testes provam.
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${ROOT}/supabase/setup-completo.sql"

TABLES=$(grep -ho "^create table public\.[a-z_]*" "${ROOT}"/supabase/migrations/*.sql | wc -l)
VIEWS=$(grep -hoE "^create (or replace )?view public\.[a-z_]*" "${ROOT}"/supabase/migrations/*.sql | wc -l)

{
  cat <<HEADER
-- ============================================================================
-- Nexa — setup completo do banco, em um arquivo só
--
-- COMO USAR
--   1. Abra seu projeto no Supabase
--   2. Menu lateral → SQL Editor → New query
--   3. Cole TUDO isto e clique em Run
--
-- É seguro rodar em um projeto novo e vazio, e também em um já configurado:
-- tudo é idempotente. Cria as ${TABLES} tabelas, as políticas de RLS, as ${VIEWS} views,
-- as funções e o conteúdo inicial (disciplinas, conquistas e biblioteca).
--
-- DEPOIS DE RODAR, para virar administrador do painel /admin, rode também:
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'SEU-EMAIL-AQUI');
--
-- Gerado por scripts/build-setup-sql.sh a partir de supabase/migrations/ +
-- supabase/seed.sql — não edite aqui, edite os originais e gere de novo.
-- ============================================================================

HEADER

  for f in "${ROOT}"/supabase/migrations/*.sql; do
    printf '\n-- ─────────────────────────────────────────────────────────────────────\n'
    printf -- '-- %s\n' "$(basename "$f")"
    printf -- '-- ─────────────────────────────────────────────────────────────────────\n\n'
    cat "$f"
  done

  printf '\n-- ─────────────────────────────────────────────────────────────────────\n'
  printf -- '-- seed.sql\n'
  printf -- '-- ─────────────────────────────────────────────────────────────────────\n\n'
  cat "${ROOT}/supabase/seed.sql"
} > "$OUT"

echo "✓ ${OUT} — ${TABLES} tabelas, ${VIEWS} views, $(wc -l < "$OUT") linhas"
