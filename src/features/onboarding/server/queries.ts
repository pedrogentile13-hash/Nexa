import { createClient } from '@/lib/supabase/server';
import type { SubjectArea } from '@/types/database.types';
import { AREA_ORDER, type CatalogSubject } from '../types';

/**
 * O catálogo compartilhado de disciplinas, agrupado por área.
 *
 * O agrupamento importa para a grade do onboarding: 24 chips soltos são uma
 * parede, os mesmos 24 em cinco blocos rotulados se leem em poucos segundos.
 */
export async function getSubjectCatalog(): Promise<Map<SubjectArea, CatalogSubject[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subject_catalog')
    .select('id, slug, name, area, default_color, default_icon, sort_order')
    .order('sort_order');

  if (error) throw new Error(`Não consegui carregar as disciplinas: ${error.message}`);

  const grouped = new Map<SubjectArea, CatalogSubject[]>();
  for (const area of AREA_ORDER) grouped.set(area, []);

  for (const row of data ?? []) {
    grouped.get(row.area)?.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      area: row.area,
      color: row.default_color,
      icon: row.default_icon,
    });
  }

  // Remove áreas que o catálogo não popula, para não render título vazio.
  for (const [area, list] of grouped) {
    if (list.length === 0) grouped.delete(area);
  }

  return grouped;
}
