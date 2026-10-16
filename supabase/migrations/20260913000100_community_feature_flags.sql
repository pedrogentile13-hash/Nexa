-- ============================================================================
-- Nexa Community — Fase 0 (1) · Feature flags
--
-- Primeira peça de infraestrutura do "Nexa Community" (feed social,
-- amizades/seguir, comunidades, grupos, chat, IA Creator, eventos —
-- especificação completa em NEXA_COMMUNITY_MASTER_IMPLEMENTATION_PLAN.md).
--
-- Cada fase da Community nasce DESLIGADA (`enabled = false`) e é ligada só
-- depois de implementada e verificada — não depende de deploy pra
-- desativar algo que deu problema em produção, só de um `update`. As 8
-- chaves são exatamente as que o plano pede (seção 23/56).
--
-- Leitura liberada a qualquer autenticado (o app precisa checar o flag no
-- client pra esconder nav/rota antes mesmo de bater no servidor); escrita
-- só `is_admin()` — mesmo corte de `is_admin()` já usado em toda a base
-- pra decisão global (nunca `school_admin`, que gerencia só a própria
-- escola, não o rollout do produto inteiro).
-- ============================================================================

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

comment on table public.feature_flags is
  'Chaves de rollout do Nexa Community — lidas pelo app pra esconder rota/nav/ação enquanto uma fase não está pronta.';

alter table public.feature_flags enable row level security;

drop policy if exists feature_flags_select_authenticated on public.feature_flags;
create policy feature_flags_select_authenticated
  on public.feature_flags for select
  to authenticated
  using (true);

drop policy if exists feature_flags_write_admin on public.feature_flags;
create policy feature_flags_write_admin
  on public.feature_flags for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.feature_flags (key, enabled, description) values
  ('community_enabled', false, 'Chave-mestra: liga a seção "Comunidade" na navegação.'),
  ('posts_enabled', false, 'Feed social — criar/ver post, curtir, comentar, salvar.'),
  ('groups_enabled', false, 'Grupos (dentro de comunidades ou avulsos).'),
  ('chat_enabled', false, 'Chat em grupos/comunidades.'),
  ('creator_enabled', false, 'IA Creator — aluno gera quiz/simulado/resumo com IA.'),
  ('events_enabled', false, 'Eventos escolares — criação, inscrição, agenda.'),
  ('certificates_enabled', false, 'Check-in por QR + certificados de evento.'),
  ('social_xp_enabled', false, 'XP/conquistas ganhos por atividade social.')
on conflict (key) do nothing;
