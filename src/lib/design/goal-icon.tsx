import {
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  Rocket,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

/**
 * Ícones para metas de longo prazo — lista fechada e pequena (o aluno
 * escolhe ao criar a meta), mesma razão de `subject-icon.tsx`: preservar o
 * tree-shaking em vez de um barrel import da lib inteira.
 */
export const GOAL_ICONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'target', label: 'Alvo', Icon: Target },
  { value: 'graduation-cap', label: 'Formatura', Icon: GraduationCap },
  { value: 'trophy', label: 'Troféu', Icon: Trophy },
  { value: 'rocket', label: 'Foguete', Icon: Rocket },
  { value: 'star', label: 'Estrela', Icon: Star },
  { value: 'award', label: 'Medalha', Icon: Award },
  { value: 'briefcase', label: 'Carreira', Icon: Briefcase },
  { value: 'heart', label: 'Bem-estar', Icon: Heart },
];

export function goalIcon(name: string | null | undefined): LucideIcon {
  return GOAL_ICONS.find((g) => g.value === name)?.Icon ?? Target;
}
