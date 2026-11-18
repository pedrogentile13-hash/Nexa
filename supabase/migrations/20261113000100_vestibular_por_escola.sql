-- Nexa Vestibular por escola: cada escola pode ligar ou desligar a área de Vestibular para os seus alunos.
-- Padrão ligado: nada muda para quem já usa. A chave geral `vestibular_enabled` continua mandando (se ela estiver
-- desligada, ninguém vê). Idempotente.

alter table public.schools
  add column if not exists vestibular_enabled boolean not null default true;

comment on column public.schools.vestibular_enabled is
  'Libera a área de Vestibular para os alunos desta escola (vale só quando a chave geral também está ligada).';

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
