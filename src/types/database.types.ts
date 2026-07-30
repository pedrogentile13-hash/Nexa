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
  | 'custom';
export type StudySource = 'timer' | 'manual';
export type AttachmentKind = 'summary' | 'exercise' | 'file' | 'link';
export type XpSourceType =
  | 'task'
  | 'routine'
  | 'study_session'
  | 'activity'
  | 'achievement'
  | 'system';
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
  weekly_study_goal_minutes: number;
  daily_study_goal_minutes: number;
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

export type GradingSchemeRow = {
  id: string;
  user_id: string;
  name: string;
  grade_min: number;
  grade_max: number;
  passing_grade: number;
  decimals: number;
  rounding_mode: RoundingMode;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type GradingSchemeCategoryRow = {
  id: string;
  user_id: string;
  scheme_id: string;
  name: string;
  short_code: string | null;
  weight_percent: number;
  sequence: number;
  drop_lowest: number;
  allows_replacement: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type SubjectTermRow = {
  id: string;
  user_id: string;
  subject_id: string;
  term_id: string;
  scheme_id: string | null;
  target_grade: number | null;
  final_grade_override: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityRow = {
  id: string;
  user_id: string;
  subject_term_id: string;
  category_id: string;
  title: string;
  score: number | null;
  max_score: number | null;
  weight: number;
  due_date: string | null;
  graded_at: string | null;
  teacher_name: string | null;
  notes: string | null;
  is_dropped: boolean;
  replaces_activity_id: string | null;
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
  activity_id: string | null;
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
  activity_id: string | null;
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
  activity_id: string | null;
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

// ─────────────────────────────────────────────────────────── views ──────────
// Read-only projections. These, not the client, are the authority on averages.

export type VSubjectTermResolvedRow = {
  subject_term_id: string;
  user_id: string;
  subject_id: string;
  term_id: string;
  subject_term_target: number | null;
  final_grade_override: number | null;
  notes: string | null;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  subject_target: number | null;
  subject_archived_at: string | null;
  term_name: string;
  term_sequence: number;
  term_starts_on: string;
  term_ends_on: string;
  academic_year_id: string;
  scheme_id: string;
  scheme_name: string;
  grade_min: number;
  grade_max: number;
  passing_grade: number;
  decimals: number;
  rounding_mode: RoundingMode;
}

export type VActivityEffectiveRow = ActivityRow & {
  subject_id: string;
  term_id: string;
  subject_name: string;
  subject_color: string;
  grade_max: number;
  passing_grade: number;
  scheme_id: string;
  category_name: string;
  category_code: string | null;
  category_sequence: number;
  weight_percent: number;
  drop_lowest: number;
  is_superseded: boolean;
  normalized_score: number | null;
  lowest_rank: number | null;
  is_counted: boolean;
}

export type VCategoryAverageRow = {
  user_id: string;
  subject_term_id: string;
  subject_id: string;
  term_id: string;
  scheme_id: string;
  grade_max: number;
  passing_grade: number;
  category_id: string;
  category_name: string;
  category_code: string | null;
  category_sequence: number;
  weight_percent: number;
  drop_lowest: number;
  activity_count: number;
  counted_count: number;
  pending_count: number;
  counted_weight: number;
  average: number | null;
}

export type VSubjectTermAverageRow = {
  user_id: string;
  subject_term_id: string;
  subject_id: string;
  term_id: string;
  scheme_id: string;
  grade_max: number;
  passing_grade: number;
  category_count: number;
  graded_category_count: number;
  weight_total: number;
  graded_weight: number;
  activity_count: number;
  pending_count: number;
  average_current: number | null;
  subject_name: string;
  subject_color: string;
  subject_icon: string;
  term_name: string;
  term_sequence: number;
  term_starts_on: string;
  term_ends_on: string;
  academic_year_id: string;
  decimals: number;
  rounding_mode: RoundingMode;
  target_grade: number | null;
  final_grade: number | null;
  is_overridden: boolean;
  coverage_percent: number;
  is_below_passing: boolean;
  is_below_target: boolean;
}

export type VTermSummaryRow = {
  user_id: string;
  term_id: string;
  term_name: string;
  term_sequence: number;
  term_starts_on: string;
  term_ends_on: string;
  academic_year_id: string;
  subjects_total: number;
  subjects_graded: number;
  average_overall: number | null;
  lowest_grade: number | null;
  highest_grade: number | null;
  subjects_below_passing: number;
  subjects_below_target: number;
  pending_activities: number;
  avg_coverage_percent: number | null;
}

export type Database = {
  public: {
    Tables: {
      schools: Table<SchoolRow>;
      profiles: Table<ProfileRow>;
      academic_years: Table<AcademicYearRow>;
      terms: Table<TermRow>;
      subject_catalog: Table<SubjectCatalogRow>;
      subjects: Table<SubjectRow>;
      grading_schemes: Table<GradingSchemeRow>;
      grading_scheme_categories: Table<GradingSchemeCategoryRow>;
      subject_terms: Table<SubjectTermRow>;
      activities: Table<ActivityRow>;
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
    };
    Views: {
      v_subject_terms_resolved: View<VSubjectTermResolvedRow>;
      v_activities_effective: View<VActivityEffectiveRow>;
      v_category_averages: View<VCategoryAverageRow>;
      v_subject_term_averages: View<VSubjectTermAverageRow>;
      v_term_summary: View<VTermSummaryRow>;
    };
    Functions: {
      user_local_date: { Args: { p_user_id?: string }; Returns: string };
      current_term_id: { Args: { p_user_id?: string }; Returns: string | null };
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
          p_categories?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
