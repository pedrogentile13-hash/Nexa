import type { Difficulty } from '@/types/database.types';
import type { EvaluationCriterion, ExamAsset, ExamMode, ExamSection, ExamSettings } from '@/types/simulado';

/**
 * Importador de simulado por código — v1 (legado) e v2 (Anglo/ENEM).
 *
 * Puro de propósito — sem import de servidor, sem banco — para que a mesma
 * função valide ao vivo no cliente (feedback a cada tecla, sem round trip) E
 * sirva de segunda checagem no servidor antes de gravar (nunca confiar só na
 * validação que rodou na máquina de quem colou o código).
 *
 * `schemaVersion` decide o caminho: só o valor literal `"2.0"` aciona o
 * parser novo. Qualquer outra coisa (ausente, "1.0", etc.) cai no parser
 * LEGADO, que fica byte-a-byte igual ao de sempre — nenhum simulado já
 * publicado muda de comportamento. Os dois caminhos convergem no mesmo
 * `ImportResult` (superset), então quem consome (prévia, Server Action) não
 * precisa saber qual dos dois rodou.
 *
 * A "matéria" do simulado (nível prova) não vem do JSON: o admin escolhe
 * pelo mesmo seletor usado em qualquer outro conteúdo. No v2, uma QUESTÃO
 * individual pode declarar `subject` pra pertencer a outra matéria dentro da
 * mesma prova mista (seção 14) — isso também não é resolvido aqui (o parser
 * não tem banco): fica como o NOME em `subjectName`, resolvido contra o
 * catálogo na Server Action, mesmo padrão já usado para `topic`.
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
  // ---- v2-only (undefined/vazio no legado) ----
  explanation: string | null;
  groupId: string | null;
  resourceRefs: string[];
  subjectName: string | null;
  subtopicName: string | null;
  book: number | null;
  module: number | null;
  skills: string[];
  errorTypes: string[];
  estimatedTimeSeconds: number | null;
}

export interface ParsedWritingTask {
  index: number;
  sourceId: string;
  title: string;
  genre: string | null;
  theme: string | null;
  prompt: string;
  instructions: string[];
  resourceRefs: string[];
  minWords: number | null;
  maxWords: number | null;
  evaluationCriteria: EvaluationCriterion[];
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
  // ---- v2-only (vazio/null no legado) ----
  schemaVersion: '1.0' | '2.0';
  assets: ExamAsset[];
  sections: ExamSection[];
  writingTasks: ParsedWritingTask[];
  settings: ExamSettings;
  grade: number | null;
  examStyle: string | null;
  mode: ExamMode | null;
  /** Erros de referência cruzada (nível prova) — resourceRefs/sections/writingTaskIds quebrados, ids duplicados. */
  simulationErrors: string[];
}

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  facil: 'facil',
  fácil: 'facil',
  easy: 'facil',
  medio: 'medio',
  médio: 'medio',
  medium: 'medio',
  anglo: 'anglo',
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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

const EMPTY_COUNTS: ImportCounts = {
  questions: 0,
  statements: 0,
  alternatives: 0,
  answerKeys: 0,
  errors: 0,
};

function emptyResult(parseError: string, partial?: Partial<ImportResult>): ImportResult {
  return {
    ok: false,
    parseError,
    simulationCode: null,
    simulationTitle: null,
    simulationDescription: null,
    questions: [],
    counts: EMPTY_COUNTS,
    schemaVersion: '1.0',
    assets: [],
    sections: [],
    writingTasks: [],
    settings: {},
    grade: null,
    examStyle: null,
    mode: null,
    simulationErrors: [],
    ...partial,
  };
}

export function parseSimuladoCode(raw: string): ImportResult {
  const trimmed = raw.trim();
  if (!trimmed) return emptyResult('Cole o código do simulado.');

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return emptyResult('Isso não é um JSON válido — confira vírgulas e chaves.');
  }

  const root = json as { simulation?: unknown };
  const sim = root?.simulation;
  if (typeof sim !== 'object' || sim === null) {
    return emptyResult('Falta o objeto "simulation" na raiz do JSON.');
  }

  const simObj = sim as Record<string, unknown>;
  return simObj.schemaVersion === '2.0' ? parseSimuladoV2(simObj) : parseLegacySimulado(simObj);
}

// ============================================================== legado ====

function parseLegacySimulado(simObj: Record<string, unknown>): ImportResult {
  const rawQuestions = simObj.questions;
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return emptyResult('"simulation.questions" precisa ser uma lista com pelo menos uma questão.', {
      simulationCode: typeof simObj.code === 'string' ? simObj.code : null,
      simulationTitle: typeof simObj.title === 'string' ? simObj.title : null,
      simulationDescription: typeof simObj.description === 'string' ? simObj.description : null,
    });
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
      explanation: null,
      groupId: null,
      resourceRefs: [],
      subjectName: null,
      subtopicName: null,
      book: null,
      module: null,
      skills: [],
      errorTypes: [],
      estimatedTimeSeconds: null,
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

  const counts = countQuestions(questions);

  return {
    ok: counts.errors === 0,
    parseError: null,
    simulationCode: typeof simObj.code === 'string' ? simObj.code : null,
    simulationTitle: typeof simObj.title === 'string' ? simObj.title : null,
    simulationDescription: typeof simObj.description === 'string' ? simObj.description : null,
    questions,
    counts,
    schemaVersion: '1.0',
    assets: [],
    sections: [],
    writingTasks: [],
    settings: {},
    grade: null,
    examStyle: null,
    mode: null,
    simulationErrors: [],
  };
}

function countQuestions(questions: ParsedQuestion[]): ImportCounts {
  return {
    questions: questions.length,
    statements: questions.filter((q) => q.statement).length,
    alternatives: questions.reduce((sum, q) => sum + q.options.length, 0),
    answerKeys: questions.filter((q) => q.correctKey !== null).length,
    errors: questions.filter((q) => q.errors.length > 0).length,
  };
}

// ================================================================= v2 =====

const ALTERNATIVE_KEYS = ['A', 'B', 'C', 'D', 'E'];

/** V2 é mais estrito que o legado: exatamente 4 ou 5 alternativas, letras A–E. */
function parseAlternativesV2(raw: unknown): { options: ParsedOption[]; error: string | null } {
  if (!isRecordOfStrings(raw)) {
    return { options: [], error: 'alternativas devem ser um objeto com as letras A a E.' };
  }

  const entries = Object.entries(raw).filter(([, text]) => text.trim().length > 0);
  const invalidKey = entries.find(([key]) => !ALTERNATIVE_KEYS.includes(key));
  if (invalidKey) {
    return { options: [], error: `alternativas devem usar as letras A a E — chave inválida "${invalidKey[0]}".` };
  }

  if (entries.length !== 4 && entries.length !== 5) {
    return {
      options: [],
      error: `a questão precisa ter 4 ou 5 alternativas (A a E) — encontrei ${entries.length}.`,
    };
  }

  const options = entries
    .sort(([a], [b]) => ALTERNATIVE_KEYS.indexOf(a) - ALTERNATIVE_KEYS.indexOf(b))
    .map(([key, text]) => ({ key, text: text.trim() }));

  return { options, error: null };
}

/**
 * Reaproveitada fora do parser de simulado inteiro: o editor manual
 * (`resource-form.tsx`) usa a MESMA validação para o campo avulso "Recursos
 * da prova" — um array de assets sem o resto do envelope `simulation`.
 */
export function parseAssets(raw: unknown, errors: string[]): ExamAsset[] {
  if (!Array.isArray(raw)) return [];
  const seenIds = new Set<string>();
  const assets: ExamAsset[] = [];

  raw.forEach((entry, i) => {
    const a = asRecord(entry);
    const id = typeof a.id === 'string' && a.id.trim() ? a.id.trim() : null;
    const type = typeof a.type === 'string' ? a.type : null;
    const label = id ?? `#${i + 1}`;

    if (!id) {
      errors.push(`Recurso ${label}: falta o "id".`);
      return;
    }
    if (seenIds.has(id)) {
      errors.push(`Recurso "${id}": id duplicado — cada recurso precisa de um id único.`);
      return;
    }
    seenIds.add(id);

    switch (type) {
      case 'text': {
        if (typeof a.content !== 'string' || !a.content.trim()) {
          errors.push(`Recurso "${id}" (texto): falta "content".`);
          return;
        }
        assets.push({
          id,
          type: 'text',
          title: typeof a.title === 'string' ? a.title : undefined,
          content: a.content,
          presentation: a.presentation === 'inline' ? 'inline' : 'collapsible',
          source: typeof a.source === 'string' ? a.source : undefined,
        });
        return;
      }
      case 'image':
      case 'infographic':
      case 'diagram': {
        if (typeof a.src !== 'string' || !a.src.trim()) {
          errors.push(`Recurso "${id}" (${type}): falta "src".`);
          return;
        }
        if (typeof a.alt !== 'string' || !a.alt.trim()) {
          errors.push(`Recurso "${id}" (${type}): falta "alt" (texto alternativo — acessibilidade).`);
          return;
        }
        assets.push({
          id,
          type,
          title: typeof a.title === 'string' ? a.title : undefined,
          src: a.src,
          alt: a.alt,
          caption: typeof a.caption === 'string' ? a.caption : undefined,
        });
        return;
      }
      case 'chart': {
        const chart = asRecord(a.chart);
        const kind = chart.kind;
        if (kind !== 'bar' && kind !== 'line' && kind !== 'pie') {
          errors.push(`Recurso "${id}" (gráfico): "chart.kind" precisa ser bar, line ou pie.`);
          return;
        }
        const labels = asStringArray(chart.labels);
        const datasets = Array.isArray(chart.datasets)
          ? chart.datasets
              .map((d) => asRecord(d))
              .filter((d) => typeof d.label === 'string' && Array.isArray(d.data))
              .map((d) => ({ label: d.label as string, data: (d.data as unknown[]).map(Number) }))
          : [];
        if (labels.length === 0 || datasets.length === 0) {
          errors.push(`Recurso "${id}" (gráfico): precisa de "chart.labels" e ao menos um item em "chart.datasets".`);
          return;
        }
        assets.push({
          id,
          type: 'chart',
          title: typeof a.title === 'string' ? a.title : undefined,
          chart: { kind, labels, datasets },
          xLabel: typeof a.xLabel === 'string' ? a.xLabel : undefined,
          yLabel: typeof a.yLabel === 'string' ? a.yLabel : undefined,
        });
        return;
      }
      case 'table': {
        const headers = asStringArray(a.headers);
        const rows = Array.isArray(a.rows) ? a.rows.map((r) => asStringArray(r)) : [];
        if (headers.length === 0 || rows.length === 0) {
          errors.push(`Recurso "${id}" (tabela): precisa de "headers" e ao menos uma linha em "rows".`);
          return;
        }
        assets.push({
          id,
          type: 'table',
          title: typeof a.title === 'string' ? a.title : undefined,
          headers,
          rows,
        });
        return;
      }
      default:
        errors.push(`Recurso "${id}": tipo "${String(type)}" não é suportado (use text, image, chart, table, infographic ou diagram).`);
    }
  });

  return assets;
}

function parseSections(raw: unknown): ExamSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => asRecord(entry))
    .filter((s) => typeof s.id === 'string' && typeof s.title === 'string')
    .map((s) => ({
      id: s.id as string,
      title: s.title as string,
      subject: typeof s.subject === 'string' ? s.subject : undefined,
      type: s.type === 'writing' ? 'writing' : 'objective',
      questionIds: asStringArray(s.questionIds),
      writingTaskIds: asStringArray(s.writingTaskIds),
    }));
}

type BooleanSettingKey = {
  [K in keyof ExamSettings]-?: ExamSettings[K] extends boolean | undefined ? K : never;
}[keyof ExamSettings];

function parseSettings(raw: unknown): ExamSettings {
  const s = asRecord(raw);
  const settings: ExamSettings = {};
  const bool = (key: BooleanSettingKey) => {
    if (typeof s[key] === 'boolean') settings[key] = s[key] as boolean;
  };
  bool('shuffleQuestions');
  bool('shuffleAlternatives');
  bool('showProgress');
  bool('showQuestionNumber');
  bool('allowReview');
  bool('showTimer');
  bool('calculatorAllowed');
  bool('formulaSheetAllowed');
  if (typeof s.timeLimitMinutes === 'number') settings.timeLimitMinutes = s.timeLimitMinutes;
  return settings;
}

function parseWritingTasks(raw: unknown, assetIds: Set<string>): ParsedWritingTask[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((entry, i) => {
    const index = i + 1;
    const w = asRecord(entry);
    const sourceId = typeof w.id === 'string' && w.id.trim() ? w.id.trim() : `R${index}`;
    const errors: string[] = [];

    const prompt = typeof w.prompt === 'string' ? w.prompt.trim() : '';
    if (!prompt) errors.push('falta o "prompt" (a proposta em si).');

    const minWords = typeof w.minWords === 'number' ? w.minWords : null;
    const maxWords = typeof w.maxWords === 'number' ? w.maxWords : null;
    if (minWords !== null && maxWords !== null && maxWords < minWords) {
      errors.push('"maxWords" não pode ser menor que "minWords".');
    }

    const resourceRefs = asStringArray(w.resourceRefs);
    for (const ref of resourceRefs) {
      if (!assetIds.has(ref)) errors.push(`recurso "${ref}" (em resourceRefs) não existe.`);
    }

    const evaluationCriteria: EvaluationCriterion[] = Array.isArray(w.evaluationCriteria)
      ? w.evaluationCriteria.map((c, ci) => {
          const cr = asRecord(c);
          return {
            id: typeof cr.id === 'string' && cr.id.trim() ? cr.id.trim() : `C${ci + 1}`,
            name: typeof cr.name === 'string' ? cr.name : `Critério ${ci + 1}`,
            maxScore: typeof cr.maxScore === 'number' ? cr.maxScore : 0,
          };
        })
      : [];

    return {
      index,
      sourceId,
      title: typeof w.title === 'string' && w.title.trim() ? w.title : 'Produção de Texto',
      genre: typeof w.genre === 'string' ? w.genre : null,
      theme: typeof w.theme === 'string' ? w.theme : null,
      prompt,
      instructions: asStringArray(w.instructions),
      resourceRefs,
      minWords,
      maxWords,
      evaluationCriteria,
      errors,
    };
  });
}

function parseSimuladoV2(simObj: Record<string, unknown>): ImportResult {
  const rawQuestions = Array.isArray(simObj.questions) ? simObj.questions : [];
  const rawWritingTasks = Array.isArray(simObj.writingTasks) ? simObj.writingTasks : [];

  if (rawQuestions.length === 0 && rawWritingTasks.length === 0) {
    return emptyResult('a prova precisa ter ao menos uma questão em "questions" ou uma redação em "writingTasks".', {
      schemaVersion: '2.0',
      simulationCode: typeof simObj.code === 'string' ? simObj.code : null,
      simulationTitle: typeof simObj.title === 'string' ? simObj.title : null,
      simulationDescription: typeof simObj.description === 'string' ? simObj.description : null,
    });
  }

  const simulationErrors: string[] = [];

  // Recursos primeiro: questões e redações referenciam pelo id.
  const assets = parseAssets(simObj.resources, simulationErrors);
  const assetIds = new Set(assets.map((a) => a.id));

  const seenIds = new Map<string, number[]>();
  const questions: ParsedQuestion[] = rawQuestions.map((raw, i) => {
    const index = i + 1;
    const q = asRecord(raw);
    const errors: string[] = [];

    const sourceId = q.id === undefined || q.id === null ? String(index) : String(q.id);
    const idList = seenIds.get(sourceId) ?? [];
    idList.push(index);
    seenIds.set(sourceId, idList);

    const statement = typeof q.statement === 'string' ? q.statement.trim() : '';
    if (!statement) errors.push('falta o enunciado.');

    const { options, error: altError } = parseAlternativesV2(q.alternatives);
    if (altError) errors.push(altError);

    const correctKeyRaw = typeof q.correctAlternative === 'string' ? q.correctAlternative : null;
    let correctKey: string | null = null;
    if (!altError) {
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
    }

    const resourceRefs = asStringArray(q.resourceRefs);
    for (const ref of resourceRefs) {
      if (!assetIds.has(ref)) simulationErrors.push(`Questão ${sourceId}: recurso "${ref}" (em resourceRefs) não existe.`);
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
      explanation: typeof q.explanation === 'string' && q.explanation.trim() ? q.explanation.trim() : null,
      groupId: typeof q.groupId === 'string' && q.groupId.trim() ? q.groupId.trim() : null,
      resourceRefs,
      subjectName: typeof q.subject === 'string' && q.subject.trim() ? q.subject.trim() : null,
      subtopicName: typeof q.subtopic === 'string' && q.subtopic.trim() ? q.subtopic.trim() : null,
      book: typeof q.book === 'number' ? q.book : null,
      module: typeof q.module === 'number' ? q.module : null,
      skills: asStringArray(q.skills),
      errorTypes: asStringArray(q.errorTypes),
      estimatedTimeSeconds: typeof q.estimatedTimeSeconds === 'number' ? q.estimatedTimeSeconds : null,
    };
  });

  for (const [id, positions] of seenIds) {
    if (positions.length > 1) {
      for (const question of questions) {
        if (question.sourceId === id) {
          question.errors.push(`id "${id}" repetido nas questões ${positions.join(', ')}.`);
        }
      }
    }
  }

  const questionIds = new Set(questions.map((q) => q.sourceId));
  const writingTasks = parseWritingTasks(rawWritingTasks, assetIds);
  const writingTaskIds = new Set(writingTasks.map((w) => w.sourceId));
  simulationErrors.push(
    ...writingTasks.flatMap((w) => w.errors.map((e) => `Redação ${w.sourceId}: ${e}`)),
  );

  const sections = parseSections(simObj.sections);
  for (const section of sections) {
    for (const qid of section.questionIds ?? []) {
      if (!questionIds.has(qid)) {
        simulationErrors.push(`Seção "${section.id}": a questão "${qid}" não existe.`);
      }
    }
    for (const wid of section.writingTaskIds ?? []) {
      if (!writingTaskIds.has(wid)) {
        simulationErrors.push(`Seção "${section.id}": a redação "${wid}" não existe.`);
      }
    }
  }

  const counts = countQuestions(questions);

  return {
    ok: counts.errors === 0 && simulationErrors.length === 0,
    parseError: null,
    simulationCode: typeof simObj.code === 'string' ? simObj.code : null,
    simulationTitle: typeof simObj.title === 'string' ? simObj.title : null,
    simulationDescription: typeof simObj.description === 'string' ? simObj.description : null,
    questions,
    counts,
    schemaVersion: '2.0',
    assets,
    sections,
    writingTasks,
    settings: parseSettings(simObj.settings),
    grade: typeof simObj.grade === 'number' ? simObj.grade : null,
    examStyle: typeof simObj.examStyle === 'string' ? simObj.examStyle : null,
    mode: simObj.mode === 'exam' || simObj.mode === 'practice' ? simObj.mode : null,
    simulationErrors,
  };
}
