/**
 * Regras do proxy que serve os cadernos e gabaritos dentro do Nexa.
 *
 * Os sites das bancas não deixam outro site incorporar o PDF, e o navegador
 * não consegue lê-lo por JavaScript (sem CORS). Por isso o servidor busca o
 * arquivo e o entrega do próprio endereço do Nexa. Isso é uma porta para a
 * internet, então as regras são rígidas:
 *   - só vale endereço que está CADASTRADO em `exam_files` (o usuário nunca
 *     manda o endereço);
 *   - só https, e só de um conjunto fixo de sites oficiais;
 *   - redirecionamento só se o destino também estiver na lista;
 *   - tamanho máximo.
 */

/** Sites oficiais de onde saem os cadernos e gabaritos. */
export const OFFICIAL_FILE_HOSTS = [
  'download.inep.gov.br',
  'www.vestibular.ita.br',
  'www.fuvest.br',
  'www.comvest.unicamp.br',
  'vestibular.unesp.br',
] as const;

/** Maior arquivo que o servidor aceita repassar (um caderno do ENEM tem 20 a 40 MB). */
export const MAX_EXAM_FILE_BYTES = 120 * 1024 * 1024;

export interface HostEnv {
  /** `EXAM_FILE_HOSTS`: sites extras separados por vírgula (ex.: o endereço do Supabase Storage). */
  extra?: string | null;
  /** `NEXT_PUBLIC_SUPABASE_URL`: se os PDFs forem hospedados no Storage, o próprio Supabase é permitido. */
  supabaseUrl?: string | null;
  production?: boolean;
}

export function allowedHosts(env: HostEnv = {}): Set<string> {
  const hosts = new Set<string>(OFFICIAL_FILE_HOSTS);
  for (const h of (env.extra ?? '').split(',')) {
    const host = h.trim().toLowerCase();
    if (host) hosts.add(host);
  }
  if (env.supabaseUrl) {
    try {
      hosts.add(new URL(env.supabaseUrl).host.toLowerCase());
    } catch {
      /* variável mal preenchida: ignora */
    }
  }
  return hosts;
}

/**
 * Devolve a URL se ela puder ser buscada, ou `null`. Só https; `http` só vale em
 * desenvolvimento e para um site extra declarado em `EXAM_FILE_HOSTS`.
 */
export function checkExamFileUrl(raw: string, hosts: Set<string>, production = true): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const host = url.host.toLowerCase();
  if (!hosts.has(host)) return null;
  if (url.protocol === 'https:') return url;
  if (url.protocol === 'http:' && !production && !(OFFICIAL_FILE_HOSTS as readonly string[]).includes(host)) return url;
  return null;
}

/** Nome do arquivo para o download: sem acento, sem barra, termina em .pdf. */
export function safeFilename(label: string, fallback = 'prova'): string {
  const base = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);
  return `${base || fallback}.pdf`;
}

/** Explica, em português, por que o site oficial não entregou o arquivo (para o aluno e para o administrador). */
export function explainUpstreamStatus(status: number): string {
  if (status === 404 || status === 410) return 'O site oficial respondeu "não encontrado" (404): o endereço cadastrado está errado ou o arquivo saiu do ar.';
  if (status === 401 || status === 403) return 'O site oficial recusou o acesso do servidor do Nexa (403). Hospede o PDF no Nexa (envio de arquivo) ou use "Abrir no site oficial".';
  if (status === 429) return 'O site oficial limitou os acessos (429). Tente de novo em alguns minutos.';
  if (status >= 500) return `O site oficial está com problema agora (${status}). Tente de novo mais tarde.`;
  return `O site oficial respondeu com o código ${status}.`;
}
