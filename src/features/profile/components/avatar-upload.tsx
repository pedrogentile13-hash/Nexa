'use client';

import { useRef, useState, useTransition } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { updateAvatarPath } from '../server/actions';

/**
 * Foto de perfil.
 *
 * Envio direto do navegador pro Storage, mesmo padrão do `MediaUpload` do
 * admin — e pela mesma razão: passar a imagem por uma Server Action significa
 * carregar o arquivo inteiro na memória do servidor à toa. O nome do arquivo
 * carrega o próprio uid como primeira pasta (`avatars/<uid>/...`) porque é
 * assim que a RLS do bucket reconhece "este é o dono".
 */
export function AvatarUpload({
  userId,
  avatarUrl,
  fullName,
}: {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
}) {
  const [preview, setPreview] = useState(avatarUrl);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setStatus('uploading');
    setMessage(null);

    const ext = /\.([a-z0-9]+)$/i.exec(file.name)?.[1]?.toLowerCase() ?? 'jpg';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const supabase = createClient();

    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '31536000',
      upsert: true,
    });

    if (error) {
      setStatus('error');
      setMessage('Não consegui enviar a foto. Tente uma imagem menor.');
      return;
    }

    setStatus('idle');
    setPreview(URL.createObjectURL(file));
    startTransition(async () => {
      await updateAvatarPath(path);
    });
  }

  function onRemove() {
    setPreview(null);
    startTransition(async () => {
      await updateAvatarPath(null);
    });
  }

  const initial = fullName.trim()[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        aria-label={preview ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
        className="group bg-brand-soft text-brand-text relative grid size-14 place-items-center overflow-hidden rounded-full text-lg font-semibold"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          initial
        )}

        <span
          aria-hidden
          className={cn(
            'absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100',
            status === 'uploading' && 'opacity-100',
          )}
        >
          {status === 'uploading' ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white" />
          )}
        </span>
      </button>

      {preview && status !== 'uploading' && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover foto de perfil"
          className="border-surface bg-surface text-muted hover:text-danger absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2"
        >
          <Trash2 className="size-3" aria-hidden />
        </button>
      )}

      {message && <p className="text-danger absolute top-full mt-1 w-40 text-xs">{message}</p>}
    </div>
  );
}
