import type { Difficulty, ResourceKind } from '@/types/database.types';

/**
 * Rótulos e ícones dos sete formatos.
 *
 * Em um lugar só porque aparecem na lista, no formulário, no card do aluno e no
 * hub — quatro cópias de "podcast" divergem no dia em que alguém renomeia uma.
 */

export const RESOURCE_KINDS: {
  value: ResourceKind;
  label: string;
  plural: string;
  icon: string;
  hint: string;
}[] = [
  {
    value: 'resumo',
    label: 'Resumo',
    plural: 'Resumos',
    icon: 'file-text',
    hint: 'Texto para ler',
  },
  {
    value: 'simulado',
    label: 'Simulado',
    plural: 'Simulados',
    icon: 'clipboard-list',
    hint: 'Prova completa, com tempo',
  },
  {
    value: 'quiz',
    label: 'Quiz',
    plural: 'Quiz',
    icon: 'circle-help',
    hint: 'Curto, com resposta na hora',
  },
  {
    value: 'podcast',
    label: 'Podcast',
    plural: 'Podcasts',
    icon: 'headphones',
    hint: 'Áudio com capítulos',
  },
  { value: 'video', label: 'Vídeo', plural: 'Vídeos', icon: 'play', hint: 'Aula em vídeo' },
  {
    value: 'imagem',
    label: 'Imagem',
    plural: 'Imagens',
    icon: 'image',
    hint: 'Mapa, fórmula, esquema',
  },
  {
    value: 'musica',
    label: 'Música',
    plural: 'Músicas',
    icon: 'music',
    hint: 'Áudio para memorizar',
  },
];

export function kindLabel(kind: ResourceKind): string {
  return RESOURCE_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export function kindPlural(kind: ResourceKind): string {
  return RESOURCE_KINDS.find((k) => k.value === kind)?.plural ?? kind;
}

/** Formatos que carregam mídia: para eles o painel mostra o campo de upload. */
export const MEDIA_KINDS: ResourceKind[] = ['podcast', 'video', 'imagem', 'musica'];

/** Formatos feitos de questões: para eles o painel abre o editor de questões. */
export const QUESTION_KINDS: ResourceKind[] = ['quiz', 'simulado'];

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

export const AREAS = [
  { value: 'linguagens', label: 'Linguagens' },
  { value: 'matematica', label: 'Matemática' },
  { value: 'ciencias', label: 'Ciências' },
  { value: 'humanas', label: 'Humanas' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'outros', label: 'Outros' },
] as const;

/** Segundos → "12 min" / "1 h 04". Duração é para ler, não para calcular. */
export function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
}
