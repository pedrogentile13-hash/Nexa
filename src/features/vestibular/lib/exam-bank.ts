import type { VestibularResource, ExamEditionSummary } from '../server/queries';

export interface ExamBankItem {
  key: string;
  /** Recurso a abrir; ausente = "Em breve". */
  resourceId: string | null;
  title: string;
  examName: string | null;
  year: number | null;
  coverLabel: string | null;
  coverUrl: string | null;
  official: boolean;
  subjectName: string | null;
  questionCount: number;
  bestPercent: number | null;
}

/** "ENEM 2024 — Dia 1" → "Dia 1": o que sobra do título depois de tirar a prova e o ano. */
export function coverLabel(title: string, examName: string | null, year: number | null): string | null {
  let rest = title;
  if (examName) rest = rest.replace(new RegExp(examName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '');
  if (year) rest = rest.replace(String(year), '');
  rest = rest.replace(/^[\s\-–—:·|]+|[\s\-–—:·|]+$/g, '').replace(/\s{2,}/g, ' ');
  return rest || null;
}

/**
 * Junta recursos publicados e edições cadastradas num único banco: cada recurso
 * é um cartão; edição sem nenhum recurso vira cartão "Em breve".
 * Mais recentes primeiro; dentro do ano, provas oficiais antes dos simulados.
 */
export function buildExamBank(resources: VestibularResource[], editions: ExamEditionSummary[]): ExamBankItem[] {
  const items: ExamBankItem[] = resources.map((r) => ({
    key: `r-${r.id}`,
    resourceId: r.id,
    title: r.title,
    examName: r.examName,
    year: r.editionYear,
    coverLabel: coverLabel(r.title, r.examName, r.editionYear),
    coverUrl: editions.find((e) => e.examName === r.examName)?.coverUrl ?? null,
    official: r.editionYear !== null,
    subjectName: r.subjectName,
    questionCount: r.questionCount,
    bestPercent: r.myBestPercent,
  }));

  const withContent = new Set(resources.filter((r) => r.editionYear !== null).map((r) => `${r.examName}|${r.editionYear}`));
  for (const e of editions) {
    if (withContent.has(`${e.examName}|${e.year}`)) continue;
    items.push({
      key: `e-${e.id}`,
      resourceId: null,
      title: `${e.examName} ${e.year}`,
      examName: e.examName,
      year: e.year,
      coverLabel: 'Em breve',
      coverUrl: e.coverUrl,
      official: true,
      subjectName: null,
      questionCount: 0,
      bestPercent: null,
    });
  }

  return items.sort(
    (a, b) =>
      (b.year ?? 0) - (a.year ?? 0) ||
      Number(b.official) - Number(a.official) ||
      Number(b.resourceId !== null) - Number(a.resourceId !== null) ||
      a.title.localeCompare(b.title, 'pt-BR'),
  );
}
