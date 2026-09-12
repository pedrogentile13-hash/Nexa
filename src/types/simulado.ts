/**
 * Formas do JSON de simulados v2 — usadas tanto na importação (parser em
 * `features/admin/lib/simulado-import.ts`) quanto na renderização pro aluno
 * (`features/study/components/question-assets.tsx` e afins).
 *
 * Espelham exatamente o que fica gravado nas colunas JSONB
 * (`resources.assets`/`sections`/`settings`, `writing_tasks.evaluation_criteria`)
 * — sem uma segunda camada de mapeamento entre "o que o admin colou" e "o
 * que fica salvo".
 */

export interface ExamAssetText {
  id: string;
  type: 'text';
  title?: string;
  content: string;
  presentation?: 'collapsible' | 'inline';
  source?: string;
}

export interface ExamAssetImage {
  id: string;
  /** `infographic`/`diagram` reaproveitam o mesmo payload de imagem. */
  type: 'image' | 'infographic' | 'diagram';
  title?: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface ExamChartDataset {
  label: string;
  data: number[];
}

export interface ExamAssetChart {
  id: string;
  type: 'chart';
  title?: string;
  chart: {
    kind: 'bar' | 'line' | 'pie';
    labels: string[];
    datasets: ExamChartDataset[];
  };
  xLabel?: string;
  yLabel?: string;
}

export interface ExamAssetTable {
  id: string;
  type: 'table';
  title?: string;
  headers: string[];
  rows: string[][];
}

export type ExamAsset = ExamAssetText | ExamAssetImage | ExamAssetChart | ExamAssetTable;

export interface ExamSection {
  id: string;
  title: string;
  subject?: string;
  type?: 'objective' | 'writing';
  questionIds?: string[];
  writingTaskIds?: string[];
}

export interface ExamSettings {
  shuffleQuestions?: boolean;
  shuffleAlternatives?: boolean;
  showProgress?: boolean;
  showQuestionNumber?: boolean;
  allowReview?: boolean;
  showTimer?: boolean;
  /** Espelha `resources.time_limit_seconds` na importação — não duplicado no banco. */
  timeLimitMinutes?: number;
  calculatorAllowed?: boolean;
  formulaSheetAllowed?: boolean;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  maxScore: number;
}

export type ExamMode = 'exam' | 'practice';
