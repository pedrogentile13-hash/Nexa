import type { ExamFileItem } from '../server/queries';
import { pairingKey } from './classify-file';

export type ReadableFile = ExamFileItem & { kind: 'caderno' | 'gabarito' };

export const isReadable = (f: ExamFileItem): f is ReadableFile => f.kind === 'caderno' || f.kind === 'gabarito';

/** O caderno e o gabarito do mesmo dia e cor (ou, sem isso, do mesmo rótulo). */
export function pairOf(files: ExamFileItem[], current: ExamFileItem): { caderno: ReadableFile | null; gabarito: ReadableFile | null } {
  const same = files.filter((f): f is ReadableFile => isReadable(f) && pairingKey(f.label) === pairingKey(current.label));
  return {
    caderno: same.find((f) => f.kind === 'caderno') ?? null,
    gabarito: same.find((f) => f.kind === 'gabarito') ?? null,
  };
}

/** Uma entrada por rótulo (um caderno), na ordem do cadastro, apontando para o caderno ou, se não houver, o gabarito. */
export function readerEntries(files: ExamFileItem[]): { label: string; target: ReadableFile }[] {
  const seen = new Map<string, ReadableFile>();
  for (const f of files.filter(isReadable)) {
    const key = pairingKey(f.label);
    const cur = seen.get(key);
    if (!cur || (cur.kind === 'gabarito' && f.kind === 'caderno')) seen.set(key, f);
  }
  return [...seen.values()].map((target) => ({ label: target.label, target }));
}
