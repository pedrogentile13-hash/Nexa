-- ============================================================================
-- Nexa — 0400 (v2) · Bucket do conteúdo
--
-- `nexa-content` é PÚBLICO para leitura, e essa é uma decisão deliberada, não
-- um descuido:
--
--  * Áudio e vídeo com URL assinada expiram no meio da reprodução. Um podcast
--    de 20 minutos com URL de 60 minutos parece resolver — até o aluno pausar,
--    sair do app e voltar depois do almoço, quando a URL morreu e o player
--    quebra sem explicação.
--  * O conteúdo não é secreto. É material de estudo publicado, o mesmo que
--    estaria num site da escola. O que precisa de sigilo é a NOTA do aluno, e
--    essa não passa por aqui.
--  * O que fica protegido é a ESCRITA: só admin e school_admin sobem arquivo.
--
-- O que NÃO deve entrar neste bucket: prova antes da aplicação, gabarito em
-- PDF, qualquer coisa cujo vazamento importe. Gabarito vive nas tabelas
-- `questions`/`question_options`, fechadas até para o aluno.
-- ============================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping content bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'nexa-content',
    'nexa-content',
    true,
    524288000, -- 500 MB: um vídeo de aula de 20 min em 720p cabe
    array[
      'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml',
      'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'text/plain', 'text/markdown'
    ]
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  execute $ddl$
    drop policy if exists nexa_content_read_all on storage.objects;
    create policy nexa_content_read_all on storage.objects
      for select using (bucket_id = 'nexa-content');

    drop policy if exists nexa_content_write_admin on storage.objects;
    create policy nexa_content_write_admin on storage.objects
      for insert to authenticated
      with check (bucket_id = 'nexa-content' and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'school_admin')));

    drop policy if exists nexa_content_update_admin on storage.objects;
    create policy nexa_content_update_admin on storage.objects
      for update to authenticated
      using (bucket_id = 'nexa-content' and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'school_admin')));

    drop policy if exists nexa_content_delete_admin on storage.objects;
    create policy nexa_content_delete_admin on storage.objects
      for delete to authenticated
      using (bucket_id = 'nexa-content' and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'school_admin')));
  $ddl$;
end;
$$;
