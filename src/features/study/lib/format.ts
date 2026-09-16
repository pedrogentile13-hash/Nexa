import type { ResourceKind } from '@/types/database.types';

/** Rótulos e ícones dos formatos, do lado do aluno. */
export const KIND_META: Record<
  ResourceKind,
  { label: string; plural: string; verb: string; icon: string }
> = {
  resumo: { label: 'Resumo', plural: 'Resumos', verb: 'Ler', icon: 'file-text' },
  simulado: { label: 'Simulado', plural: 'Simulados', verb: 'Começar', icon: 'clipboard-list' },
  quiz: { label: 'Quiz', plural: 'Quiz', verb: 'Responder', icon: 'circle-help' },
  podcast: { label: 'Podcast', plural: 'Podcasts', verb: 'Ouvir', icon: 'headphones' },
  video: { label: 'Vídeo', plural: 'Vídeos', verb: 'Assistir', icon: 'play' },
  imagem: { label: 'Imagem', plural: 'Imagens', verb: 'Ver', icon: 'image' },
  musica: { label: 'Música', plural: 'Músicas', verb: 'Ouvir', icon: 'music' },
};

/** A ordem em que os formatos aparecem no hub — do mais usado ao mais raro. */
export const KIND_ORDER: ResourceKind[] = [
  'resumo',
  'simulado',
  'quiz',
  'podcast',
  'video',
  'imagem',
  'musica',
];

/** Segundos → "7 min" / "1h04". Duração é para estimar, não para cronometrar. */
export function humanDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return 'menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

/** Segundos → "08:24", para o player, onde cada segundo conta. */
export function clockTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
