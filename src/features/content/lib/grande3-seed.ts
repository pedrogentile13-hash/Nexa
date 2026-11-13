import { G3_TAG, RESUMOS_G3, TRILHAS, type ResumoG3, type TrilhaG3 } from '../seed/grande3';
import { uuidV5 } from './study-seed';

export interface Grande3Rows {
  resources: {
    id: string;
    school_id: string | null;
    subject_slug: string;
    context: 'school' | 'vestibular';
    title: string;
    subtitle: string;
    description: string;
    body: string;
    grade_levels: string[];
    tags: string[];
    duration_seconds: number;
    sort_order: number;
  }[];
  tracks: {
    id: string;
    school_id: string | null;
    subject_slug: string;
    title: string;
    description: string;
    category: TrilhaG3['categoria'];
    grade_levels: string[];
    sort_order: number;
  }[];
  sections: { id: string; track_id: string; position: number; title: string }[];
  lessons: {
    id: string;
    section_id: string;
    position: number;
    title: string;
    description: string | null;
    estimated_minutes: number;
    xp_reward: number;
    unlock_after_lesson_id: string | null;
  }[];
  lessonResources: {
    id: string;
    lesson_id: string;
    resource_id: string;
    position: number;
    is_required: boolean;
  }[];
}

/** Id fixo de um item citado numa trilha: resumo desta criação (g3-…) ou quiz/simulado da Grande criação 2 (g2-…). */
export function itemResourceId(scope: string, slug: string): string {
  return slug.startsWith('g3-') ? uuidV5(`g3/${scope}/${slug}`) : uuidV5(`g2/${scope}/${slug}`);
}

/** Minutos de leitura: ~180 palavras por minuto, mínimo 2. */
export function minutosLeitura(body: string): number {
  return Math.max(2, Math.round(body.split(/\s+/).filter(Boolean).length / 180));
}

/**
 * Monta a "Grande criação 3" (resumos e trilhas) como linhas do banco. Ids fixos: criar de novo nunca duplica.
 * Cada lição desbloqueia depois da anterior (o caminho da trilha).
 */
export function buildGrande3Seed(
  schoolId: string | null,
  resumos: ResumoG3[] = RESUMOS_G3,
  trilhas: TrilhaG3[] = TRILHAS,
  tag: string = G3_TAG,
): Grande3Rows {
  const scope = schoolId ?? 'global';
  const resources: Grande3Rows['resources'] = resumos.map((r, i) => ({
    id: itemResourceId(scope, r.slug),
    school_id: schoolId,
    subject_slug: r.subject,
    context: r.context,
    title: r.title,
    subtitle: r.subtitle,
    description: r.subtitle,
    body: r.body,
    grade_levels: [r.grade],
    tags: [
      tag,
      r.subject,
      r.context === 'vestibular' ? 'vestibular' : 'study',
      ...(r.slug.startsWith('g3-plano-') ? ['plano-de-estudo'] : []),
    ],
    duration_seconds: minutosLeitura(r.body) * 60,
    sort_order: 900 + i,
  }));

  const tracks: Grande3Rows['tracks'] = [];
  const sections: Grande3Rows['sections'] = [];
  const lessons: Grande3Rows['lessons'] = [];
  const lessonResources: Grande3Rows['lessonResources'] = [];

  trilhas.forEach((t, ti) => {
    const trackId = uuidV5(`g3-trilha/${scope}/${t.slug}`);
    tracks.push({
      id: trackId,
      school_id: schoolId,
      subject_slug: t.subject,
      title: t.titulo,
      description: t.descricao,
      category: t.categoria,
      grade_levels: t.series,
      sort_order: 50 + ti,
    });
    let anterior: string | null = null;
    t.secoes.forEach((s, si) => {
      const sectionId = uuidV5(`g3-secao/${scope}/${t.slug}/${si + 1}`);
      sections.push({ id: sectionId, track_id: trackId, position: si + 1, title: s.titulo });
      s.licoes.forEach((l, li) => {
        const lessonId = uuidV5(`g3-licao/${scope}/${t.slug}/${si + 1}/${li + 1}`);
        lessons.push({
          id: lessonId,
          section_id: sectionId,
          position: li + 1,
          title: l.titulo,
          description: l.descricao ?? null,
          estimated_minutes: l.minutos,
          xp_reward: 20 + l.itens.length * 10,
          unlock_after_lesson_id: anterior,
        });
        anterior = lessonId;
        l.itens.forEach((slug, ii) =>
          lessonResources.push({
            id: uuidV5(`g3-item/${scope}/${t.slug}/${si + 1}/${li + 1}/${ii + 1}`),
            lesson_id: lessonId,
            resource_id: itemResourceId(scope, slug),
            position: ii + 1,
            is_required: true,
          }),
        );
      });
    });
  });

  return { resources, tracks, sections, lessons, lessonResources };
}
