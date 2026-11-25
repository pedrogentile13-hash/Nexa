-- ============================================================================
-- Nexa — o Vestibular volta a fazer parte do Nexa Escolas
--
-- Antes, contas gerenciadas pela escola ficavam presas na jornada "escola" (gatilho
-- `profiles_school_journey`). Agora o aluno de escola pode escolher "escola", "vestibular" ou
-- "os dois", como qualquer outra conta. Só a jornada é liberada: plano, anúncios e cobrança
-- continuam como antes (conta de escola não tem anúncio nem assinatura).
-- ============================================================================

drop trigger if exists profiles_school_journey on public.profiles;
drop function if exists public.profiles_school_journey();
drop function if exists public.profile_is_managed_school(uuid, text, text);

revoke execute on all functions in schema public from public, anon;
grant execute on function public.resolve_school_host(text) to anon;
grant execute on function public.report_error(text, text, text, text, text, text) to anon;
