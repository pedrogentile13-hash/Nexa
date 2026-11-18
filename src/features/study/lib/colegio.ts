import type { ResourceKind } from '@/types/database.types';

/**
 * Biblioteca do colégio ("Nexa Escolas"): o quarto filtro da Biblioteca. Mostra o conteúdo feito para as provas da
 * escola, em blocos como a estante do Vestibular: ano → matéria → prova (PB4, PA7, PA8…). Fica só no Nexa Escolas, e só
 * para alunos de um colégio que tem coleção cadastrada aqui.
 *
 * Cada prova é identificada por UMA tag que o carregador do Admin põe nos conteúdos (ver `PB4_TAG` e `PA7_TAG`).
 */

export interface ColegioBlock {
  /** Sigla da prova, no azulejo. */
  code: string;
  year: number;
  title: string;
  subtitle: string;
  /** Tag que os conteúdos dessa prova carregam. */
  tag: string;
  /** Cores do azulejo (gradiente). */
  from: string;
  to: string;
}

export interface ColegioConfig {
  /** Reconhece o colégio pelo nome. */
  match: RegExp;
  label: string;
  short: string;
  /** Anos no filtro, do mais novo ao mais antigo. */
  years: number[];
  blocks: ColegioBlock[];
}

export const COLEGIOS: ColegioConfig[] = [
  {
    match: /anglo\s+morumbi/i,
    label: 'Colégio Anglo Morumbi',
    short: 'Anglo Morumbi',
    years: [2026, 2025],
    blocks: [
      {
        code: 'PB4',
        year: 2026,
        title: 'PB4',
        subtitle: 'Português, Química e Produção de Texto · 4º bimestre',
        tag: 'pb4-portugues',
        from: '#0B1B3F',
        to: '#1E4FA0',
      },
      {
        code: 'PA7',
        year: 2026,
        title: 'PA7',
        subtitle: 'Prova Anglo 7 · 9º ano',
        tag: 'pa7-prova-anglo',
        from: '#4C1D95',
        to: '#7C3AED',
      },
      {
        code: 'PA8',
        year: 2026,
        title: 'PA8',
        subtitle: 'Prova Anglo 8 · 9º ano',
        tag: 'pa8-prova-anglo',
        from: '#0F4C3A',
        to: '#10B981',
      },
    ],
  },
];

export function findColegio(schoolName: string | null | undefined): ColegioConfig | null {
  if (!schoolName) return null;
  return COLEGIOS.find((c) => c.match.test(schoolName)) ?? null;
}

/** Tudo o que a Biblioteca do colégio precisa de cada conteúdo. */
export interface ColegioItem {
  id: string;
  kind: ResourceKind;
  title: string;
  subjectName: string;
  subjectColor: string;
  questionCount: number;
  durationSeconds: number | null;
  progressPercent: number;
  tags: string[];
}

export interface ColegioTile {
  block: ColegioBlock;
  items: ColegioItem[];
}

export interface ColegioSubject {
  name: string;
  color: string;
  tiles: ColegioTile[];
}

export interface ColegioView {
  label: string;
  short: string;
  years: number[];
  year: number;
  subjects: ColegioSubject[];
}

/** O simulado que cobre todas as matérias (o "FINAL") não pertence a uma matéria só. */
export const TODAS_AS_MATERIAS = 'Todas as matérias';
const isFinal = (item: ColegioItem) => /\bfinal\b/i.test(item.title);

const KIND_RANK: Record<string, number> = { resumo: 0, quiz: 1, simulado: 2 };

/** Ordem de estudo: resumos, depois quizzes, depois simulados; dentro de cada um, pelo título. */
export function sortColegioItems(items: ColegioItem[]): ColegioItem[] {
  return [...items].sort(
    (a, b) =>
      (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9) ||
      a.title.localeCompare(b.title, 'pt-BR', { numeric: true }),
  );
}

/** Agrupa os itens do ano escolhido por matéria e, dentro dela, por prova. */
export function buildColegioView(
  config: ColegioConfig,
  items: ColegioItem[],
  year: number,
): ColegioView {
  const blocks = config.blocks.filter((b) => b.year === year);
  const subjects = new Map<string, ColegioSubject>();

  for (const block of blocks) {
    const doBloco = items.filter((i) => i.tags.includes(block.tag));
    const porMateria = new Map<string, ColegioItem[]>();
    for (const item of doBloco) {
      const name = isFinal(item) ? TODAS_AS_MATERIAS : item.subjectName;
      porMateria.set(name, [...(porMateria.get(name) ?? []), item]);
    }
    for (const [name, list] of porMateria) {
      const color = list[0]?.subjectColor ?? '#6D28D9';
      const subject = subjects.get(name) ?? { name, color, tiles: [] };
      subject.tiles.push({ block, items: sortColegioItems(list) });
      subjects.set(name, subject);
    }
  }

  // "Todas as matérias" primeiro; as demais em ordem alfabética.
  const sorted = [...subjects.values()].sort((a, b) =>
    a.name === TODAS_AS_MATERIAS
      ? -1
      : b.name === TODAS_AS_MATERIAS
        ? 1
        : a.name.localeCompare(b.name, 'pt-BR'),
  );
  return {
    label: config.label,
    short: config.short,
    years: config.years,
    year,
    subjects: sorted,
  };
}

export function pickYear(config: ColegioConfig, wanted: string | null | undefined): number {
  const n = Number(wanted);
  if (config.years.includes(n)) return n;
  // Padrão: o ano mais novo que já tem conteúdo.
  return config.blocks.map((b) => b.year).sort((a, b) => b - a)[0] ?? config.years[0] ?? 0;
}
