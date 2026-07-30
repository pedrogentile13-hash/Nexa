/**
 * Public surface of the grades feature.
 *
 * Everything outside `src/features/grades` imports from here, so internal file
 * layout stays free to change and the engine's entry points stay obvious.
 */

export type {
  CategoryResult,
  EffectiveActivity,
  GradeActivity,
  GradingCategory,
  GradingScheme,
  RoundingMode,
  SubjectTermInput,
  SubjectTermResult,
} from './types';

export {
  computeCategoryResult,
  computeEffectiveActivities,
  computeOverallAverage,
  computeSubjectTerm,
  normalizeScore,
} from './lib/calc';

export { clamp, formatGrade, roundGrade } from './lib/rounding';

export type { RequiredScoreResult, SolverStatus, UniformRequirementResult } from './lib/solver';

export {
  requiredScoreForActivity,
  requiredUniformScoreForPending,
  simulate,
  withHypotheticalActivity,
} from './lib/solver';

export type { SubjectRisk } from './server/mappers';
export {
  subjectRisk,
  toGradeActivity,
  toGradingCategory,
  toGradingScheme,
  toSubjectTermInput,
} from './server/mappers';
