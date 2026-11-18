import { createClient } from '@/lib/supabase/server';

/** Leituras do ano letivo. Antes do SQL rodar, as funções não existem: tudo devolve vazio em vez de quebrar a tela. */

export interface YearRow {
  id: string;
  year: number;
  status: 'planning' | 'current' | 'closed';
  classes: number;
  students: number;
  results: number;
}

export async function listYears(): Promise<YearRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('school_years_overview');
  if (error || !data) return [];
  return data.map((y) => ({ id: y.year_id, year: y.year, status: y.status as YearRow['status'], classes: y.classes, students: y.students, results: y.results }));
}

export async function currentYearNumber(): Promise<number | null> {
  return (await listYears()).find((y) => y.status === 'current')?.year ?? null;
}

export interface PlanClass {
  id: string;
  name: string;
  grade: string | null;
  from: string | null;
  students: number;
  teachers: { id: string; teacher: string; subject: string }[];
}
export interface PlanStudent {
  id: string;
  name: string;
  planClassId: string | null;
  fromClass: string | null;
  graduating: boolean;
}
export interface Plan {
  year: number;
  status: string;
  classes: PlanClass[];
  students: PlanStudent[];
}

export async function getPlan(yearId: string): Promise<Plan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('year_plan_overview', { p_year_id: yearId });
  if (error || !data) return null;
  return data as unknown as Plan;
}

export interface HistoryClass {
  id: string;
  name: string;
  grade: string | null;
  teachers: string;
  students: { id: string; name: string; average: number | null }[];
}
export interface History {
  year: number;
  status: string;
  classes: HistoryClass[];
}

export async function getHistory(yearId: string): Promise<History | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('year_history', { p_year_id: yearId });
  if (error || !data) return null;
  return data as unknown as History;
}
