import type { ExamEditionSummary, VestibularResource } from '../server/queries';

/**
 * Biblioteca do Vestibular — a parte pura.
 *
 * Junta, numa estante só, tudo o que serve a quem se prepara: simulados, quizzes, resumos e os cadernos
 * oficiais (com gabarito). Diferente da Biblioteca do Nexa Study (que é por matéria e série), esta é por
 * VESTIBULAR: cada banca tem a sua prateleira.
 */

export type LibraryType = 'simulado' | 'prova' | 'quiz' | 'resumo';

export interface LibraryItem {
  key: string;
  type: LibraryType;
  title: string;
  /** ENEM, FUVEST... ou "Geral" para conteúdo sem banca. */
  banca: string;
  year: number | null;
  subject: string | null;
  questionCount: number;
  minutes: number | null;
  bestPercent: number | null;
  href: string;
  /** Prova que existiu de verdade (tem edição/ano); o resto é "no estilo da banca". */
  official: boolean;
}

export const TYPE_LABEL: Record<LibraryType, string> = {
  simulado: 'Simulado',
  prova: 'Caderno oficial',
  quiz: 'Quiz',
  resumo: 'Resumo',
};

export const BANCA_ORDER = ['ENEM', 'FUVEST', 'UNICAMP', 'UNESP', 'ITA', 'IME'];

/** Nome curto e estável da banca (o banco guarda "ENEM", "FUVEST"…). */
export function bancaOf(examName: string | null): string {
  return examName?.trim() ? examName.trim().toUpperCase() : 'GERAL';
}

export function buildLibrary(
  resources: VestibularResource[],
  editions: ExamEditionSummary[],
  fileCounts: Record<string, number>,
): LibraryItem[] {
  const items: LibraryItem[] = resources.map((r) => {
    const type: LibraryType = r.kind === 'simulado' ? 'simulado' : r.kind === 'quiz' ? 'quiz' : 'resumo';
    return {
      key: `r-${r.id}`,
      type,
      title: r.title,
      banca: bancaOf(r.examName),
      year: r.editionYear,
      subject: r.subjectName,
      questionCount: r.questionCount,
      minutes: r.timeLimitSeconds ? Math.round(r.timeLimitSeconds / 60) : null,
      bestPercent: r.myBestPercent,
      href: `/estudar/${r.id}`,
      official: r.editionYear !== null,
    };
  });

  // Caderno oficial: só entra edição que realmente tem arquivo para abrir.
  for (const e of editions) {
    if ((fileCounts[e.id] ?? 0) === 0) continue;
    items.push({
      key: `e-${e.id}`,
      type: 'prova',
      title: `${e.examName} ${e.year}`,
      banca: bancaOf(e.examName),
      year: e.year,
      subject: null,
      questionCount: 0,
      minutes: null,
      bestPercent: null,
      href: `/vestibular/provas/${e.id}`,
      official: true,
    });
  }
  return items;
}

export type ShelfGroup = 'nexa' | 'oficial';

export interface Shelf {
  /** Chave estável: banca + grupo. */
  key: string;
  banca: string;
  /** 'nexa' = simulados, quizzes e resumos do Nexa; 'oficial' = provas anteriores e cadernos oficiais. */
  group: ShelfGroup;
  title: string;
  items: LibraryItem[];
}

export interface LibraryFilters {
  type: LibraryType | 'todos';
  subject: string | 'todas';
  search: string;
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function filterLibrary(items: LibraryItem[], f: LibraryFilters): LibraryItem[] {
  const q = norm(f.search.trim());
  return items.filter(
    (i) =>
      (f.type === 'todos' || i.type === f.type) &&
      (f.subject === 'todas' || i.subject === f.subject) &&
      (!q || norm(`${i.title} ${i.banca} ${i.subject ?? ''}`).includes(q)),
  );
}

/**
 * Duas prateleiras por banca: primeiro os simulados, quizzes e resumos do Nexa e, depois, as provas anteriores.
 * Separar evita que os simulados (sem ano) fiquem escondidos no fim de uma fila longa de provas por ano.
 */
export function groupIntoShelves(items: LibraryItem[]): Shelf[] {
  const groupOf = (i: LibraryItem): ShelfGroup => (i.type === 'prova' || i.official ? 'oficial' : 'nexa');
  const by = new Map<string, Shelf>();
  for (const i of items) {
    const group = groupOf(i);
    const key = `${i.banca}|${group}`;
    const shelf = by.get(key) ?? { key, banca: i.banca, group, title: group === 'nexa' ? 'Simulados e treino' : 'Provas anteriores', items: [] };
    shelf.items.push(i);
    by.set(key, shelf);
  }
  const rank = (b: string) => {
    const k = BANCA_ORDER.indexOf(b);
    return k === -1 ? BANCA_ORDER.length : k;
  };
  return [...by.values()]
    .sort((a, b) => rank(a.banca) - rank(b.banca) || a.banca.localeCompare(b.banca, 'pt-BR') || (a.group === b.group ? 0 : a.group === 'nexa' ? -1 : 1))
    .map((shelf) => ({
      ...shelf,
      items: [...shelf.items].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title, 'pt-BR')),
    }));
}

export function subjectsOf(items: LibraryItem[]): string[] {
  return [...new Set(items.map((i) => i.subject).filter((s): s is string => Boolean(s)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
