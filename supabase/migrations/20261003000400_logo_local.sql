-- ============================================================================
-- Nexa — Logo da escola guardado no próprio app
--
-- `school_branding.logo_url` só aceitava `https://...`. O logo de uma escola
-- cliente é um arquivo pequeno que vive junto do app (`/brand/schools/...`),
-- sem depender de hospedagem de terceiros — então o caminho local passa a ser
-- aceito. Continua proibido tudo que não seja um dos dois (nada de
-- `javascript:`, `data:` ou caminho relativo solto).
-- ============================================================================

alter table public.school_branding drop constraint if exists school_branding_logo_url_check;
alter table public.school_branding add constraint school_branding_logo_url_check
  check (
    logo_url is null
    or (length(logo_url) <= 500 and (logo_url ~ '^https://' or logo_url ~ '^/brand/schools/[a-z0-9._-]+$'))
  );
