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

export interface Shelf {
  banca: string;
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

/** Uma prateleira por banca (ENEM, FUVEST, UNICAMP, UNESP… e as outras por ordem alfabética); dentro dela, o mais novo primeiro. */
export function groupIntoShelves(items: LibraryItem[]): Shelf[] {
  const by = new Map<string, LibraryItem[]>();
  for (const i of items) by.set(i.banca, [...(by.get(i.banca) ?? []), i]);
  const rank = (b: string) => {
    const k = BANCA_ORDER.indexOf(b);
    return k === -1 ? BANCA_ORDER.length : k;
  };
  return [...by.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b, 'pt-BR'))
    .map(([banca, list]) => ({
      banca,
      items: [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || Number(b.official) - Number(a.official) || a.title.localeCompare(b.title, 'pt-BR')),
    }));
}

export function subjectsOf(items: LibraryItem[]): string[] {
  return [...new Set(items.map((i) => i.subject).filter((s): s is string => Boolean(s)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
