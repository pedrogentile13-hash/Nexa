-- ============================================================================
-- Nexa Study — 0907 (5) · Preferências de notificação
--
-- Only a preference the student saves — não existe envio real (push/e-mail)
-- ainda, então isto só guarda a intenção pra quando essa infraestrutura
-- existir. Um jsonb em vez de 4 colunas booleanas porque a lista tende a
-- crescer (a Fase 6, Nexa IA, e futuras notificações de Revisões vão
-- adicionar chaves), e todo campo aqui já nasce com default — nenhum
-- usuário existente fica com preferência indefinida.
-- ============================================================================

alter table public.profiles
  add column if not exists notification_settings jsonb not null default jsonb_build_object(
    'dailyReminder', true,
    'revisionReminder', true,
    'achievementsAndGoals', true,
    'newsUpdates', false
  );
