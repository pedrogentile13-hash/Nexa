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
  | 'prova';
export type StudySource = 'timer' | 'manual';
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
  | 'resource';
export type UserRole = 'student' | 'school_admin' | 'admin';
export type ResourceKind = 'resumo' | 'podcast' | 'video' | 'imagem' | 'musica' | 'quiz' | 'simulado';
export type Difficulty = 'facil' | 'medio' | 'dificil';
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
  class_name: string | null;
  timezone: string;
  locale: string;
  theme_preference: ThemePreference;
  role: UserRole;
  weekly_study_goal_minutes: number;
  daily_study_goal_minutes: number;
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

export type AchievementRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  metric: string;
  threshold: number;
  xp_reward: number;
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
  /** Para kind='resumo': texto digitado ou arquivo enviado. */
  content_format: 'markdown' | 'pdf';
  pdf_page_count: number | null;
  pdf_extracted_text: string | null;
  pdf_status: 'processado' | 'erro' | null;
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
    };
    Views: {
      v_resource_library: View<VResourceLibraryRow>;
      v_track_lessons_resolved: View<VTrackLessonResolvedRow>;
    };
    Functions: {
      user_local_date: { Args: { p_user_id?: string }; Returns: string };
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
      is_admin: { Args: { p_user_id?: string }; Returns: boolean };
      current_school_id: { Args: { p_user_id?: string }; Returns: string | null };
      can_manage_school: { Args: { p_school_id: string | null; p_user_id?: string }; Returns: boolean };
      can_view_resource: { Args: { p_resource_id: string; p_user_id?: string }; Returns: boolean };
      quiz_questions: {
        Args: { p_resource_id: string };
        Returns: {
          question_id: string;
          question_position: number;
          statement: string;
          difficulty: Difficulty;
          points: number;
          topic_name: string | null;
          options: { id: string; position: number; body: string }[];
        }[];
      };
      start_quiz_attempt: { Args: { p_resource_id: string }; Returns: string };
      answer_quiz_question: {
        Args: { p_attempt_id: string; p_question_id: string; p_option_id: string | null };
        Returns: { is_correct: boolean; correct_option_id: string | null; explanation: string | null }[];
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
          chosen_option_id: string | null;
          correct_option_id: string | null;
          is_correct: boolean;
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
          p_class_name?: string | null;
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
