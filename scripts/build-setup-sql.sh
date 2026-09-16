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

# `|| true`: com `set -e` + `pipefail`, um grep sem casamento derruba o script
# ANTES de ele escrever o arquivo — foi assim que a geração passou a falhar em
# silêncio quando as migrations ganharam `if not exists`.
#
# Subtrai o que uma migration posterior derruba (`drop table`/`drop view`),
# ou a contagem no cabeçalho mente assim que a primeira migration de remoção
# aparece no histórico.
TABLES_CREATED=$(grep -hoE "^create table (if not exists )?public\.[a-z_]*" "${ROOT}"/supabase/migrations/*.sql | wc -l || true)
TABLES_DROPPED=$(grep -hoE "^drop table (if exists )?public\.[a-z_]*" "${ROOT}"/supabase/migrations/*.sql | wc -l || true)
VIEWS_CREATED=$(grep -hoE "^create (or replace )?view public\.[a-z_]*" "${ROOT}"/supabase/migrations/*.sql | wc -l || true)
VIEWS_DROPPED=$(grep -hoE "^drop view (if exists )?public\.[a-z_]*" "${ROOT}"/supabase/migrations/*.sql | wc -l || true)
TABLES=$((TABLES_CREATED - TABLES_DROPPED))
VIEWS=$((VIEWS_CREATED - VIEWS_DROPPED))

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
-- SEGURO RODAR QUANTAS VEZES QUISER. Em projeto novo, cria tudo; em projeto que
-- já rodou uma versão anterior, adiciona só o que falta e deixa o resto como
-- está. Nenhum dado seu é apagado — nem notas, nem rotina, nem conteúdo.
--
-- Cria as ${TABLES} tabelas, as políticas de RLS, as ${VIEWS} views, as funções e o
-- conteúdo inicial (matérias, conquistas e a biblioteca de estudo).
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
