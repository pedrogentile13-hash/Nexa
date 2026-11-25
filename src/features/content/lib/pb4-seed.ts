import { buildGrande2Seed } from './grande2-seed';
import { buildGrande3Seed, type Grande3Rows } from './grande3-seed';
import { uuidV5 } from './study-seed';
import { PACOTES_PB4, PB4_TAG, RESUMOS_PB4, TRILHA_PB4 } from '../seed/pb4';
import { PA7_TAG, PACOTES_PA7, RESUMOS_PA7, TRILHA_PA7 } from '../seed/pa7';
import { PA8_TAG, PACOTES_PA8, RESUMOS_PA8, TRILHA_PA8 } from '../seed/pa8';
import type { PacoteG2 } from '../seed/grande2/types';
import type { ResumoG3, TrilhaG3 } from '../seed/grande3/types';

export interface AngloSetConfig {
  /** Prefixo dos ids fixos (não mudar depois de carregado: os ids vêm dele). */
  idPrefix: string;
  tag: string;
  resumos: ResumoG3[];
  pacotes: PacoteG2[];
  trilha: TrilhaG3;
  sortOrder: number;
  /** true = cada seção da trilha abre livre (só a ordem dentro dela é em sequência). */
  chainPerSection?: boolean;
}

/**
 * Conteúdo de uma prova do colégio, em três regras de visibilidade:
 * - RESUMOS: públicos (school_id nulo). Todas as escolas veem; é um único conjunto de linhas, sem cópia por escola.
 * - SIMULADOS: privados, da escola escolhida.
 * - TRILHA: fechada para a escola escolhida; junta os resumos públicos e os simulados privados.
 * Ids fixos: carregar de novo nunca duplica.
 */
export function buildAngloRows(schoolId: string, cfg: AngloSetConfig) {
  const { idPrefix, trilha } = cfg;
  const resumos: Grande3Rows = buildGrande3Seed(null, cfg.resumos, [], cfg.tag);
  const simulados = buildGrande2Seed(schoolId, cfg.pacotes, cfg.tag);

  // Id de cada item da trilha: resumo é global (g3/global), simulado é da escola (g2/escola).
  const itemId = (slug: string) =>
    slug.startsWith('g3-') ? uuidV5(`g3/global/${slug}`) : uuidV5(`g2/${schoolId}/${slug}`);

  const trackId = uuidV5(`${idPrefix}-trilha/${schoolId}`);
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
  trilha.secoes.forEach((s, si) => {
    const sectionId = uuidV5(`${idPrefix}-secao/${schoolId}/${si + 1}`);
    sections.push({ id: sectionId, track_id: trackId, position: si + 1, title: s.titulo });
    if (cfg.chainPerSection) anterior = null;
    s.licoes.forEach((l, li) => {
      const lessonId = uuidV5(`${idPrefix}-licao/${schoolId}/${si + 1}/${li + 1}`);
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
          id: uuidV5(`${idPrefix}-item/${schoolId}/${si + 1}/${li + 1}/${ii + 1}`),
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
      subject_slug: trilha.subject,
      title: trilha.titulo,
      description: trilha.descricao,
      category: trilha.categoria,
      grade_levels: trilha.series,
      sort_order: cfg.sortOrder,
    },
    sections,
    lessons,
    lessonResources,
  };
}

/** Português do 4º bimestre (PB4). */
export function buildPb4Rows(schoolId: string) {
  return buildAngloRows(schoolId, {
    idPrefix: 'pb4',
    tag: PB4_TAG,
    resumos: RESUMOS_PB4,
    pacotes: PACOTES_PB4,
    trilha: TRILHA_PB4,
    sortOrder: 50,
    chainPerSection: true,
  });
}

/** Prova Anglo 7 (PA7), 9º ano, 2026. */
export function buildPa7Rows(schoolId: string) {
  return buildAngloRows(schoolId, {
    idPrefix: 'pa7',
    tag: PA7_TAG,
    resumos: RESUMOS_PA7,
    pacotes: PACOTES_PA7,
    trilha: TRILHA_PA7,
    sortOrder: 51,
    chainPerSection: true,
  });
}

/** Prova Anglo 8 (PA8), 9º ano, 2026: Matemática e Ciências (dia 2). */
export function buildPa8Rows(schoolId: string) {
  return buildAngloRows(schoolId, {
    idPrefix: 'pa8',
    tag: PA8_TAG,
    resumos: RESUMOS_PA8,
    pacotes: PACOTES_PA8,
    trilha: TRILHA_PA8,
    sortOrder: 52,
    chainPerSection: true,
  });
}

/**
 * A linha da trilha como o banco a aceita. `tracks` NÃO tem `published_at` (só `resources` tem): mandar essa coluna
 * faz o PostgREST recusar a carga inteira da trilha. Só as colunas abaixo existem.
 */
export const TRACK_COLUMNS = [
  'id',
  'school_id',
  'subject_catalog_id',
  'title',
  'description',
  'category',
  'grade_levels',
  'is_published',
  'sort_order',
  'created_by',
] as const;

export function pb4TrackInsertRow(
  track: ReturnType<typeof buildAngloRows>['track'],
  subjectCatalogId: string,
  userId: string,
) {
  return {
    id: track.id,
    school_id: track.school_id,
    subject_catalog_id: subjectCatalogId,
    title: track.title,
    description: track.description,
    category: track.category,
    grade_levels: track.grade_levels,
    is_published: true,
    sort_order: track.sort_order,
    created_by: userId,
  };
}
