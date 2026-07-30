/**
 * Subject palette.
 *
 * Subjects store a TOKEN (`'blue'`), never a hex value, and never a free color
 * picked from a full-spectrum wheel. Two reasons, both practical:
 *
 *   • Charts. Recharts needs a stable, mutually distinguishable series color. A
 *     student who picks three shades of yellow makes the Desempenho screen
 *     unreadable, and no amount of chart code can fix it afterwards.
 *   • Dark mode. Every token carries a light AND a dark value. A stored hex
 *     would look right in one theme and wrong in the other.
 *
 * `soft`/`onSoft` are the badge pair (tinted background + text with adequate
 * contrast on it); `base` is the chart/accent color.
 */

export interface SubjectColor {
  token: SubjectColorToken;
  label: string;
  light: { base: string; soft: string; onSoft: string };
  dark: { base: string; soft: string; onSoft: string };
}

export const SUBJECT_COLOR_TOKENS = [
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'slate',
  'stone',
] as const;

export type SubjectColorToken = (typeof SUBJECT_COLOR_TOKENS)[number];

export const SUBJECT_COLORS: Record<SubjectColorToken, SubjectColor> = {
  blue: t('blue', 'Azul', '#2563eb', '#eaf1fe', '#1c3f8f', '#5b93f8', '#15243d', '#bcd4fd'),
  indigo: t('indigo', 'Índigo', '#4f46e5', '#ecebfd', '#302a8f', '#8b83f5', '#1c1a3d', '#cdc9fd'),
  violet: t('violet', 'Violeta', '#7c3aed', '#f2ebfe', '#4a2391', '#a482f7', '#231640', '#dccdfd'),
  purple: t('purple', 'Púrpura', '#9333ea', '#f6ebfd', '#571f8d', '#bd82f7', '#2a1440', '#e6cdfd'),
  fuchsia: t('fuchsia', 'Fúcsia', '#c026d3', '#fbeafd', '#71177d', '#e07cec', '#3a1140', '#f5cbfa'),
  pink: t('pink', 'Rosa', '#db2777', '#fdeaf2', '#821846', '#f27bab', '#3d1024', '#fbc9dd'),
  rose: t('rose', 'Rubro', '#e11d48', '#fdeaee', '#87112b', '#f4788e', '#3d0f18', '#fbc7d1'),
  red: t('red', 'Vermelho', '#dc2626', '#fdeceb', '#851616', '#f47d7d', '#3d1211', '#fbc9c9'),
  orange: t('orange', 'Laranja', '#ea580c', '#fdefe6', '#8c3407', '#f79151', '#3f1c08', '#fbd5b9'),
  amber: t('amber', 'Âmbar', '#b45309', '#fdf3e3', '#6f3306', '#e9a13c', '#33210a', '#f6ddab'),
  yellow: t('yellow', 'Amarelo', '#a16207', '#fdf7e0', '#653c04', '#d8b13a', '#2d2409', '#f0e0a4'),
  lime: t('lime', 'Limão', '#4d7c0f', '#f0f8e3', '#2e4a09', '#9dc95a', '#1e2b0a', '#d5eaa8'),
  green: t('green', 'Verde', '#15803d', '#e7f6ec', '#0c4c24', '#4fc07c', '#0c2716', '#b6e6c8'),
  emerald: t(
    'emerald',
    'Esmeralda',
    '#047857',
    '#e3f6f0',
    '#024635',
    '#34c19b',
    '#07271f',
    '#a9e7d7',
  ),
  teal: t('teal', 'Turquesa', '#0f766e', '#e3f5f4', '#094642', '#38bdb3', '#082725', '#abe6e2'),
  cyan: t('cyan', 'Ciano', '#0e7490', '#e4f4f9', '#084456', '#38b5d6', '#082830', '#aee2ef'),
  sky: t('sky', 'Celeste', '#0369a1', '#e5f2fa', '#023f61', '#3aabe4', '#08222f', '#b0dcf3'),
  slate: t('slate', 'Grafite', '#475569', '#eef0f3', '#2b333f', '#8d9aad', '#1a1e26', '#ccd3dd'),
  stone: t('stone', 'Pedra', '#57534e', '#f1efee', '#33302d', '#9b9490', '#211f1d', '#d6d1cd'),
};

function t(
  token: SubjectColorToken,
  label: string,
  lightBase: string,
  lightSoft: string,
  lightOnSoft: string,
  darkBase: string,
  darkSoft: string,
  darkOnSoft: string,
): SubjectColor {
  return {
    token,
    label,
    light: { base: lightBase, soft: lightSoft, onSoft: lightOnSoft },
    dark: { base: darkBase, soft: darkSoft, onSoft: darkOnSoft },
  };
}

const FALLBACK: SubjectColorToken = 'blue';

/** Resolves a stored token, tolerating anything unexpected in the database. */
export function subjectColor(token: string | null | undefined): SubjectColor {
  if (token && token in SUBJECT_COLORS) {
    return SUBJECT_COLORS[token as SubjectColorToken];
  }
  return SUBJECT_COLORS[FALLBACK];
}

/**
 * CSS custom properties for a subject, so a component can theme itself with
 * `style={subjectColorVars(subject.color)}` and then use
 * `bg-[var(--subject-soft)] text-[var(--subject-on-soft)]`.
 *
 * `light-dark()` lets one declaration serve both themes without JS knowing
 * which is active, which keeps this usable from Server Components.
 */
export function subjectColorVars(token: string | null | undefined): React.CSSProperties {
  const c = subjectColor(token);
  return {
    '--subject-base': `light-dark(${c.light.base}, ${c.dark.base})`,
    '--subject-soft': `light-dark(${c.light.soft}, ${c.dark.soft})`,
    '--subject-on-soft': `light-dark(${c.light.onSoft}, ${c.dark.onSoft})`,
  } as React.CSSProperties;
}

/**
 * Chart series colors, in an order chosen so adjacent series stay
 * distinguishable — including for the most common forms of color blindness,
 * where hue alone is not enough and the lightness steps carry the difference.
 */
export const CHART_SERIES_ORDER: readonly SubjectColorToken[] = [
  'blue',
  'orange',
  'teal',
  'rose',
  'violet',
  'amber',
  'green',
  'cyan',
  'pink',
  'lime',
  'indigo',
  'red',
  'emerald',
  'purple',
  'sky',
  'slate',
];
