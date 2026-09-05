'use client';

import { useRef, useState } from 'react';
import { Check, Loader2, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Envio de mídia direto do navegador para o Storage.
 *
 * Passar o arquivo por uma Server Action significaria carregar um vídeo de
 * 200 MB inteiro na memória do servidor antes de reenviá-lo — o Netlify corta
 * o corpo da requisição bem antes disso. O upload direto usa a sessão do
 * próprio administrador, então a policy do bucket continua sendo quem autoriza.
 *
 * O formulário guarda apenas o CAMINHO. A URL pública é derivada na leitura:
 * gravar a URL inteira amarraria a linha ao domínio do projeto Supabase atual.
 */

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match?.[1]?.toLowerCase() ?? 'bin';
}

export function MediaUpload({
  name,
  accept,
  defaultPath,
  label,
  hint,
}: {
  name: string;
  accept: string;
  defaultPath?: string | null;
  label: string;
  hint?: string;
}) {
  const [path, setPath] = useState(defaultPath ?? '');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setStatus('uploading');
    setMessage(null);
    setProgressLabel(`${(file.size / 1024 / 1024).toFixed(1)} MB`);

    const supabase = createClient();
    const objectPath = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extensionOf(file.name)}`;

    const { error } = await supabase.storage.from('nexa-content').upload(objectPath, file, {
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      setStatus('error');
      setMessage(
        /policy|denied|unauthorized/i.test(error.message)
          ? 'O Storage recusou o envio. Confirme que seu perfil é admin e que o bucket nexa-content existe.'
          : error.message,
      );
      return;
    }

    setPath(objectPath);
    setStatus('idle');
    setMessage(`${file.name} enviado.`);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-text mb-1.5 block text-sm font-medium">{label}</span>
        {hint && <span className="text-subtle text-xs">{hint}</span>}
      </div>

      <input type="hidden" name={name} value={path} />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Upload aria-hidden />
          )}
          {status === 'uploading' ? `Enviando ${progressLabel ?? ''}` : 'Escolher arquivo'}
        </Button>

        {path && (
          <span className="bg-success-soft text-success flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
            <Check className="size-3.5" aria-hidden />
            arquivo no servidor
            <button
              type="button"
              onClick={() => {
                setPath('');
                setMessage(null);
              }}
              aria-label="Remover arquivo"
              className="hover:text-danger ml-1"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        )}
      </div>

      {path && (
        <Input
          readOnly
          value={path}
          aria-label="Caminho do arquivo"
          className="text-subtle mt-2 font-mono text-xs"
        />
      )}

      {message && (
        <p className={cn('mt-2 text-xs', status === 'error' ? 'text-danger' : 'text-muted')}>
          {message}
        </p>
      )}
    </div>
  );
}
