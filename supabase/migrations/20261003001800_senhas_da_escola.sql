-- ============================================================================
-- Nexa — Senha das contas da escola, guardada CIFRADA para a coordenação rever
--
-- A coordenação/direção precisa rever a senha de um aluno para repassá-la. O
-- servidor cifra a senha (AES-256-GCM, chave só no servidor) e guarda aqui. A
-- tabela tem RLS ligada e NENHUMA policy: nem o aluno nem a coordenação leem
-- direto; só o servidor, com a chave de serviço, depois de checar a permissão.
-- ============================================================================
create table if not exists public.school_account_secrets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  secret text not null,
  updated_at timestamptz not null default now()
);

alter table public.school_account_secrets enable row level security;
revoke all on public.school_account_secrets from anon, authenticated;
