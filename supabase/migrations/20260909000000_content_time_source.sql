-- ============================================================================
-- Nexa Study — 0909 (1) · Tempo de estudo passa a contar consumo de conteúdo
--
-- `study_sessions.source` só aceitava 'timer' (o cronômetro manual "Estudar
-- agora" da tela Hoje) e 'manual' (nunca usado de fato hoje). Ler um resumo,
-- ouvir um podcast ou assistir um vídeo em /estudar/[id] nunca gravava nada
-- aqui — só `resource_progress` (posição de rolagem/mídia), que mede ONDE o
-- aluno está, não QUANTO TEMPO ele passou. Resultado: quem estuda sem apertar
-- o cronômetro manual tinha zero minuto contado em "tempo de estudo" em
-- qualquer lugar do app.
--
-- `source = 'content'` fecha essa lacuna. Cada flush do hook de
-- rastreamento (`use-content-time-tracking.ts`) grava uma linha JÁ FECHADA
-- (`ended_at` preenchido no mesmo insert, nunca `null`) — por isso nunca
-- disputa `study_sessions_one_running_uq` (único por `ended_at is null`),
-- mesmo que o cronômetro manual esteja rodando na mesma conta ao mesmo
-- tempo. Sem mudança de RLS: `study_sessions_all_own` já cobre qualquer
-- `source`, e o trigger `sync_study_total()` já soma `duration_seconds`
-- independente do valor de `source`.
-- ============================================================================

alter table public.study_sessions drop constraint if exists study_sessions_source_check;
alter table public.study_sessions add constraint study_sessions_source_check
  check (source in ('timer', 'manual', 'content'));
