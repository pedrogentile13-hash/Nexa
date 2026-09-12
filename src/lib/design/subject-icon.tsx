import {
  Atom,
  BinaryIcon,
  BookOpen,
  BookOpenText,
  Bot,
  Brain,
  Compass,
  FlaskConical,
  Globe2,
  HandHeart,
  HeartHandshake,
  Landmark,
  Languages,
  Leaf,
  LibraryBig,
  Microscope,
  Palette,
  PenLine,
  PiggyBank,
  Rocket,
  Sigma,
  Users,
  Volleyball,
  type LucideIcon,
} from 'lucide-react';

/**
 * Nomes kebab-case (`subjects.icon`/`subject_catalog.default_icon`, ver
 * `supabase/seed.sql`) para o componente do lucide-react.
 *
 * Lista fechada em vez de `import * as icons from 'lucide-react'`: um barrel
 * import puxaria os ~1500 ícones da lib pro bundle, matando o tree-shaking —
 * e o catálogo de matérias só usa este conjunto conhecido.
 */
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  'book-open-text': BookOpenText,
  'pen-line': PenLine,
  'library-big': LibraryBig,
  languages: Languages,
  palette: Palette,
  volleyball: Volleyball,
  sigma: Sigma,
  'piggy-bank': PiggyBank,
  leaf: Leaf,
  atom: Atom,
  'flask-conical': FlaskConical,
  microscope: Microscope,
  landmark: Landmark,
  'globe-2': Globe2,
  brain: Brain,
  users: Users,
  'heart-handshake': HeartHandshake,
  compass: Compass,
  'hand-heart': HandHeart,
  binary: BinaryIcon,
  bot: Bot,
  rocket: Rocket,
};

/** Ícone da matéria, com `BookOpen` como fallback pra nome desconhecido. */
export function subjectIcon(name: string | null | undefined): LucideIcon {
  return (name && SUBJECT_ICONS[name]) || BookOpen;
}
