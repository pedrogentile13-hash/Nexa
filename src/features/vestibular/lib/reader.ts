import type { ExamFileItem } from '../server/queries';

export type ReadableFile = ExamFileItem & { kind: 'caderno' | 'gabarito' };

export const isReadable = (f: ExamFileItem): f is ReadableFile => f.kind === 'caderno' || f.kind === 'gabarito';

/** O caderno e o gabarito do mesmo rótulo ("1º dia · Caderno 2"). */
export function pairOf(files: ExamFileItem[], current: ExamFileItem): { caderno: ReadableFile | null; gabarito: ReadableFile | null } {
  const same = files.filter((f): f is ReadableFile => isReadable(f) && f.label === current.label);
  return {
    caderno: same.find((f) => f.kind === 'caderno') ?? null,
    gabarito: same.find((f) => f.kind === 'gabarito') ?? null,
  };
}

/** Uma entrada por rótulo (um caderno), na ordem do cadastro, apontando para o caderno ou, se não houver, o gabarito. */
export function readerEntries(files: ExamFileItem[]): { label: string; target: ReadableFile }[] {
  const seen = new Map<string, ReadableFile>();
  for (const f of files.filter(isReadable)) {
    const cur = seen.get(f.label);
    if (!cur || (cur.kind === 'gabarito' && f.kind === 'caderno')) seen.set(f.label, f);
  }
  return [...seen.entries()].map(([label, target]) => ({ label, target }));
}
