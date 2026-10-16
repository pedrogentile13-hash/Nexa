import { formatGrade } from '@/lib/format/grade';

/**
 * Como uma nota automática vira cor/frase na tela.
 *
 * Generalizados a partir do antigo sistema de notas manuais: a fórmula não
 * mudou (a nota é que agora nasce automática), só o dado de entrada — três
 * números soltos (nota, aprovação, meta) em vez de uma linha de view.
 */

/**
 * Severidade da matéria, para ordenar "onde eu preciso olhar primeiro".
 *
 * Uma matéria sem nenhuma tentativa de quiz/simulado nunca é 'critical' —
 * ausência de dado não é o mesmo que dado ruim, e apresentar as duas da
 * mesma forma soa como cobrança sem fundamento.
 */
export type SubjectRisk = 'unknown' | 'ok' | 'watch' | 'critical';

export function subjectRisk(
  grade: number | null,
  passing: number,
  target: number | null,
): SubjectRisk {
  if (grade === null) return 'unknown';
  if (grade < passing) return 'critical';
  // A meio ponto de reprovar, ou abaixo da meta que o próprio aluno definiu.
  if (grade < passing + 0.5) return 'watch';
  if (target !== null && grade < target) return 'watch';
  return 'ok';
}

/**
 * Tom da nota grande no cartão da matéria.
 *
 * Quatro degraus: abaixo da aprovação por mais de 1 ponto é vermelho, entre 0
 * e 1 ponto abaixo é laranja (recuperável, não é a mesma urgência), acima da
 * aprovação mas abaixo da meta é neutro, meta batida é verde.
 */
export type GradeTone = 'danger' | 'warning' | 'neutral' | 'success';

export function gradeTone(grade: number | null, passing: number, target: number | null): GradeTone {
  if (grade === null) return 'neutral';
  if (grade < passing - 1) return 'danger';
  if (grade < passing) return 'warning';
  if (target !== null && grade < target) return 'neutral';
  return 'success';
}

/**
 * A etiqueta que explica a nota em uma frase curta.
 *
 * Sempre mede contra a referência que importa naquele momento: quem está
 * abaixo da aprovação precisa saber quanto falta para passar, não quanto
 * falta para a meta pessoal.
 */
export function gradeHint(
  grade: number | null,
  passing: number,
  target: number | null,
): { label: string; tone: GradeTone } | null {
  if (grade === null) return null;

  if (grade < passing) {
    return { label: `${formatGrade(passing - grade, 1)} abaixo da aprovação`, tone: 'danger' };
  }
  if (target !== null && grade < target) {
    return { label: `${formatGrade(target - grade, 1)} para a meta`, tone: 'warning' };
  }
  return { label: 'meta batida', tone: 'success' };
}
