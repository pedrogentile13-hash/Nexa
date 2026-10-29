-- ============================================================================
-- Nexa — 0907 · Conteúdo por PDF
--
-- Um resumo em PDF não é um `kind` novo — é o `kind` 'resumo' de sempre com o
-- conteúdo vindo de um arquivo em vez de markdown. `resources_has_payload`
-- (0100_content.sql) já aceita `storage_path` como conteúdo válido para
-- qualquer kind; o que faltava era um jeito de o leitor saber QUAL dos dois
-- formatos está ali, e onde guardar o que a extração descobre (páginas,
-- texto, status).
-- ============================================================================

alter table public.resources
  add column if not exists content_format text not null default 'markdown'
    check (content_format in ('markdown', 'pdf')),
  add column if not exists pdf_page_count integer
    check (pdf_page_count is null or pdf_page_count > 0),
  -- Texto puro extraído do PDF — não é para exibir (o leitor mostra o PDF de
  -- verdade), é a matéria-prima para "transformar em estudo" mais adiante,
  -- quando houver provedor de IA configurado. Guardar agora evita rebaixar o
  -- arquivo do Storage outra vez só para reler o texto no futuro.
  add column if not exists pdf_extracted_text text,
  -- Processamento é síncrono no upload (decisão registrada na ADR-039): só
  -- existem dois estados terminais. "Enviando"/"processando" são estado de
  -- tela, não de banco — não há nada para uma segunda requisição encontrar.
  add column if not exists pdf_status text
    check (pdf_status is null or pdf_status in ('processado', 'erro'));

comment on column public.resources.content_format is
  'Para kind=resumo: markdown (texto digitado) ou pdf (arquivo enviado).';
comment on column public.resources.pdf_status is
  'Resultado da extração no upload — processado ou erro. Null para conteúdo que não é PDF.';

-- Favoritar generaliza para qualquer kind porque resource_progress já é
-- por (usuário, recurso) independente de formato — não é a tela dedicada de
-- "Meus favoritos" (essa continua em aberto, ver ADR-037), só o sinalizador
-- que uma tela futura vai listar.
alter table public.resource_progress
  add column if not exists is_favorited boolean not null default false;
