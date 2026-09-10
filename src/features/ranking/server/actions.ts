'use server';

import { createClient } from '@/lib/supabase/server';

export interface StudentProfileCard {
  fullName: string | null;
  avatarUrl: string | null;
  className: string | null;
  schoolName: string | null;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  studyHours: number;
  questionsAnswered: number;
  lastActivity: string | null;
  topSubjects: { name: string; count: number }[];
  achievements: {
    id: string;
    name: string;
    icon: string;
    rarity: 'comum' | 'rara' | 'epica' | 'lendaria';
    unlockedAt: string;
  }[];
}

/**
 * Cartão de perfil do modal do ranking.
 *
 * `profiles` não tem policy de leitura pra "colega da mesma escola" — só a
 * própria linha (+ admin). `student_profile_card` (RPC `security definer`,
 * migração 20260910000200) aplica essa barreira internamente e devolve só o
 * que o cartão precisa, nunca a linha inteira de `profiles`.
 */
export async function getStudentProfileCard(userId: string): Promise<StudentProfileCard | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('student_profile_card', { p_user_id: userId });

  if (error || !data) return null;

  const card = data as unknown as {
    fullName: string | null;
    avatarUrl: string | null;
    className: string | null;
    schoolName: string | null;
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    studyHours: number;
    questionsAnswered: number;
    lastActivity: string | null;
    topSubjects: { name: string; count: number }[];
    achievements: {
      id: string;
      name: string;
      icon: string;
      rarity: 'comum' | 'rara' | 'epica' | 'lendaria';
      unlockedAt: string;
    }[];
  };

  return card;
}
