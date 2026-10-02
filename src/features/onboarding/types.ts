import type { SubjectArea } from '@/types/database.types';

/**
 * Tipos e rótulos compartilhados entre servidor e cliente.
 *
 * Ficam separados de `server/queries.ts` de propósito: aquele módulo importa
 * `next/headers`, e um componente de cliente que importasse dele arrastaria
 * código de servidor para dentro do bundle do navegador — o build quebra, e
 * quando não quebra é pior, porque vaza.
 */

export interface CatalogSubject {
  id: string;
  slug: string;
  name: string;
  area: SubjectArea;
  color: string;
  icon: string;
}

/** Rótulos humanos das áreas, na ordem em que devem aparecer. */
export const AREA_LABELS: Record<SubjectArea, string> = {
  linguagens: 'Linguagens',
  matematica: 'Matemática',
  ciencias: 'Ciências da Natureza',
  humanas: 'Ciências Humanas',
  tecnologia: 'Tecnologia',
  outros: 'Outros',
};

export const AREA_ORDER: SubjectArea[] = [
  'linguagens',
  'matematica',
  'ciencias',
  'humanas',
  'tecnologia',
  'outros',
];

/**
 * Disciplinas pré-marcadas quando o aluno escolhe a série.
 *
 * `subject_catalog.suggested_grade_levels` é o mecanismo de verdade e está
 * semeado vazio por enquanto, então isto cai no conjunto que toda escola
 * brasileira ensina. Pré-marcar é a diferença entre 15 toques e uma confirmação.
 */
export const CORE_SUBJECT_SLUGS = [
  'lingua-portuguesa',
  'matematica',
  'historia',
  'geografia',
  'ingles',
  'artes',
  'educacao-fisica',
] as const;
