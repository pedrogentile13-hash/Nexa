import { createClient } from '@/lib/supabase/server';
import type {
  ExamTopicWeightSource,
  StudyPlanPhase,
  StudyPlanReason,
} from '@/types/database.types';

/**
 * O plano de estudo. A conta inteira mora no banco
 * (`vestibular_study_plan`) porque ela cruza duas coisas que já vivem lá —
 * o peso do assunto na prova e o domínio do aluno — e refazê-la aqui
 * significaria trazer as duas tabelas inteiras pro Node pra reordenar.
 */

export interface StudyPlanItem {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  frequencyPercent: number;
  frequencySource: ExamTopicWeightSource;
  /** `null` = o aluno ainda não respondeu nada deste assunto. */
  masteryPercent: number | null;
  answeredCount: number;
  priorityScore: number;
  reason: StudyPlanReason;
}

export interface StudyPlan {
  items: StudyPlanItem[];
  phase: StudyPlanPhase;
  daysUntil: number | null;
}

export async function getVestibularStudyPlan(limit = 20): Promise<StudyPlan> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('vestibular_study_plan', { p_limit: limit });
  // `phase`/`days_until` são os mesmos em toda linha (é contexto da prova, não
  // do assunto); a primeira linha responde pelas duas.
  const first = data?.[0];
  if (error || !data || !first) {
    return { items: [], phase: 'base', daysUntil: null };
  }

  return {
    phase: first.phase,
    daysUntil: first.days_until,
    items: data.map((r) => ({
      topicId: r.topic_id,
      topicName: r.topic_name,
      subjectId: r.subject_id,
      subjectName: r.subject_name,
      subjectColor: r.subject_color,
      frequencyPercent: Number(r.frequency_percent),
      frequencySource: r.frequency_source,
      masteryPercent: r.mastery_percent === null ? null : Number(r.mastery_percent),
      answeredCount: Number(r.answered_count),
      priorityScore: Number(r.priority_score),
      reason: r.reason,
    })),
  };
}
