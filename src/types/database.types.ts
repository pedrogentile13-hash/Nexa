/**
 * Database contract.
 *
 * Regenerate with `npm run db:types` (requires the Supabase CLI and a running
 * local database) — it overwrites this file from the migrations, so the
 * migrations, not this file, are the source of truth. It is committed so
 * typecheck and CI work without a database.
 *
 * ⚠️ Every row shape below is a `type`, never an `interface`, and that is load
 * bearing. postgrest-js constrains each table to `Row: Record<string, unknown>`,
 * and TypeScript does not give interfaces an implicit index signature — so an
 * `interface` row silently fails the constraint, the whole schema falls back,
 * and EVERY `.select()` in the codebase resolves to `never` with no error
 * pointing anywhere near this file.
 */

import type { EvaluationCriterion, ExamAsset, ExamMode, ExamSection, ExamSettings } from './simulado';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RoundingMode = 'half_up' | 'half_even' | 'floor' | 'ceil';
export type ThemePreference = 'light' | 'dark' | 'system';
export type SubjectArea =
  | 'linguagens'
  | 'matematica'
  | 'ciencias'
  | 'humanas'
  | 'tecnologia'
  | 'outros';
export type TaskKind =
  | 'task'
  | 'homework'
  | 'reading'
  | 'review'
  | 'exercise'
  | 'project'
  | 'custom'
  | 'prova'
  | 'evento';
export type StudySource = 'timer' | 'manual' | 'content';
export type AttachmentKind = 'summary' | 'exercise' | 'file' | 'link';
export type XpSourceType =
  | 'task'
  | 'routine'
  | 'study_session'
  | 'activity'
  | 'achievement'
  | 'system'
  | 'quiz'
  | 'lesson'
  | 'resource'
  | 'social';
export type UserRole = 'student' | 'school_admin' | 'admin' | 'teacher_admin';
export type ResourceKind = 'resumo' | 'podcast' | 'video' | 'imagem' | 'musica' | 'quiz' | 'simulado';
export type Difficulty = 'facil' | 'medio' | 'anglo' | 'dificil';
export type TrackCategory = 'enem' | 'fundamental' | 'reforco' | 'carreiras' | 'habilidades';
export type LessonState = 'available' | 'in_progress' | 'done' | 'mastered';
export type AchievementCategory =
  | 'geral'
  | 'estudo'
  | 'notas'
  | 'organizacao'
  | 'constancia';

/**
 * Row/Insert/Update triple, mirroring what `supabase gen types` emits.
 *
 * `Relationships` is not decoration: supabase-js keys its query inference off
 * it, and a table without it makes every `.select()` resolve to `never`.
 */
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type View<Row> = {
  Row: Row;
  Relationships: [];
};

export type SchoolRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  is_verified: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationSettings = {
  dailyReminder: boolean;
  revisionReminder: boolean;
  achievementsAndGoals: boolean;
  newsUpdates: boolean;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  school_id: string | null;
  grade_level: string | null;
  class_id: string | null;
  timezone: string;
  locale: string;
  theme_preference: ThemePreference;
  role: UserRole;
  weekly_study_goal_minutes: number;
  daily_study_goal_minutes: number;
  monthly_activities_goal: number;
  monthly_subjects_goal: number;
  notification_settings: NotificationSettings;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AcademicYearRow = {
  id: string;
  user_id: string;
  label: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TermRow = {
  id: string;
  user_id: string;
  academic_year_id: string;
  name: string;
  sequence: number;
  starts_on: string;
  ends_on: string;
  created_at: string;
  updated_at: string;
}

export type SubjectCatalogRow = {
  id: string;
  slug: string;
  name: string;
  area: SubjectArea;
  default_color: string;
  default_icon: string;
  suggested_grade_levels: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type SubjectRow = {
  id: string;
  user_id: string;
  catalog_id: string | null;
  name: string;
  color: string;
  icon: string;
  teacher_name: string | null;
  target_grade: number | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RoutineRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  icon: string;
  days_of_week: number[];
  target_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type RoutineCompletionRow = {
  id: string;
  user_id: string;
  routine_id: string;
  local_date: string;
  count: number;
  completed_at: string;
}

export type TaskRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  kind: TaskKind;
  due_date: string | null;
  due_time: string | null;
  priority: number;
  estimated_minutes: number | null;
  completed_at: string | null;
  sort_order: number;
  related_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export type StudySessionRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  local_date: string;
  source: StudySource;
  focus_rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TimetableSlotRow = {
  id: string;
  user_id: string;
  subject_id: string;
  term_id: string | null;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export type AttachmentRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  kind: AttachmentKind;
  title: string;
  content: string | null;
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export type UserStatsRow = {
  user_id: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_local_date: string | null;
  streak_freezes_available: number;
  streak_freezes_granted_week: string | null;
  total_study_seconds: number;
  created_at: string;
  updated_at: string;
}

export type XpEventRow = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  source_type: XpSourceType | null;
  source_id: string | null;
  local_date: string;
  created_at: string;
}

export type AchievementRarity = 'comum' | 'rara' | 'epica' | 'lendaria';

export type AchievementRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  metric: string;
  threshold: number;
  xp_reward: number;
  rarity: AchievementRarity;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type UserAchievementRow = {
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked_at: string | null;
  updated_at: string;
}

/* ------------------------------------------------------------ conteúdo -- */

export type ContentTopicRow = {
  id: string;
  school_id: string | null;
  subject_catalog_id: string;
  name: string;
  slug: string;
  description: string | null;
  grade_levels: string[];
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ResourceRow = {
  id: string;
  school_id: string | null;
  subject_catalog_id: string;
  topic_id: string | null;
  kind: ResourceKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  body: string | null;
  storage_path: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  difficulty: Difficulty;
  grade_levels: string[];
  tags: string[];
  time_limit_seconds: number | null;
  xp_reward: number;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Para kind='resumo': texto digitado, arquivo enviado ou HTML incorporado (sandboxed). */
  content_format: 'markdown' | 'pdf' | 'html';
  pdf_page_count: number | null;
  pdf_extracted_text: string | null;
  pdf_status: 'processado' | 'erro' | null;
  /** 1 a 4, ou `null` quando o recurso não é amarrado a um bimestre específico. */
  bimestre: number | null;
  /** '1.0' = formato legado; '2.0' = simulado v2 (assets/sections/writingTasks). */
  schema_version: string;
  settings: ExamSettings;
  assets: ExamAsset[];
  sections: ExamSection[];
  /** `null` = deriva de `kind` (quiz->practice, simulado->exam). */
  exam_mode: ExamMode | null;
  exam_style: string | null;
  /** Só usado quando `ai_generated`; `null` = conteúdo de admin/professor. */
  visibility: ResourceVisibility | null;
  community_id: string | null;
  ai_generated: boolean;
  /** 'vestibular' NUNCA entra na nota escolar — ver `20260919000100_vestibular_fundacao.sql`. */
  context: ResourceContext;
  exam_id: string | null;
  exam_edition_id: string | null;
};

export type ResourceContext = 'school' | 'vestibular';

export type ExamKind = 'nacional' | 'vestibular' | 'militar';

export type ExamRow = {
  id: string;
  slug: string;
  name: string;
  organization: string | null;
  kind: ExamKind;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type ExamEditionRow = {
  id: string;
  exam_id: string;
  year: number;
  label: string | null;
  application_date: string | null;
  application_date_2: string | null;
  registration_start: string | null;
  registration_end: string | null;
  results_date: string | null;
  created_at: string;
};

export type VestibularProfileRow = {
  user_id: string;
  main_exam_id: string | null;
  target_year: number | null;
  graduation_year: number | null;
  daily_study_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type UserExamTargetRow = {
  id: string;
  user_id: string;
  exam_id: string;
  target_year: number | null;
  priority: number;
  target_course: string | null;
  target_score: number | null;
  created_at: string;
};

export type VestibularProfileRpcRow = {
  user_id: string;
  main_exam_id: string | null;
  main_exam_name: string | null;
  main_exam_slug: string | null;
  target_year: number | null;
  graduation_year: number | null;
  daily_study_minutes: number | null;
};

export type ExamListRpcRow = {
  id: string;
  slug: string;
  name: string;
  organization: string | null;
  kind: ExamKind;
  next_edition_year: number | null;
  next_application_date: string | null;
};

export type ExamTargetRpcRow = {
  exam_id: string;
  exam_name: string;
  exam_slug: string;
  target_year: number | null;
  priority: number;
  target_course: string | null;
  target_score: number | null;
  next_application_date: string | null;
};

export type VestibularResourceRpcRow = {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  subject_name: string;
  subject_color: string;
  exam_name: string | null;
  edition_year: number | null;
  difficulty: Difficulty;
  question_count: number;
  time_limit_seconds: number | null;
  my_best_percent: number | null;
};

export type VestibularOverviewRpcRow = {
  exam_name: string | null;
  edition_year: number | null;
  application_date: string | null;
  days_until: number | null;
  questions_answered: number;
  correct_answers: number;
  accuracy_percent: number | null;
  quizzes_done: number;
  simulados_done: number;
  practices_done: number;
  essays_submitted: number;
};

/* ---- Vestibular · Fase 1: banco de questões avulsas -------------------- */

export type PracticeSessionRow = {
  id: string;
  user_id: string;
  question_ids: string[];
  exam_id: string | null;
  subject_catalog_id: string | null;
  difficulty: Difficulty | null;
  correct_count: number;
  total_count: number;
  started_at: string;
  finished_at: string | null;
};

export type PracticeAnswerRow = {
  id: string;
  session_id: string;
  question_id: string;
  option_id: string | null;
  is_correct: boolean;
  time_spent_seconds: number;
  answered_at: string;
};

export type PracticeFilterRpcRow = {
  kind: 'exam' | 'subject';
  id: string;
  name: string;
  question_count: number;
};

/**
 * O contrato importante desta linha é o que ela NÃO tem: `options` não
 * carrega `is_correct`, exatamente como `quiz_questions`. O gabarito só
 * aparece na resposta de `answer_practice_question`.
 */
export type PracticeQuestionRpcRow = {
  question_id: string;
  question_position: number;
  statement: string;
  difficulty: Difficulty;
  topic_name: string | null;
  subject_name: string | null;
  exam_name: string | null;
  edition_year: number | null;
  options: { id: string; position: number; body: string }[];
  my_option_id: string | null;
  my_is_correct: boolean | null;
};

export type PracticeReviewRpcRow = {
  question_id: string;
  question_position: number;
  statement: string;
  subject_name: string | null;
  topic_name: string | null;
  exam_name: string | null;
  edition_year: number | null;
  difficulty: Difficulty;
  my_option_body: string | null;
  correct_option_body: string | null;
  is_correct: boolean;
  explanation: string | null;
};

export type PracticeSessionListRpcRow = {
  id: string;
  exam_name: string | null;
  subject_name: string | null;
  correct_count: number;
  total_count: number;
  started_at: string;
  finished_at: string | null;
};

/* ---- Vestibular · Fase 2: central de erros + desempenho ---------------- */

export type MasteryStatus = 'dominado' | 'desenvolvimento' | 'revisar';

/** 'prova' = veio de uma tentativa de prova; 'treino' = de uma sessão avulsa. */
export type VestibularAnswerSource = 'prova' | 'treino';

export type VestibularSubjectPerformanceRpcRow = {
  subject_id: string;
  subject_name: string;
  subject_color: string;
  correct_count: number;
  total_count: number;
  accuracy_percent: number;
  status: MasteryStatus;
};

export type VestibularTopicPerformanceRpcRow = {
  subject_id: string;
  subject_name: string;
  subject_color: string;
  topic_id: string | null;
  topic_name: string;
  correct_count: number;
  total_count: number;
  accuracy_percent: number;
  status: MasteryStatus;
};

export type VestibularErrorRpcRow = {
  question_id: string;
  statement: string;
  subject_id: string;
  subject_name: string;
  subject_color: string;
  topic_name: string | null;
  exam_name: string | null;
  edition_year: number | null;
  difficulty: Difficulty;
  correct_option_body: string | null;
  explanation: string | null;
  source: VestibularAnswerSource;
  answered_at: string;
};

export type ResourceVisibility = 'private' | 'friends' | 'school' | 'community' | 'public';

export type CreatorResourceRpcRow = {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  subject_name: string;
  visibility: ResourceVisibility;
  community_id: string | null;
  community_name: string | null;
  question_count: number;
  created_at: string;
};

export type ResourceChapterRow = {
  id: string;
  resource_id: string;
  position: number;
  label: string;
  starts_at_seconds: number;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  resource_id: string;
  topic_id: string | null;
  position: number;
  statement: string;
  explanation: string | null;
  difficulty: Difficulty;
  points: number;
  created_at: string;
  updated_at: string;
  group_id: string | null;
  resource_refs: string[];
  /** `null` = usa a matéria do `resources` pai (prova mista, seção diferente). */
  subject_catalog_id: string | null;
  subtopic: string | null;
  book: number | null;
  module: number | null;
  skills: string[];
  error_types: string[];
  estimated_time_seconds: number | null;
};

export type WritingTaskRow = {
  id: string;
  resource_id: string;
  position: number;
  title: string;
  genre: string | null;
  theme: string | null;
  prompt: string;
  instructions: string[];
  resource_refs: string[];
  min_words: number | null;
  max_words: number | null;
  evaluation_criteria: EvaluationCriterion[];
  created_at: string;
  updated_at: string;
};

export type EssaySubmissionRow = {
  id: string;
  attempt_id: string;
  writing_task_id: string;
  content: string;
  word_count: number;
  is_submitted: boolean;
  submitted_at: string | null;
  scores: Record<string, number> | null;
  total_score: number | null;
  corrected_by: string | null;
  corrected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionOptionRow = {
  id: string;
  question_id: string;
  position: number;
  body: string;
  is_correct: boolean;
  created_at: string;
};

export type TrackRow = {
  id: string;
  school_id: string | null;
  subject_catalog_id: string;
  title: string;
  description: string | null;
  grade_levels: string[];
  category: TrackCategory;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TrackSectionRow = {
  id: string;
  track_id: string;
  position: number;
  title: string;
  created_at: string;
};

export type TrackLessonRow = {
  id: string;
  section_id: string;
  position: number;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  xp_reward: number;
  unlock_after_lesson_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TrackLessonResourceRow = {
  id: string;
  lesson_id: string;
  resource_id: string;
  position: number;
  is_required: boolean;
};

/* ------------------------------------------------ progresso do aluno ---- */

export type ResourceProgressRow = {
  id: string;
  user_id: string;
  resource_id: string;
  progress_percent: number;
  position_seconds: number;
  completed_at: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  is_favorited: boolean;
};

export type QuizAttemptRow = {
  id: string;
  user_id: string;
  resource_id: string;
  started_at: string;
  finished_at: string | null;
  correct_count: number;
  total_count: number;
  duration_seconds: number;
  created_at: string;
};

export type QuizAnswerRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  option_id: string | null;
  is_correct: boolean;
  answered_at: string;
  flagged: boolean;
  time_spent_seconds: number;
};

export type LessonProgressRow = {
  id: string;
  user_id: string;
  lesson_id: string;
  state: LessonState;
  correct_streak: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HighlightRow = {
  id: string;
  user_id: string;
  resource_id: string;
  quote: string;
  note: string | null;
  created_at: string;
};

export type FlashcardReviewRow = {
  id: string;
  user_id: string;
  resource_id: string;
  knows: boolean;
  reviewed_at: string;
};

export type ContentReviewRow = {
  id: string;
  user_id: string;
  resource_id: string;
  interval_step: number;
  reviewed_at: string;
};

export type LongTermGoalRow = {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  progress_percent: number;
  created_at: string;
  updated_at: string;
};

export type AiChatRole = 'user' | 'assistant';

export type AiChatSessionRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AiChatMessageRow = {
  id: string;
  session_id: string;
  role: AiChatRole;
  content: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  created_at: string;
};

export type TeacherAssignmentRow = {
  id: string;
  teacher_id: string;
  school_id: string;
  subject_catalog_id: string;
  class_id: string;
  created_by: string | null;
  created_at: string;
};

export type ClassRow = {
  id: string;
  school_id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
};

export type SocialVisibility = 'private' | 'friends' | 'school' | 'public';

export type SocialProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  banner_url: string | null;
  visibility: SocialVisibility;
  created_at: string;
  updated_at: string;
};

export type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type PostRow = {
  id: string;
  author_id: string;
  school_id: string | null;
  content: string;
  media: Json;
  visibility: SocialVisibility;
  community_id: string | null;
  shared_resource_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentRatingRow = {
  resource_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportTargetType = 'post' | 'comment' | 'message' | 'community' | 'user';
export type ReportReason = 'spam' | 'assedio' | 'conteudo_impropio' | 'informacao_falsa' | 'outro';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

export type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ReportRpcRow = {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporter_name: string;
  target_preview: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type EventVisibility = 'school' | 'public';
export type EventRegistrationStatus = 'registered' | 'waitlisted' | 'cancelled';

export type EventRow = {
  id: string;
  school_id: string;
  community_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  visibility: EventVisibility;
  cancelled_at: string | null;
  created_at: string;
};

export type EventRegistrationRow = {
  event_id: string;
  user_id: string;
  status: EventRegistrationStatus;
  check_in_code: string;
  registered_at: string;
  cancelled_at: string | null;
};

export type AttendanceRow = {
  event_id: string;
  user_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
};

export type CertificateRow = {
  event_id: string;
  user_id: string;
  issued_at: string;
};

export type EventListRpcRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  community_id: string | null;
  community_name: string | null;
  cancelled_at: string | null;
  registered_count: number;
  my_status: EventRegistrationStatus | null;
  can_manage: boolean;
};

export type EventDetailRpcRow = EventListRpcRow & {
  waitlisted_count: number;
};

export type EventRegistrantRpcRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  status: EventRegistrationStatus;
  registered_at: string;
  checked_in_at: string | null;
};

export type CommunityVisibility = 'public' | 'school' | 'private';
export type CommunityMemberRole = 'owner' | 'moderator' | 'member';

export type CommunityRow = {
  id: string;
  owner_id: string;
  school_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  rules: string | null;
  visibility: CommunityVisibility;
  created_at: string;
};

export type CommunityMemberRow = {
  community_id: string;
  user_id: string;
  role: CommunityMemberRole;
  joined_at: string;
};

export type CommunityListRpcRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: CommunityVisibility;
  member_count: number;
  is_member: boolean;
  my_role: CommunityMemberRole | null;
};

export type CommunityDetailRpcRow = CommunityListRpcRow & {
  rules: string | null;
};

export type CommunityMemberRpcRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: CommunityMemberRole;
  joined_at: string;
};

export type MessageRow = {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
};

export type MessageRpcRow = {
  id: string;
  community_id: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
  edited_at: string | null;
  is_own: boolean;
};

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type PostLikeRow = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type PostSaveRow = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type FeedPostRpcRow = {
  id: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  content: string;
  media: Json;
  visibility: SocialVisibility;
  created_at: string;
  like_count: number;
  comment_count: number;
  viewer_has_liked: boolean;
  viewer_has_saved: boolean;
  is_own: boolean;
  shared_resource_id: string | null;
  shared_resource_title: string | null;
  shared_resource_kind: ResourceKind | null;
};

export type PostCommentRpcRow = {
  id: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
  is_own: boolean;
};

/* ------------------------------------------------------------- views --- */

export type VResourceLibraryRow = {
  id: string;
  kind: ResourceKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  difficulty: Difficulty;
  xp_reward: number;
  school_id: string | null;
  subject_catalog_id: string;
  subject_name: string;
  subject_slug: string;
  subject_color: string;
  topic_id: string | null;
  topic_name: string | null;
  sort_order: number;
  published_at: string | null;
  question_count: number;
  bimestre: number | null;
};

export type VTrackLessonResolvedRow = {
  lesson_id: string;
  section_id: string;
  track_id: string;
  subject_catalog_id: string;
  school_id: string | null;
  section_title: string;
  section_position: number;
  lesson_position: number;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  xp_reward: number;
  unlock_after_lesson_id: string | null;
  raw_state: LessonState;
  correct_streak: number | null;
  completed_at: string | null;
  is_locked: boolean;
  resource_count: number;
};

export type Database = {
  public: {
    Tables: {
      schools: Table<SchoolRow>;
      profiles: Table<ProfileRow>;
      academic_years: Table<AcademicYearRow>;
      terms: Table<TermRow>;
      subject_catalog: Table<SubjectCatalogRow>;
      subjects: Table<SubjectRow>;
      routines: Table<RoutineRow>;
      routine_completions: Table<RoutineCompletionRow>;
      tasks: Table<TaskRow>;
      study_sessions: Table<StudySessionRow>;
      timetable_slots: Table<TimetableSlotRow>;
      attachments: Table<AttachmentRow>;
      user_stats: Table<UserStatsRow>;
      xp_events: Table<XpEventRow>;
      achievements: Table<AchievementRow>;
      user_achievements: Table<UserAchievementRow>;
      content_topics: Table<ContentTopicRow>;
      resources: Table<ResourceRow>;
      resource_chapters: Table<ResourceChapterRow>;
      questions: Table<QuestionRow>;
      question_options: Table<QuestionOptionRow>;
      tracks: Table<TrackRow>;
      track_sections: Table<TrackSectionRow>;
      track_lessons: Table<TrackLessonRow>;
      track_lesson_resources: Table<TrackLessonResourceRow>;
      resource_progress: Table<ResourceProgressRow>;
      quiz_attempts: Table<QuizAttemptRow>;
      quiz_answers: Table<QuizAnswerRow>;
      lesson_progress: Table<LessonProgressRow>;
      highlights: Table<HighlightRow>;
      flashcard_reviews: Table<FlashcardReviewRow>;
      content_reviews: Table<ContentReviewRow>;
      long_term_goals: Table<LongTermGoalRow>;
      ai_chat_sessions: Table<AiChatSessionRow>;
      ai_chat_messages: Table<AiChatMessageRow>;
      notifications: Table<NotificationRow>;
      push_subscriptions: Table<PushSubscriptionRow>;
      teacher_assignments: Table<TeacherAssignmentRow>;
      classes: Table<ClassRow>;
      writing_tasks: Table<WritingTaskRow>;
      essay_submissions: Table<EssaySubmissionRow>;
      feature_flags: Table<FeatureFlagRow>;
      social_profiles: Table<SocialProfileRow>;
      follows: Table<FollowRow>;
      posts: Table<PostRow>;
      comments: Table<CommentRow>;
      post_likes: Table<PostLikeRow>;
      post_saves: Table<PostSaveRow>;
      communities: Table<CommunityRow>;
      community_members: Table<CommunityMemberRow>;
      messages: Table<MessageRow>;
      content_ratings: Table<ContentRatingRow>;
      reports: Table<ReportRow>;
      events: Table<EventRow>;
      event_registrations: Table<EventRegistrationRow>;
      attendance: Table<AttendanceRow>;
      certificates: Table<CertificateRow>;
      exams: Table<ExamRow>;
      exam_editions: Table<ExamEditionRow>;
      vestibular_profiles: Table<VestibularProfileRow>;
      user_exam_targets: Table<UserExamTargetRow>;
      practice_sessions: Table<PracticeSessionRow>;
      practice_answers: Table<PracticeAnswerRow>;
    };
    Views: {
      v_resource_library: View<VResourceLibraryRow>;
      v_track_lessons_resolved: View<VTrackLessonResolvedRow>;
    };
    Functions: {
      user_local_date: { Args: { p_user_id?: string }; Returns: string };
      user_month_start: { Args: { p_user_id?: string }; Returns: string };
      xp_to_level: { Args: { p_xp: number }; Returns: number };
      ensure_user_stats: { Args: { p_user_id?: string }; Returns: undefined };
      award_xp: {
        Args: {
          p_amount: number;
          p_reason: string;
          p_source_type?: XpSourceType;
          p_source_id?: string | null;
          p_user_id?: string;
        };
        Returns: number;
      };
      touch_streak: { Args: { p_user_id?: string }; Returns: number };
      check_achievements: { Args: { p_user_id?: string }; Returns: void };
      school_ranking: {
        Args: {
          p_scope?: 'escola' | 'turma';
          p_class_id?: string | null;
          p_period?: 'hoje' | 'semana' | 'mes' | 'geral';
          p_school_id?: string | null;
        };
        Returns: {
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          class_name: string | null;
          xp: number;
          level: number;
          current_streak: number;
          questions_answered: number;
          study_hours: number;
          rank: number;
          previous_rank: number | null;
        }[];
      };
      ranking_evolution: {
        Args: { p_user_id?: string; p_days?: number };
        Returns: {
          day: string;
          me_xp: number;
          school_avg_xp: number;
          top1_xp: number;
        }[];
      };
      student_profile_card: { Args: { p_user_id: string }; Returns: Json | null };
      send_friend_request: { Args: { p_addressee_id: string }; Returns: string };
      respond_friend_request: { Args: { p_requester_id: string; p_accept: boolean }; Returns: void };
      remove_friend: { Args: { p_other_id: string }; Returns: void };
      follow_user: { Args: { p_target_id: string }; Returns: void };
      unfollow_user: { Args: { p_target_id: string }; Returns: void };
      are_friends: { Args: { p_a: string; p_b: string }; Returns: boolean };
      can_view_post: { Args: { p_post_id: string; p_user_id?: string }; Returns: boolean };
      create_post: {
        Args: {
          p_content: string;
          p_visibility?: SocialVisibility;
          p_community_id?: string | null;
          p_shared_resource_id?: string | null;
        };
        Returns: string;
      };
      update_post: {
        Args: { p_post_id: string; p_content: string; p_visibility: SocialVisibility };
        Returns: void;
      };
      delete_post: { Args: { p_post_id: string }; Returns: void };
      like_post: { Args: { p_post_id: string }; Returns: void };
      unlike_post: { Args: { p_post_id: string }; Returns: void };
      save_post: { Args: { p_post_id: string }; Returns: void };
      unsave_post: { Args: { p_post_id: string }; Returns: void };
      create_comment: { Args: { p_post_id: string; p_content: string }; Returns: string };
      delete_comment: { Args: { p_comment_id: string }; Returns: void };
      list_feed: { Args: { p_limit?: number; p_before?: string | null }; Returns: FeedPostRpcRow[] };
      list_saved_posts: {
        Args: { p_limit?: number; p_before?: string | null };
        Returns: FeedPostRpcRow[];
      };
      list_post_comments: { Args: { p_post_id: string }; Returns: PostCommentRpcRow[] };
      is_community_member: { Args: { p_community_id: string; p_user_id?: string }; Returns: boolean };
      can_view_community: { Args: { p_community_id: string; p_user_id?: string }; Returns: boolean };
      create_community: {
        Args: { p_name: string; p_description?: string | null; p_visibility?: CommunityVisibility };
        Returns: string;
      };
      join_community: { Args: { p_community_id: string }; Returns: void };
      leave_community: { Args: { p_community_id: string }; Returns: void };
      delete_community: { Args: { p_community_id: string }; Returns: void };
      set_member_role: {
        Args: { p_community_id: string; p_user_id: string; p_role: 'member' | 'moderator' };
        Returns: void;
      };
      remove_member: { Args: { p_community_id: string; p_user_id: string }; Returns: void };
      add_member: { Args: { p_community_id: string; p_user_id: string }; Returns: void };
      list_communities: { Args: { p_query?: string | null }; Returns: CommunityListRpcRow[] };
      get_community: { Args: { p_community_id: string }; Returns: CommunityDetailRpcRow[] };
      list_community_members: { Args: { p_community_id: string }; Returns: CommunityMemberRpcRow[] };
      list_community_feed: {
        Args: { p_community_id: string; p_limit?: number; p_before?: string | null };
        Returns: FeedPostRpcRow[];
      };
      send_message: { Args: { p_community_id: string; p_content: string }; Returns: string };
      edit_message: { Args: { p_message_id: string; p_content: string }; Returns: void };
      delete_message: { Args: { p_message_id: string }; Returns: void };
      list_messages: {
        Args: { p_community_id: string; p_limit?: number; p_before?: string | null };
        Returns: MessageRpcRow[];
      };
      rate_resource: {
        Args: { p_resource_id: string; p_rating: number; p_comment?: string | null };
        Returns: void;
      };
      remove_resource_rating: { Args: { p_resource_id: string }; Returns: void };
      get_resource_rating: {
        Args: { p_resource_id: string };
        Returns: { average: number | null; rating_count: number; my_rating: number | null }[];
      };
      is_feature_enabled: { Args: { p_key: string }; Returns: boolean };
      report_target_school: { Args: { p_target_type: ReportTargetType; p_target_id: string }; Returns: string | null };
      create_report: {
        Args: {
          p_target_type: ReportTargetType;
          p_target_id: string;
          p_reason: ReportReason;
          p_details?: string | null;
        };
        Returns: string;
      };
      list_reports: { Args: { p_status?: ReportStatus | null }; Returns: ReportRpcRow[] };
      resolve_report: { Args: { p_report_id: string; p_status: 'reviewed' | 'dismissed' }; Returns: void };
      count_pending_reports: { Args: Record<string, never>; Returns: number };
      can_view_event: { Args: { p_event_id: string; p_user_id?: string }; Returns: boolean };
      can_manage_event: { Args: { p_event_id: string; p_user_id?: string }; Returns: boolean };
      create_event: {
        Args: {
          p_title: string;
          p_starts_at: string;
          p_description?: string | null;
          p_location?: string | null;
          p_ends_at?: string | null;
          p_capacity?: number | null;
          p_visibility?: EventVisibility;
          p_community_id?: string | null;
          p_school_id?: string | null;
        };
        Returns: string;
      };
      update_event: {
        Args: {
          p_event_id: string;
          p_title: string;
          p_starts_at: string;
          p_description?: string | null;
          p_location?: string | null;
          p_ends_at?: string | null;
          p_capacity?: number | null;
        };
        Returns: void;
      };
      cancel_event: { Args: { p_event_id: string }; Returns: void };
      register_for_event: { Args: { p_event_id: string }; Returns: EventRegistrationStatus };
      cancel_registration: { Args: { p_event_id: string }; Returns: void };
      list_events: { Args: { p_upcoming_only?: boolean }; Returns: EventListRpcRow[] };
      get_event: { Args: { p_event_id: string }; Returns: EventDetailRpcRow[] };
      list_event_registrants: { Args: { p_event_id: string }; Returns: EventRegistrantRpcRow[] };
      get_my_event_ticket: {
        Args: { p_event_id: string };
        Returns: { status: EventRegistrationStatus; check_in_code: string | null; checked_in_at: string | null }[];
      };
      check_in_by_code: {
        Args: { p_code: string };
        Returns: { user_id: string; full_name: string | null; event_id: string; event_title: string }[];
      };
      check_in_manually: { Args: { p_event_id: string; p_user_id: string }; Returns: void };
      get_my_certificate: {
        Args: { p_event_id: string };
        Returns: { issued_at: string; event_title: string; full_name: string | null; event_date: string }[];
      };
      search_schoolmates: {
        Args: { p_query: string };
        Returns: {
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          class_name: string | null;
          friendship_status: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
        }[];
      };
      suggested_people: {
        Args: { p_limit?: number };
        Returns: {
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          class_name: string | null;
        }[];
      };
      list_friends: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          class_name: string | null;
          level: number;
          xp: number;
          current_streak: number;
        }[];
      };
      list_friend_requests: {
        Args: Record<string, never>;
        Returns: {
          requester_id: string;
          full_name: string | null;
          avatar_url: string | null;
          class_name: string | null;
          created_at: string;
        }[];
      };
      is_admin: { Args: { p_user_id?: string }; Returns: boolean };
      current_school_id: { Args: { p_user_id?: string }; Returns: string | null };
      can_manage_school: { Args: { p_school_id: string | null; p_user_id?: string }; Returns: boolean };
      can_view_resource: { Args: { p_resource_id: string; p_user_id?: string }; Returns: boolean };
      create_ai_resource: {
        Args: {
          p_kind: 'quiz' | 'resumo';
          p_subject_catalog_id: string;
          p_title: string;
          p_description?: string | null;
          p_body?: string | null;
          p_questions?: unknown;
        };
        Returns: string;
      };
      list_my_ai_resources: { Args: Record<string, never>; Returns: CreatorResourceRpcRow[] };
      update_ai_resource_visibility: {
        Args: { p_resource_id: string; p_visibility: ResourceVisibility; p_community_id?: string | null };
        Returns: void;
      };
      delete_ai_resource: { Args: { p_resource_id: string }; Returns: void };
      save_vestibular_profile: {
        Args: {
          p_main_exam_id?: string | null;
          p_target_year?: number | null;
          p_graduation_year?: number | null;
          p_daily_study_minutes?: number | null;
        };
        Returns: void;
      };
      get_vestibular_profile: { Args: Record<string, never>; Returns: VestibularProfileRpcRow[] };
      set_exam_target: {
        Args: {
          p_exam_id: string;
          p_target_year?: number | null;
          p_priority?: number;
          p_target_course?: string | null;
          p_target_score?: number | null;
        };
        Returns: void;
      };
      remove_exam_target: { Args: { p_exam_id: string }; Returns: void };
      list_exam_targets: { Args: Record<string, never>; Returns: ExamTargetRpcRow[] };
      list_exams: { Args: Record<string, never>; Returns: ExamListRpcRow[] };
      list_vestibular_resources: {
        Args: {
          p_exam_id?: string | null;
          p_year?: number | null;
          p_subject_catalog_id?: string | null;
          p_kind?: string | null;
          p_limit?: number;
        };
        Returns: VestibularResourceRpcRow[];
      };
      vestibular_overview: { Args: Record<string, never>; Returns: VestibularOverviewRpcRow[] };
      practice_filters: { Args: Record<string, never>; Returns: PracticeFilterRpcRow[] };
      start_practice_session: {
        Args: {
          p_exam_id?: string | null;
          p_subject_catalog_id?: string | null;
          p_difficulty?: string | null;
          p_question_count?: number;
        };
        Returns: string;
      };
      practice_questions: { Args: { p_session_id: string }; Returns: PracticeQuestionRpcRow[] };
      answer_practice_question: {
        Args: {
          p_session_id: string;
          p_question_id: string;
          p_option_id: string | null;
          p_time_spent_seconds?: number;
        };
        Returns: { is_correct: boolean; correct_option_id: string | null; explanation: string | null }[];
      };
      finish_practice_session: {
        Args: { p_session_id: string };
        Returns: { correct_count: number; total_count: number; xp_awarded: number }[];
      };
      practice_session_review: { Args: { p_session_id: string }; Returns: PracticeReviewRpcRow[] };
      list_practice_sessions: { Args: { p_limit?: number }; Returns: PracticeSessionListRpcRow[] };
      vestibular_subject_performance: {
        Args: Record<string, never>;
        Returns: VestibularSubjectPerformanceRpcRow[];
      };
      vestibular_topic_performance: {
        Args: { p_subject_catalog_id?: string | null };
        Returns: VestibularTopicPerformanceRpcRow[];
      };
      vestibular_error_list: {
        Args: { p_subject_catalog_id?: string | null; p_limit?: number };
        Returns: VestibularErrorRpcRow[];
      };
      start_error_practice: {
        Args: { p_subject_catalog_id?: string | null; p_question_count?: number };
        Returns: string;
      };
      quiz_questions: {
        Args: { p_resource_id: string };
        Returns: {
          question_id: string;
          question_position: number;
          statement: string;
          difficulty: Difficulty;
          points: number;
          topic_name: string | null;
          subject_name: string;
          group_id: string | null;
          resource_refs: string[];
          subtopic: string | null;
          skills: string[];
          options: { id: string; position: number; body: string }[];
        }[];
      };
      start_quiz_attempt: { Args: { p_resource_id: string }; Returns: string };
      quiz_attempt_state: {
        Args: { p_attempt_id: string };
        Returns: { question_id: string; option_id: string | null; flagged: boolean }[];
      };
      answer_quiz_question: {
        Args: {
          p_attempt_id: string;
          p_question_id: string;
          p_option_id: string | null;
          p_time_spent_seconds?: number;
        };
        Returns: { is_correct: boolean; correct_option_id: string | null; explanation: string | null }[];
      };
      toggle_question_flag: {
        Args: { p_attempt_id: string; p_question_id: string };
        Returns: boolean;
      };
      finish_quiz_attempt: {
        Args: { p_attempt_id: string };
        Returns: {
          correct_count: number;
          total_count: number;
          duration_seconds: number;
          xp_awarded: number;
        }[];
      };
      quiz_attempt_review: {
        Args: { p_attempt_id: string };
        Returns: {
          question_id: string;
          question_position: number;
          statement: string;
          explanation: string | null;
          topic_name: string | null;
          subject_name: string;
          subtopic: string | null;
          book: number | null;
          module: number | null;
          skills: string[];
          error_types: string[];
          difficulty: Difficulty;
          resource_refs: string[];
          time_spent_seconds: number;
          chosen_option_id: string | null;
          correct_option_id: string | null;
          is_correct: boolean;
        }[];
      };
      save_essay_draft: {
        Args: { p_attempt_id: string; p_writing_task_id: string; p_content: string };
        Returns: number;
      };
      submit_essay: {
        Args: { p_attempt_id: string; p_writing_task_id: string };
        Returns: undefined;
      };
      grade_essay: {
        Args: { p_essay_id: string; p_scores: Record<string, number>; p_total_score: number };
        Returns: undefined;
      };
      list_essays_for_grading: {
        Args: { p_resource_id: string };
        Returns: {
          essay_id: string;
          attempt_id: string;
          writing_task_id: string;
          writing_task_title: string;
          student_name: string | null;
          content: string;
          word_count: number;
          submitted_at: string | null;
          total_score: number | null;
          scores: Record<string, number> | null;
          evaluation_criteria: EvaluationCriterion[];
        }[];
      };
      quiz_attempt_topics: {
        Args: { p_attempt_id: string };
        Returns: { topic_id: string | null; topic_name: string; correct_count: number; total_count: number }[];
      };
      topic_mastery: {
        Args: { p_user_id?: string };
        Returns: {
          subject_id: string;
          subject_name: string;
          subject_color: string;
          topic_id: string | null;
          topic_name: string;
          correct_count: number;
          total_count: number;
          mastery_percent: number;
          status: 'dominado' | 'desenvolvimento' | 'revisar';
        }[];
      };
      admin_topic_mastery: {
        Args: { p_target_user_id: string };
        Returns: {
          subject_id: string;
          subject_name: string;
          subject_color: string;
          topic_id: string | null;
          topic_name: string;
          correct_count: number;
          total_count: number;
          mastery_percent: number;
          status: 'dominado' | 'desenvolvimento' | 'revisar';
        }[];
      };
      class_subject_mastery: {
        Args: { p_school_id: string; p_subject_catalog_id: string; p_class_id?: string | null };
        Returns: {
          topic_name: string;
          correct_count: number;
          total_count: number;
          mastery_percent: number;
          student_count: number;
        }[];
      };
      skill_mastery: {
        Args: { p_user_id?: string };
        Returns: {
          skill: string;
          correct_count: number;
          total_count: number;
          mastery_percent: number;
          status: 'dominado' | 'desenvolvimento' | 'revisar';
        }[];
      };
      common_error_types: {
        Args: { p_user_id?: string };
        Returns: {
          error_type: string;
          occurrences: number;
        }[];
      };
      recent_errors: {
        Args: { p_user_id?: string };
        Returns: {
          question_id: string;
          statement: string;
          explanation: string | null;
          difficulty: Difficulty;
          resource_id: string;
          resource_title: string;
          subject_id: string;
          subject_name: string;
          subject_color: string;
          topic_id: string | null;
          topic_name: string | null;
          chosen_body: string | null;
          correct_body: string | null;
          answered_at: string;
        }[];
      };
      dismiss_question_error: { Args: { p_question_id: string }; Returns: undefined };
      notify_subject_students: {
        Args: {
          p_subject_catalog_id: string;
          p_title: string;
          p_body: string;
          p_link?: string | null;
          p_school_id?: string | null;
        };
        /** `user_id` de cada aluno notificado — usado para mandar push a eles também. */
        Returns: string[];
      };
      review_queue: {
        Args: { p_user_id?: string };
        Returns: {
          kind: 'erro' | 'conteudo';
          bucket: 'atrasada' | 'hoje' | 'proxima' | 'concluida';
          question_id: string | null;
          resource_id: string;
          resource_title: string;
          subject_id: string;
          subject_name: string;
          subject_color: string;
          topic_name: string | null;
          statement: string | null;
          explanation: string | null;
          chosen_body: string | null;
          correct_body: string | null;
          answered_at: string | null;
          due_date: string;
          next_interval_step: number;
          resource_kind: ResourceKind | null;
        }[];
      };
      subject_scores: {
        Args: { p_user_id?: string };
        Returns: {
          subject_id: string;
          subject_name: string;
          subject_color: string;
          has_content: boolean;
          assessment_score: number | null;
          empenho_index: number;
          blended_score: number | null;
          quizzes_done: number;
          simulados_done: number;
          content_completed: number;
          target_grade: number | null;
          passing_grade: number;
        }[];
      };
      performance_evolution: {
        Args: { p_user_id?: string; p_weeks?: number };
        Returns: {
          week_start: string;
          assessment_score: number | null;
          empenho_index: number;
          blended_score: number | null;
        }[];
      };
      simulado_history: {
        Args: { p_user_id?: string };
        Returns: {
          attempt_id: string;
          resource_id: string;
          resource_title: string;
          subject_id: string | null;
          subject_name: string | null;
          subject_color: string | null;
          correct_count: number;
          total_count: number;
          percent: number;
          duration_seconds: number;
          finished_at: string;
        }[];
      };
      admin_subject_scores: {
        Args: { p_target_user_id: string };
        Returns: {
          subject_id: string;
          subject_name: string;
          subject_color: string;
          has_content: boolean;
          assessment_score: number | null;
          empenho_index: number;
          blended_score: number | null;
          quizzes_done: number;
          simulados_done: number;
          content_completed: number;
          target_grade: number | null;
          passing_grade: number;
        }[];
      };
      admin_performance_evolution: {
        Args: { p_target_user_id: string; p_weeks?: number };
        Returns: {
          week_start: string;
          assessment_score: number | null;
          empenho_index: number;
          blended_score: number | null;
        }[];
      };
      admin_simulado_history: {
        Args: { p_target_user_id: string };
        Returns: {
          attempt_id: string;
          resource_id: string;
          resource_title: string;
          subject_id: string | null;
          subject_name: string | null;
          subject_color: string | null;
          correct_count: number;
          total_count: number;
          percent: number;
          duration_seconds: number;
          finished_at: string;
        }[];
      };
      admin_study_sessions: {
        Args: { p_target_user_id: string };
        Returns: { local_date: string; duration_seconds: number }[];
      };
      admin_user_stats: {
        Args: { p_target_user_id: string };
        Returns: {
          xp: number;
          level: number;
          current_streak: number;
          longest_streak: number;
          total_study_seconds: number;
          last_active_local_date: string | null;
        }[];
      };
      admin_school_summary: {
        Args: { p_school_id?: string | null };
        Returns: {
          student_count: number;
          active_last_7d_count: number;
          total_study_seconds: number;
          avg_current_streak: number;
          quizzes_done_30d: number;
          simulados_done_30d: number;
        }[];
      };
      is_teacher_of: {
        Args: { p_school_id: string; p_subject_catalog_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_teacher_of_student: {
        Args: { p_target_user_id: string; p_user_id?: string };
        Returns: boolean;
      };
      notify_class: {
        Args: {
          p_class_id: string;
          p_subject_catalog_id: string;
          p_school_id: string;
          p_title: string;
          p_body: string | null;
          p_link?: string | null;
        };
        /** `user_id` de cada aluno notificado — usado para mandar push a eles também. */
        Returns: string[];
      };
      mark_resource_progress: {
        Args: {
          p_resource_id: string;
          p_percent?: number | null;
          p_position_seconds?: number | null;
          p_completed?: boolean;
        };
        Returns: undefined;
      };
      start_lesson: { Args: { p_lesson_id: string }; Returns: undefined };
      complete_lesson: {
        Args: { p_lesson_id: string; p_flawless?: boolean };
        Returns: { state: LessonState; xp_awarded: number }[];
      };
      bootstrap_student: {
        Args: {
          p_full_name: string;
          p_grade_level?: string | null;
          p_school_id?: string | null;
          p_timezone?: string;
          p_year_label?: string | null;
          p_year_starts_on?: string | null;
          p_year_ends_on?: string | null;
          p_term_count?: number;
          p_catalog_ids?: string[];
          p_custom_subjects?: string[];
          p_daily_goal_minutes?: number | null;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
