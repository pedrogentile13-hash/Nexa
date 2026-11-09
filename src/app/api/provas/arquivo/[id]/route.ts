import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  allowedHosts,
  checkExamFileUrl,
  MAX_EXAM_FILE_BYTES,
  safeFilename,
} from '@/features/vestibular/lib/exam-file-proxy';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_REDIRECTS = 3;

const fail = (message: string, status: number) =>
  Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Entrega um caderno ou gabarito oficial pelo endereço do Nexa, para o
 * visualizador abrir o PDF dentro da página.
 *
 * O endereço NUNCA vem do navegador: vem da tabela `exam_files` (que só o
 * administrador escreve), e mesmo assim só é buscado se for https de um site
 * oficial da lista (ver `exam-file-proxy.ts`). Só quem está logado lê.
 *
 * `?download=1` entrega como anexo, com um nome de arquivo limpo.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return fail('Arquivo inválido.', 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('Entre para ver este arquivo.', 401);

  // A política do banco só devolve arquivo publicado (ou qualquer um, para o administrador).
  const { data: file } = await supabase.from('exam_files').select('url, label, kind').eq('id', id).maybeSingle();
  if (!file || (file.kind !== 'caderno' && file.kind !== 'gabarito')) return fail('Arquivo não encontrado.', 404);

  const production = process.env.NODE_ENV === 'production';
  const hosts = allowedHosts({
    extra: process.env.EXAM_FILE_HOSTS,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  // Segue redirecionamento à mão: o destino também precisa estar na lista.
  const range = request.headers.get('range');
  let target = checkExamFileUrl(file.url, hosts, production);
  let upstream: Response | null = null;
  for (let hop = 0; target && hop <= MAX_REDIRECTS; hop++) {
    try {
      upstream = await fetch(target, {
        redirect: 'manual',
        headers: { 'User-Agent': 'NexaStudy/1.0 (visualizador de provas)', Accept: 'application/pdf', ...(range ? { Range: range } : {}) },
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      return fail('O site oficial não respondeu agora. Tente de novo em instantes.', 502);
    }
    if (upstream.status >= 300 && upstream.status < 400) {
      const next = upstream.headers.get('location');
      target = next ? checkExamFileUrl(new URL(next, target).toString(), hosts, production) : null;
      upstream = null;
      continue;
    }
    break;
  }
  if (!target || !upstream) return fail('Não consegui abrir este arquivo.', 502);
  if (upstream.status !== 200 && upstream.status !== 206) return fail('O site oficial não entregou o arquivo.', 502);

  const type = upstream.headers.get('content-type') ?? '';
  if (!/pdf|octet-stream/i.test(type)) return fail('O endereço cadastrado não é um PDF.', 502);

  const length = Number(upstream.headers.get('content-length') ?? '0');
  if (length > MAX_EXAM_FILE_BYTES) return fail('Arquivo grande demais para abrir aqui. Use Baixar.', 413);

  const download = new URL(request.url).searchParams.get('download') === '1';
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeFilename(file.label)}"`,
    'Accept-Ranges': upstream.headers.get('accept-ranges') ?? 'bytes',
    // Prova passada não muda: o navegador guarda, só para este usuário.
    'Cache-Control': 'private, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const h of ['content-length', 'content-range'] as const) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
