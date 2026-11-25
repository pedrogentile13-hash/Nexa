import { isValidLogin, normalizeLogin, suggestLogin } from './credentials';

/**
 * Planilha de contas da escola.
 *
 * Colunas (a ordem pode variar se houver cabeçalho): `nome`, `turma`, `login`
 * (opcional — se faltar, sai do nome) e `tipo` (aluno ou professor; o padrão é
 * aluno). Aceita vírgula, ponto e vírgula ou tabulação — o Excel em português
 * exporta com `;`, o Google Planilhas com `,`.
 *
 * Em módulo puro: é a única porta de entrada de dezenas de contas de uma vez,
 * e um erro aqui vira dezenas de contas erradas.
 */

export const MAX_IMPORT_ROWS = 200;

export interface ImportRow {
  line: number;
  fullName: string;
  login: string;
  role: 'student' | 'teacher_admin';
  className: string | null;
  /** O login veio digitado na planilha (e não sugerido a partir do nome). */
  loginTyped: boolean;
}

export interface ImportRowError {
  line: number;
  message: string;
}

export interface ParsedImport {
  rows: ImportRow[];
  errors: ImportRowError[];
}

function detectDelimiter(header: string): string {
  const counts = [';', '\t', ','].map((d) => [d, header.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0]![1] > 0 ? counts[0]![0] : ',';
}

/** Divide uma linha respeitando aspas ("Silva, Ana"). */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

const HEADER_ALIASES: Record<string, 'name' | 'class' | 'login' | 'role'> = {
  nome: 'name', 'nome completo': 'name', 'nome do aluno': 'name',
  turma: 'class', classe: 'class', sala: 'class',
  login: 'login', usuario: 'login', 'usuário': 'login',
  tipo: 'role', papel: 'role', perfil: 'role',
};

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function parseRole(raw: string): ImportRow['role'] | null {
  const v = fold(raw);
  if (!v || ['aluno', 'aluna', 'estudante', 'student'].includes(v)) return 'student';
  if (['professor', 'professora', 'prof', 'docente', 'teacher'].includes(v)) return 'teacher_admin';
  return null;
}

export function parseAccountsCsv(text: string): ParsedImport {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l, i) => ({ text: l, line: i + 1 }))
    .filter((l) => l.text.trim() !== '');

  const result: ParsedImport = { rows: [], errors: [] };
  if (lines.length === 0) return result;

  const delimiter = detectDelimiter(lines[0]!.text);

  // Cabeçalho: se a primeira linha tem nomes de coluna conhecidos, é cabeçalho.
  const first = splitLine(lines[0]!.text, delimiter).map(fold);
  const hasHeader = first.some((c) => c in HEADER_ALIASES);
  const columns: Array<'name' | 'class' | 'login' | 'role' | undefined> = hasHeader
    ? first.map((c) => HEADER_ALIASES[c])
    : ['name', 'class', 'login', 'role'];

  const body = hasHeader ? lines.slice(1) : lines;
  if (body.length > MAX_IMPORT_ROWS) {
    result.errors.push({ line: 0, message: `A planilha tem ${body.length} linhas; o máximo por importação é ${MAX_IMPORT_ROWS}. Divida em partes.` });
    return result;
  }

  const taken = new Set<string>();

  for (const { text: raw, line } of body) {
    const cells = splitLine(raw, delimiter);
    const get = (key: 'name' | 'class' | 'login' | 'role') => {
      const idx = columns.indexOf(key);
      return idx >= 0 ? (cells[idx] ?? '').trim() : '';
    };

    const fullName = get('name');
    if (fullName.length < 3) {
      result.errors.push({ line, message: 'Nome faltando ou muito curto.' });
      continue;
    }

    const role = parseRole(get('role'));
    if (!role) {
      result.errors.push({ line, message: `Tipo "${get('role')}" não reconhecido (use aluno ou professor).` });
      continue;
    }

    const typed = get('login');
    let login = typed ? normalizeLogin(typed) : suggestLogin(fullName);
    if (!isValidLogin(login)) {
      result.errors.push({ line, message: `Login "${typed || login}" inválido (3 a 30 letras, números, ponto, hífen ou sublinhado).` });
      continue;
    }

    // Logins repetidos DENTRO da planilha: se o login veio sugerido, resolve com
    // um número (ana.silva2); se a pessoa digitou, é erro dela e precisa ver.
    if (taken.has(login)) {
      if (typed) {
        result.errors.push({ line, message: `Login "${login}" repetido na planilha.` });
        continue;
      }
      let n = 2;
      while (taken.has(normalizeLogin(`${login}${n}`))) n += 1;
      login = normalizeLogin(`${login}${n}`);
    }
    taken.add(login);

    const className = role === 'student' ? get('class') || null : null;
    result.rows.push({ line, fullName, login, role, className, loginTyped: Boolean(typed) });
  }

  return result;
}

/** Resultado de uma importação, em texto para copiar/colar numa planilha. */
export function resultsToTsv(rows: { fullName: string; login: string; password: string; className?: string | null }[]): string {
  const header = 'Nome\tTurma\tLogin\tSenha';
  return [header, ...rows.map((r) => `${r.fullName}\t${r.className ?? ''}\t${r.login}\t${r.password}`)].join('\n');
}
