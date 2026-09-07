import type { Difficulty } from '@/types/database.types';

/**
 * Importador de simulado por código.
 *
 * Puro de propósito — sem import de servidor, sem banco — para que a mesma
 * função valide ao vivo no cliente (feedback a cada tecla, sem round trip) E
 * sirva de segunda checagem no servidor antes de gravar (nunca confiar só na
 * validação que rodou na máquina de quem colou o código).
 *
 * A "matéria" do simulado não vem do JSON: o admin escolhe pelo mesmo
 * seletor usado em qualquer outro conteúdo. Pedir para o texto colado dizer
 * "Matemática" e o sistema adivinhar qual linha do catálogo é essa é abrir
 * mão de uma amarração que já existe e é confiável, trocando por um
 * casamento de string frágil — o de sempre (nome exato, maiúsculas, acento)
 * é exatamente o tipo de erro chato de depurar às 23h antes da prova.
 */

export interface ParsedOption {
  key: string;
  text: string;
}

export interface ParsedQuestion {
  /** Posição no array de entrada — 1-based, para as mensagens de erro. */
  index: number;
  sourceId: string;
  statement: string;
  options: ParsedOption[];
  correctKey: string | null;
  difficulty: Difficulty;
  topicName: string | null;
  /** Vazio = questão válida. */
  errors: string[];
}

export interface ImportCounts {
  questions: number;
  statements: number;
  alternatives: number;
  answerKeys: number;
  errors: number;
}

export interface ImportResult {
  ok: boolean;
  /** `null` quando o JSON nem chega a ter a forma esperada. */
  parseError: string | null;
  simulationCode: string | null;
  simulationTitle: string | null;
  simulationDescription: string | null;
  questions: ParsedQuestion[];
  counts: ImportCounts;
}

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  facil: 'facil',
  fácil: 'facil',
  easy: 'facil',
  medio: 'medio',
  médio: 'medio',
  medium: 'medio',
  dificil: 'dificil',
  difícil: 'dificil',
  hard: 'dificil',
};

function normalizeDifficulty(value: unknown): Difficulty {
  if (typeof value !== 'string') return 'medio';
  return DIFFICULTY_MAP[value.trim().toLowerCase()] ?? 'medio';
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === 'string');
}

const EMPTY_COUNTS: ImportCounts = {
  questions: 0,
  statements: 0,
  alternatives: 0,
  answerKeys: 0,
  errors: 0,
};

export function parseSimuladoCode(raw: string): ImportResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ok: false,
      parseError: 'Cole o código do simulado.',
      simulationCode: null,
      simulationTitle: null,
      simulationDescription: null,
      questions: [],
      counts: EMPTY_COUNTS,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      parseError: 'Isso não é um JSON válido — confira vírgulas e chaves.',
      simulationCode: null,
      simulationTitle: null,
      simulationDescription: null,
      questions: [],
      counts: EMPTY_COUNTS,
    };
  }

  const root = json as { simulation?: unknown };
  const sim = root?.simulation;
  if (typeof sim !== 'object' || sim === null) {
    return {
      ok: false,
      parseError: 'Falta o objeto "simulation" na raiz do JSON.',
      simulationCode: null,
      simulationTitle: null,
      simulationDescription: null,
      questions: [],
      counts: EMPTY_COUNTS,
    };
  }

  const simObj = sim as Record<string, unknown>;
  const rawQuestions = simObj.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return {
      ok: false,
      parseError: '"simulation.questions" precisa ser uma lista com pelo menos uma questão.',
      simulationCode: typeof simObj.code === 'string' ? simObj.code : null,
      simulationTitle: typeof simObj.title === 'string' ? simObj.title : null,
      simulationDescription: typeof simObj.description === 'string' ? simObj.description : null,
      questions: [],
      counts: EMPTY_COUNTS,
    };
  }

  const seenIds = new Map<string, number[]>();
  const questions: ParsedQuestion[] = rawQuestions.map((raw, i) => {
    const index = i + 1;
    const q = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const errors: string[] = [];

    const sourceId = q.id === undefined || q.id === null ? String(index) : String(q.id);
    const idList = seenIds.get(sourceId) ?? [];
    idList.push(index);
    seenIds.set(sourceId, idList);

    const statement = typeof q.statement === 'string' ? q.statement.trim() : '';
    if (!statement) errors.push('falta o enunciado.');

    const options: ParsedOption[] = isRecordOfStrings(q.alternatives)
      ? Object.entries(q.alternatives)
          .filter(([, text]) => text.trim().length > 0)
          .map(([key, text]) => ({ key, text: text.trim() }))
      : [];
    if (options.length < 2) errors.push('precisa de pelo menos 2 alternativas preenchidas.');

    const correctKeyRaw = typeof q.correctAlternative === 'string' ? q.correctAlternative : null;
    let correctKey: string | null = null;
    if (!correctKeyRaw) {
      errors.push('falta dizer qual é a alternativa correta.');
    } else if (!options.some((o) => o.key === correctKeyRaw)) {
      const available = options.map((o) => o.key).join(', ') || 'nenhuma';
      errors.push(
        `a alternativa correta informada é "${correctKeyRaw}", porém essa questão possui apenas alternativas ${available}.`,
      );
    } else {
      correctKey = correctKeyRaw;
    }

    return {
      index,
      sourceId,
      statement,
      options,
      correctKey,
      difficulty: normalizeDifficulty(q.difficulty),
      topicName: typeof q.topic === 'string' && q.topic.trim() ? q.topic.trim() : null,
      errors,
    };
  });

  // IDs duplicados viram erro em toda questão que compartilha o id — quem lê
  // a prévia vê exatamente quais posições colidem, não só "tem duplicata".
  for (const [id, positions] of seenIds) {
    if (positions.length > 1) {
      for (const question of questions) {
        if (question.sourceId === id) {
          question.errors.push(`id "${id}" repetido nas questões ${positions.join(', ')}.`);
        }
      }
    }
  }

  const counts: ImportCounts = {
    questions: questions.length,
    statements: questions.filter((q) => q.statement).length,
    alternatives: questions.reduce((sum, q) => sum + q.options.length, 0),
    answerKeys: questions.filter((q) => q.correctKey !== null).length,
    errors: questions.filter((q) => q.errors.length > 0).length,
  };

  return {
    ok: counts.errors === 0,
    parseError: null,
    simulationCode: typeof simObj.code === 'string' ? simObj.code : null,
    simulationTitle: typeof simObj.title === 'string' ? simObj.title : null,
    simulationDescription: typeof simObj.description === 'string' ? simObj.description : null,
    questions,
    counts,
  };
}
