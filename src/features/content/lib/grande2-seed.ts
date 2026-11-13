import { G2_TAG, PACOTES_G2, type PacoteG2 } from '../seed/grande2';
import type { MixedSeedRows } from './mixed-seed';
import { uuidV5 } from './study-seed';
import { placeCorrect } from './vestibular-seed';

/** Dificuldade do pacote: a que mais aparece entre as questões. */
function dominante(p: PacoteG2): 'facil' | 'medio' | 'dificil' {
  const n = { facil: 0, medio: 0, dificil: 0 };
  for (const q of p.questoes) n[q.d] += 1;
  return n.dificil > n.medio && n.dificil >= n.facil
    ? 'dificil'
    : n.facil > n.medio
      ? 'facil'
      : 'medio';
}

/**
 * Monta a "Grande criação 2" como linhas do banco (mesmo formato dos pacotes mistos).
 * Ids fixos (carregar de novo nunca duplica). A alternativa certa, escrita primeiro no conteúdo,
 * vai para uma posição que roda de questão em questão, sempre igual a cada carregamento.
 */
export function buildGrande2Seed(
  schoolId: string | null,
  packages: PacoteG2[] = PACOTES_G2,
): MixedSeedRows {
  const scope = schoolId ?? 'global';
  const resources: MixedSeedRows['resources'] = [];
  const questions: MixedSeedRows['questions'] = [];
  const options: MixedSeedRows['options'] = [];

  packages.forEach((p, index) => {
    const id = uuidV5(`g2/${scope}/${p.slug}`);
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
        G2_TAG,
        p.subject,
        p.context === 'vestibular' ? 'vestibular' : 'study',
        ...(p.banca ? [p.banca] : []),
        ...(discursivas > 0 ? ['discursivas'] : []),
      ],
      grade_levels: [p.grade],
      difficulty: dominante(p),
      xp_reward: p.kind === 'simulado' ? 60 : 40,
      sort_order: 700 + index,
    });

    p.questoes.forEach((q, i) => {
      const qid = uuidV5(`g2-q/${scope}/${p.slug}/${i + 1}`);
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
        const all = [q.ok, ...q.wrong];
        const placed = placeCorrect(all, 0, (i * 3 + index) % all.length);
        placed.options.forEach((body, j) =>
          options.push({
            id: uuidV5(`g2-alt/${scope}/${p.slug}/${i + 1}/${j + 1}`),
            question_id: qid,
            position: j + 1,
            body,
            is_correct: j === placed.correct,
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
