import { allowedHosts, checkExamFileUrl, explainUpstreamStatus } from '../lib/exam-file-proxy';

const MAX_REDIRECTS = 3;

/**
 * Baixa um caderno ou gabarito oficial no SERVIDOR (para a IA ler). As mesmas regras do proxy de leitura:
 * só https de um site oficial da lista, redirecionamento só para a lista, e tamanho máximo.
 * O endereço vem sempre de `exam_files`, nunca do navegador.
 */
export async function fetchExamFile(url: string, maxBytes = 15 * 1024 * 1024): Promise<{ ok: true; data: Buffer; mime: string } | { ok: false; message: string }> {
  const production = process.env.NODE_ENV === 'production';
  const hosts = allowedHosts({ extra: process.env.EXAM_FILE_HOSTS, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL });
  let target = checkExamFileUrl(url, hosts, production);
  for (let hop = 0; target && hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await fetch(target, { redirect: 'manual', headers: { 'User-Agent': 'NexaStudy/1.0 (leitura de gabarito)' }, signal: AbortSignal.timeout(30_000) });
    } catch {
      return { ok: false, message: 'O site oficial não respondeu agora.' };
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      target = next ? checkExamFileUrl(new URL(next, target).toString(), hosts, production) : null;
      continue;
    }
    if (res.status !== 200) return { ok: false, message: explainUpstreamStatus(res.status) };
    const length = Number(res.headers.get('content-length') ?? '0');
    if (length > maxBytes) return { ok: false, message: 'Arquivo grande demais para a IA ler.' };
    const data = Buffer.from(await res.arrayBuffer());
    if (data.byteLength > maxBytes) return { ok: false, message: 'Arquivo grande demais para a IA ler.' };
    return { ok: true, data, mime: (res.headers.get('content-type') ?? 'application/pdf').split(';')[0]!.trim() };
  }
  return { ok: false, message: 'Endereço não permitido.' };
}
