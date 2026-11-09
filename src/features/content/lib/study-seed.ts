import { createHash } from 'node:crypto';
import { PACOTES, SEED_TAG, TOPICOS } from '../seed';

/** Namespace fixo: os ids saem sempre iguais, então carregar de novo nunca duplica. */
const NAMESPACE = '6e657861-7374-4964-8a73-65656463306e';

/** UUID v5 (determinístico) a partir de um nome. */
export function uuidV5(name: string, namespace = NAMESPACE): string {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(ns).update(name).digest();
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface SeedRows {
  topics: { id: string; school_id: string | null; subject_slug: string; name: string; slug: string; grade_levels: string[]; sort_order: number }[];
  resources: {
    id: string;
    school_id: string | null;
    subject_slug: string;
    topic_slug: string;
    kind: 'resumo' | 'quiz';
    title: string;
    subtitle: string;
    description: string;
    body: string | null;
    difficulty: 'facil' | 'medio' | 'dificil';
    grade_levels: string[];
    tags: string[];
    xp_reward: number;
    sort_order: number;
  }[];
  questions: { id: string; resource_id: string; topic_slug: string; position: number; statement: string; explanation: string; difficulty: 'facil' | 'medio' | 'dificil' }[];
  options: { id: string; question_id: string; position: number; body: string; is_correct: boolean }[];
}

const scopeKey = (schoolId: string | null) => schoolId ?? 'global';

/** Monta todas as linhas (tópicos, recursos, questões, alternativas) para uma escola ou para o acervo global. Tudo como rascunho. */
export function buildStudySeed(schoolId: string | null): SeedRows {
  const scope = scopeKey(schoolId);
  const bySubjectGrade = new Map<string, number>();
  const topics: SeedRows['topics'] = TOPICOS.map(([subject, grade, name, slug]) => {
    const key = `${subject}/${grade}`;
    const order = (bySubjectGrade.get(key) ?? 0) + 1;
    bySubjectGrade.set(key, order);
    return { id: uuidV5(`topic/${scope}/${subject}/${slug}`), school_id: schoolId, subject_slug: subject, name, slug, grade_levels: [grade], sort_order: order };
  });

  const subjectOf = new Map(TOPICOS.map(([subject, , , slug]) => [slug, subject]));
  const resources: SeedRows['resources'] = [];
  const questions: SeedRows['questions'] = [];
  const options: SeedRows['options'] = [];

  PACOTES.forEach((p, index) => {
    const subject = subjectOf.get(p.topic);
    if (!subject) throw new Error(`Pacote sem tópico: ${p.topic}`);
    const common = { school_id: schoolId, subject_slug: subject, topic_slug: p.topic, grade_levels: [p.grade], tags: [SEED_TAG, subject], sort_order: 100 + index };
    resources.push({ ...common, id: uuidV5(`resumo/${scope}/${p.topic}`), kind: 'resumo', title: p.title, subtitle: p.subtitle, description: p.subtitle, body: p.resumo, difficulty: 'medio', xp_reward: 10 });
    const quizId = uuidV5(`quiz/${scope}/${p.topic}`);
    resources.push({ ...common, id: quizId, kind: 'quiz', title: `Quiz: ${p.title}`, subtitle: '8 questões com explicação', description: `Teste o que você aprendeu sobre ${p.title.toLowerCase()}.`, body: null, difficulty: 'medio', xp_reward: 30 });
    p.questoes.forEach((qu, i) => {
      const qid = uuidV5(`questao/${scope}/${p.topic}/${i + 1}`);
      questions.push({ id: qid, resource_id: quizId, topic_slug: p.topic, position: i + 1, statement: qu.s, explanation: qu.e, difficulty: qu.d });
      qu.o.forEach((body, j) => options.push({ id: uuidV5(`alt/${scope}/${p.topic}/${i + 1}/${j + 1}`), question_id: qid, position: j + 1, body, is_correct: j === qu.c }));
    });
  });

  return { topics, resources, questions, options };
}
