import { SIMULADOS_VESTIBULAR, VEST_TAG, BANCA_LABEL } from '../seed/vestibular';
import { uuidV5 } from './study-seed';

export interface VestibularSeedRows {
  resources: {
    id: string;
    school_id: string | null;
    subject_slug: string;
    exam_slug: string;
    title: string;
    subtitle: string;
    description: string;
    duration_seconds: number;
    tags: string[];
    grade_levels: string[];
    difficulty: 'facil' | 'medio' | 'dificil';
    xp_reward: number;
    sort_order: number;
  }[];
  questions: { id: string; resource_id: string; position: number; statement: string; explanation: string; difficulty: 'facil' | 'medio' | 'dificil' }[];
  options: { id: string; question_id: string; position: number; body: string; is_correct: boolean }[];
}

/**
 * Põe a alternativa certa numa posição que roda de questão em questão (A, D, B, E, C…), mantendo a ordem das outras.
 * Assim a certa nunca fica sempre no mesmo lugar, sem sorteio: o resultado é igual em todo carregamento.
 */
export function placeCorrect(options: string[], correct: number, target: number): { options: string[]; correct: number } {
  const rest = options.filter((_, i) => i !== correct);
  const at = Math.min(Math.max(target, 0), options.length - 1);
  return { options: [...rest.slice(0, at), options[correct]!, ...rest.slice(at)], correct: at };
}

/** Monta os simulados de vestibular (ENEM, Fuvest, Unicamp, Unesp) como linhas do banco. Ids fixos: carregar de novo nunca duplica. */
export function buildVestibularSeed(schoolId: string | null): VestibularSeedRows {
  const scope = schoolId ?? 'global';
  const resources: VestibularSeedRows['resources'] = [];
  const questions: VestibularSeedRows['questions'] = [];
  const options: VestibularSeedRows['options'] = [];

  SIMULADOS_VESTIBULAR.forEach((s, index) => {
    const id = uuidV5(`vest-simulado/${scope}/${s.slug}`);
    const hard = s.questoes.filter((q) => q.d === 'dificil').length;
    resources.push({
      id,
      school_id: schoolId,
      subject_slug: s.subject,
      exam_slug: s.banca,
      title: s.title,
      subtitle: s.subtitle,
      description: `Simulado no estilo ${BANCA_LABEL[s.banca]}: ${s.questoes.length} questões, ${s.minutes} minutos. Use o quadro branco para rascunhar e confira a explicação de cada questão no fim.`,
      duration_seconds: s.minutes * 60,
      tags: [VEST_TAG, 'vestibular', s.banca],
      grade_levels: ['3º EM'],
      difficulty: hard >= 2 ? 'dificil' : 'medio',
      xp_reward: 60,
      sort_order: 50 + index,
    });
    s.questoes.forEach((q, i) => {
      const qid = uuidV5(`vest-questao/${scope}/${s.slug}/${i + 1}`);
      questions.push({ id: qid, resource_id: id, position: i + 1, statement: q.s, explanation: q.e, difficulty: q.d });
      const placed = placeCorrect(q.o, q.c, (i * 3 + index) % q.o.length);
      placed.options.forEach((body, j) => options.push({ id: uuidV5(`vest-alt/${scope}/${s.slug}/${i + 1}/${j + 1}`), question_id: qid, position: j + 1, body, is_correct: j === placed.correct }));
    });
  });

  return { resources, questions, options };
}
