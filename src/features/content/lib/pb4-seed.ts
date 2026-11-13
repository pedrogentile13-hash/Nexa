import { buildGrande2Seed } from './grande2-seed';
import { buildGrande3Seed, type Grande3Rows } from './grande3-seed';
import { uuidV5 } from './study-seed';
import { PACOTES_PB4, PB4_TAG, RESUMOS_PB4, TRILHA_PB4 } from '../seed/pb4';

/**
 * Português do 4º bimestre, em três regras de visibilidade:
 * - RESUMOS: públicos (school_id nulo). Todas as escolas veem; é um único conjunto de linhas, sem cópia por escola.
 * - SIMULADOS: privados, da escola escolhida.
 * - TRILHA: fechada para a escola escolhida; junta os resumos públicos e os simulados privados.
 * Ids fixos: carregar de novo nunca duplica.
 */
export function buildPb4Rows(schoolId: string) {
  const resumos: Grande3Rows = buildGrande3Seed(null, RESUMOS_PB4, [], PB4_TAG);
  const simulados = buildGrande2Seed(schoolId, PACOTES_PB4, PB4_TAG);

  // Id de cada item da trilha: resumo é global (g3/global), simulado é da escola (g2/escola).
  const itemId = (slug: string) =>
    slug.startsWith('g3-') ? uuidV5(`g3/global/${slug}`) : uuidV5(`g2/${schoolId}/${slug}`);

  const trackId = uuidV5(`pb4-trilha/${schoolId}`);
  const sections: { id: string; track_id: string; position: number; title: string }[] = [];
  const lessons: {
    id: string;
    section_id: string;
    position: number;
    title: string;
    description: string | null;
    estimated_minutes: number;
    xp_reward: number;
    unlock_after_lesson_id: string | null;
  }[] = [];
  const lessonResources: {
    id: string;
    lesson_id: string;
    resource_id: string;
    position: number;
    is_required: boolean;
  }[] = [];

  let anterior: string | null = null;
  TRILHA_PB4.secoes.forEach((s, si) => {
    const sectionId = uuidV5(`pb4-secao/${schoolId}/${si + 1}`);
    sections.push({ id: sectionId, track_id: trackId, position: si + 1, title: s.titulo });
    s.licoes.forEach((l, li) => {
      const lessonId = uuidV5(`pb4-licao/${schoolId}/${si + 1}/${li + 1}`);
      lessons.push({
        id: lessonId,
        section_id: sectionId,
        position: li + 1,
        title: l.titulo,
        description: null,
        estimated_minutes: l.minutos,
        xp_reward: 20 + l.itens.length * 10,
        unlock_after_lesson_id: anterior,
      });
      anterior = lessonId;
      l.itens.forEach((slug, ii) =>
        lessonResources.push({
          id: uuidV5(`pb4-item/${schoolId}/${si + 1}/${li + 1}/${ii + 1}`),
          lesson_id: lessonId,
          resource_id: itemId(slug),
          position: ii + 1,
          is_required: true,
        }),
      );
    });
  });

  return {
    resumos: resumos.resources,
    simulados,
    track: {
      id: trackId,
      school_id: schoolId,
      subject_slug: TRILHA_PB4.subject,
      title: TRILHA_PB4.titulo,
      description: TRILHA_PB4.descricao,
      category: TRILHA_PB4.categoria,
      grade_levels: TRILHA_PB4.series,
      sort_order: 50,
    },
    sections,
    lessons,
    lessonResources,
  };
}
