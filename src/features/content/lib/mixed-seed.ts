import { MISTO_TAG, type PacoteMisto } from '../seed/misto/types';
import { PACOTES_MISTOS } from '../seed/misto';
import { uuidV5 } from './study-seed';

export interface MixedSeedRows {
  resources: {
    id: string;
    school_id: string | null;
    subject_slug: string;
    kind: 'quiz' | 'simulado';
    context: 'study' | 'vestibular';
    exam_slug: string | null;
    title: string;
    subtitle: string;
    description: string;
    time_limit_seconds: number | null;
    tags: string[];
    grade_levels: string[];
    difficulty: 'facil' | 'medio' | 'dificil';
    xp_reward: number;
    sort_order: number;
  }[];
  questions: {
    id: string;
    resource_id: string;
    position: number;
    statement: string;
    explanation: string | null;
    difficulty: 'facil' | 'medio' | 'dificil';
    kind: 'objetiva' | 'discursiva';
    model_answer: string | null;
    rubric: string | null;
  }[];
  options: {
    id: string;
    question_id: string;
    position: number;
    body: string;
    is_correct: boolean;
  }[];
}

/** Dificuldade do pacote: a que mais aparece entre as questões. */
export function dominantDifficulty(p: PacoteMisto): 'facil' | 'medio' | 'dificil' {
  const count = { facil: 0, medio: 0, dificil: 0 };
  for (const q of p.questoes) count[q.d] += 1;
  return count.dificil > count.medio && count.dificil >= count.facil
    ? 'dificil'
    : count.facil > count.medio
      ? 'facil'
      : 'medio';
}

/** Monta os pacotes mistos como linhas do banco. Ids fixos: carregar de novo nunca duplica. */
export function buildMixedSeed(
  schoolId: string | null,
  packages: PacoteMisto[] = PACOTES_MISTOS,
): MixedSeedRows {
  const scope = schoolId ?? 'global';
  const resources: MixedSeedRows['resources'] = [];
  const questions: MixedSeedRows['questions'] = [];
  const options: MixedSeedRows['options'] = [];

  packages.forEach((p, index) => {
    const id = uuidV5(`misto/${scope}/${p.slug}`);
    const discursivas = p.questoes.filter((q) => q.k === 'd').length;
    resources.push({
      id,
      school_id: schoolId,
      subject_slug: p.subject,
      kind: p.kind,
      context: p.context,
      exam_slug: p.banca ?? null,
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      time_limit_seconds: p.kind === 'simulado' && p.minutes ? p.minutes * 60 : null,
      tags: [
        MISTO_TAG,
        p.subject,
        p.context === 'vestibular' ? 'segunda-fase' : 'misto',
        ...(discursivas > 0 ? ['discursivas'] : []),
      ],
      grade_levels: [p.grade],
      difficulty: dominantDifficulty(p),
      xp_reward: p.kind === 'simulado' ? 60 : 40,
      sort_order: 500 + index,
    });

    p.questoes.forEach((q, i) => {
      const qid = uuidV5(`misto-q/${scope}/${p.slug}/${i + 1}`);
      if (q.k === 'o') {
        questions.push({
          id: qid,
          resource_id: id,
          position: i + 1,
          statement: q.s,
          explanation: q.e,
          difficulty: q.d,
          kind: 'objetiva',
          model_answer: null,
          rubric: null,
        });
        q.o.forEach((body, j) =>
          options.push({
            id: uuidV5(`misto-alt/${scope}/${p.slug}/${i + 1}/${j + 1}`),
            question_id: qid,
            position: j + 1,
            body,
            is_correct: j === q.c,
          }),
        );
      } else {
        questions.push({
          id: qid,
          resource_id: id,
          position: i + 1,
          statement: q.s,
          explanation: q.e ?? null,
          difficulty: q.d,
          kind: 'discursiva',
          model_answer: q.ref,
          rubric: q.crit,
        });
      }
    });
  });

  return { resources, questions, options };
}
