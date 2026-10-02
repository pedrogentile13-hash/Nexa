-- ============================================================================
-- Nexa — 0910 · Resumo interativo (HTML incorporado)
--
-- Terceiro valor de `content_format` (0907_pdf_resources.sql já criou a
-- coluna para markdown/pdf) — sem tabela nova, sem `kind` novo. O HTML fica
-- no mesmo `body` que já guarda o markdown; o leitor decide como renderizar
-- pelo `content_format`, isolando o HTML num `<iframe sandbox>` (nunca
-- `dangerouslySetInnerHTML` no documento principal).
-- ============================================================================

alter table public.resources
  drop constraint if exists resources_content_format_check;

alter table public.resources
  add constraint resources_content_format_check
    check (content_format in ('markdown', 'pdf', 'html'));

comment on column public.resources.content_format is
  'Para kind=resumo: markdown (texto digitado), pdf (arquivo enviado) ou html (embed sandboxed).';
