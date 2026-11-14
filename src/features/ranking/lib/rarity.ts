import type { AchievementRarity } from '@/types/database.types';

/**
 * Rótulo e tom de cada raridade de conquista — usado no modal de perfil e na
 * tela de conquistas. Só tokens que já existem no design system (nenhuma
 * cor nova): comum = neutro, rara = verde de sucesso, épica = roxo da marca,
 * lendária = dourado (`--warning`, mesmo tom do troféu/streak em outras telas).
 */
export const RARITY_LABEL: Record<AchievementRarity, string> = {
  comum: 'Comum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
};

export const RARITY_ORDER: AchievementRarity[] = ['lendaria', 'epica', 'rara', 'comum'];

/** Mapeia direto pras variantes já existentes de `Badge` — sem className solto brigando com elas. */
export const RARITY_BADGE_VARIANT: Record<AchievementRarity, 'neutral' | 'success' | 'brand' | 'warning'> = {
  comum: 'neutral',
  rara: 'success',
  epica: 'brand',
  lendaria: 'warning',
};
