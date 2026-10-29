import type { TrackCategory } from '@/types/database.types';

/** Rótulos de categoria de trilha — usados na criação (admin) e na listagem (aluno). */
export const TRACK_CATEGORIES: { value: TrackCategory; label: string }[] = [
  { value: 'enem', label: 'ENEM' },
  { value: 'fundamental', label: 'Fundamental' },
  { value: 'reforco', label: 'Reforço' },
  { value: 'carreiras', label: 'Carreiras' },
  { value: 'habilidades', label: 'Habilidades' },
];

export function trackCategoryLabel(category: string): string {
  return TRACK_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
