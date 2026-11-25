-- ============================================================================
-- Nexa Study — 0908 (7) · Bucket de foto de perfil
--
-- Diferente de `nexa-content` (só admin escreve), aqui é o próprio aluno que
-- sobe o arquivo, e só o SEU arquivo — por isso a policy de escrita não olha
-- o cargo, olha o CAMINHO: o objeto tem que morar numa pasta com o próprio
-- `auth.uid()` (`avatars/<user_id>/arquivo.jpg`), garantido no cliente pelo
-- código que monta o path, e garantido de novo aqui pela RLS, que é a que
-- realmente impede um aluno de sobrescrever a foto de outro.
--
-- Leitura pública pelo mesmo motivo do bucket de conteúdo: URL assinada
-- expira, e uma foto de perfil que some depois de uma hora é pior do que
-- nunca ter tido foto.
-- ============================================================================

do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping avatars bucket setup';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB: sobra para uma foto de perfil, e barra vídeo/PDF disfarçado
    array['image/png', 'image/jpeg', 'image/webp']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  execute $ddl$
    drop policy if exists avatars_read_all on storage.objects;
    create policy avatars_read_all on storage.objects
      for select using (bucket_id = 'avatars');

    drop policy if exists avatars_write_own on storage.objects;
    create policy avatars_write_own on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists avatars_update_own on storage.objects;
    create policy avatars_update_own on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists avatars_delete_own on storage.objects;
    create policy avatars_delete_own on storage.objects
      for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  $ddl$;
end;
$$;
