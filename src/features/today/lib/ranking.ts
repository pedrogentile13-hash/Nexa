/**
 * O que eu preciso fazer hoje?
 *
 * A especificação dedica a tela mais importante do produto a esta pergunta e
 * deixa a lógica sem definir. Uma lista ordenada por data não responde: a prova
 * que vale 35% da média em três dias importa mais que a lição de casa de
 * amanhã, e o aluno sabe disso — se o app não souber, ele para de confiar na
 * ordem e volta a decidir sozinho, que é exatamente o problema que o Nexa
 * existe para resolver.
 *
 * O score combina três fatores, e é deliberadamente EXPLICÁVEL: cada item
 * carrega o motivo pelo qual está onde está, em uma frase que o aluno lê.
 * Um ranking que ninguém entende é um ranking em que ninguém confia.
 *
 *   urgência  — quão perto está a data
 *   impacto   — quanto isso mexe na média (peso da categoria × peso do item)
 *   risco     — quão longe a disciplina está da meta ou da média de aprovação
 *
 * score = urgência × (1 + impacto) × (1 + risco)
 *
 * A multiplicação é intencional: um item sem urgência nenhuma não sobe só por
 * ser pesado, e um item urgente de uma disciplina tranquila não afoga um item
 * urgente de uma disciplina em risco.
 */

export type FocusKind = 'assessment' | 'task' | 'routine';

export interface FocusCandidate {
  id: string;
  kind: FocusKind;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  /** ISO date (YYYY-MM-DD). `null` = sem data marcada. */
  dueDate: string | null;
  /** Peso da categoria na média final, 0–100. Só para avaliações. */
  categoryWeightPercent?: number | null;
  /** Peso do item dentro da categoria. */
  itemWeight?: number | null;
  /** Sigla da categoria, para a explicação ("PB", "VA"). */
  categoryCode?: string | null;
  /** Média atual da disciplina, se houver. */
  subjectAverage?: number | null;
  /** Meta da disciplina, se definida. */
  subjectTarget?: number | null;
  /** Média mínima de aprovação do esquema. */
  passingGrade?: number | null;
  /** Prioridade manual da tarefa: 1 alta · 2 média · 3 baixa. */
  priority?: number | null;
  /** A disciplina tem aula hoje? Vem da grade horária. */
  hasClassToday?: boolean;
}

export interface RankedFocus extends FocusCandidate {
  score: number;
  daysUntilDue: number | null;
  isOverdue: boolean;
  /** Por que este item está aqui, em uma frase para o aluno ler. */
  reason: string;
}

/** Dias entre duas datas ISO, sem cair em armadilha de fuso. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

/**
 * Urgência decai com a distância da data.
 *
 * Atrasado vale mais que hoje, hoje mais que amanhã, e depois de duas semanas
 * praticamente não pesa — não porque não importe, mas porque não é resposta
 * para "hoje".
 */
export function urgencyScore(daysUntilDue: number | null): number {
  if (daysUntilDue === null) return 0.15; // sem data: fica no radar, não no topo
  if (daysUntilDue < 0) return 1.35; // atrasado
  if (daysUntilDue === 0) return 1.2;
  if (daysUntilDue === 1) return 0.95;
  if (daysUntilDue <= 3) return 0.75;
  if (daysUntilDue <= 7) return 0.5;
  if (daysUntilDue <= 14) return 0.3;
  return 0.15;
}

/**
 * Impacto: quanto este item mexe na média final.
 *
 * Normalizado para 0–1, onde 1 é "uma categoria inteira de 100%". Tarefas sem
 * nota associada têm impacto baixo mas não nulo — fazer a lição ainda conta.
 */
export function impactScore(candidate: FocusCandidate): number {
  if (candidate.kind !== 'assessment') {
    // Prioridade manual é o único sinal de impacto que uma tarefa tem.
    const priority = candidate.priority ?? 2;
    if (priority === 1) return 0.4;
    if (priority === 2) return 0.2;
    return 0.1;
  }

  const categoryWeight = candidate.categoryWeightPercent ?? 0;
  const itemWeight = candidate.itemWeight ?? 1;

  // Peso do item satura rápido: peso 7 numa categoria não vale 7× peso 1.
  const itemFactor = Math.min(1, 0.4 + itemWeight / 10);
  return Math.min(1, (categoryWeight / 100) * itemFactor);
}

/**
 * Risco: a disciplina está bem ou está pedindo socorro?
 *
 * Sem nota lançada, o risco é neutro — uma disciplina sem dados nunca é
 * apresentada como problema. A Parte 3 é explícita sobre o aluno nunca sentir
 * cobrança, e chamar de crítico o que é apenas desconhecido é cobrança sem
 * fundamento.
 */
export function riskScore(candidate: FocusCandidate): number {
  const average = candidate.subjectAverage;
  if (average === null || average === undefined) return 0;

  const passing = candidate.passingGrade ?? 6;
  const target = candidate.subjectTarget;

  // Abaixo da média de aprovação é o sinal mais forte que existe.
  if (average < passing) {
    const gap = Math.min(1, (passing - average) / passing);
    return 0.6 + gap * 0.4; // 0.6 – 1.0
  }

  // Acima da aprovação mas abaixo da meta que o próprio aluno definiu.
  if (target !== null && target !== undefined && average < target) {
    const gap = Math.min(1, (target - average) / Math.max(target, 1));
    return gap * 0.5; // 0 – 0.5
  }

  return 0;
}

/** Frase que explica a posição do item. Uma só, curta, sem jargão. */
export function explain(candidate: FocusCandidate, daysUntilDue: number | null): string {
  const parts: string[] = [];

  if (daysUntilDue !== null) {
    if (daysUntilDue < 0) {
      const late = Math.abs(daysUntilDue);
      parts.push(late === 1 ? 'atrasado 1 dia' : `atrasado ${late} dias`);
    } else if (daysUntilDue === 0) parts.push('é hoje');
    else if (daysUntilDue === 1) parts.push('é amanhã');
    else parts.push(`em ${daysUntilDue} dias`);
  }

  if (candidate.kind === 'assessment' && candidate.categoryWeightPercent) {
    const code = candidate.categoryCode ? `${candidate.categoryCode} ` : '';
    parts.push(`${code}vale ${candidate.categoryWeightPercent}% da média`);
  }

  const average = candidate.subjectAverage;
  const passing = candidate.passingGrade ?? 6;
  if (average !== null && average !== undefined) {
    if (average < passing) {
      parts.push('disciplina abaixo da média');
    } else if (
      candidate.subjectTarget !== null &&
      candidate.subjectTarget !== undefined &&
      average < candidate.subjectTarget
    ) {
      parts.push('abaixo da sua meta');
    }
  }

  if (candidate.hasClassToday) parts.push('tem aula hoje');

  if (parts.length === 0) return 'sem data marcada';

  const sentence = parts.join(' · ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** Score final de um candidato. */
export function scoreCandidate(candidate: FocusCandidate, today: string): RankedFocus {
  const daysUntilDue = candidate.dueDate ? daysBetween(today, candidate.dueDate) : null;

  const urgency = urgencyScore(daysUntilDue);
  const impact = impactScore(candidate);
  const risk = riskScore(candidate);

  // Aula hoje é um empurrão pequeno: muda desempate, não domina o ranking.
  const classBoost = candidate.hasClassToday ? 1.1 : 1;

  const score = urgency * (1 + impact) * (1 + risk) * classBoost;

  return {
    ...candidate,
    score,
    daysUntilDue,
    isOverdue: daysUntilDue !== null && daysUntilDue < 0,
    reason: explain(candidate, daysUntilDue),
  };
}

/**
 * Ordena os candidatos e devolve os mais importantes.
 *
 * `limit` é 3 por padrão porque a tela responde "o que fazer AGORA". Uma lista
 * de vinte itens é a mesma paralisia que o aluno já tem no caderno.
 */
export function rankFocus(
  candidates: readonly FocusCandidate[],
  today: string,
  limit = 3,
): RankedFocus[] {
  return candidates
    .map((candidate) => scoreCandidate(candidate, today))
    .sort(
      (a, b) =>
        b.score - a.score ||
        // Desempate estável e previsível: data mais próxima, depois título.
        (a.daysUntilDue ?? 9999) - (b.daysUntilDue ?? 9999) ||
        a.title.localeCompare(b.title, 'pt-BR'),
    )
    .slice(0, limit);
}
