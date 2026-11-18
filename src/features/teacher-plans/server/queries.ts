import { createClient } from '@/lib/supabase/server';

export interface PlanSummary {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

/** Antes do SQL rodar a tabela não existe: devolve vazio em vez de quebrar a tela. */
export async function listPlans(): Promise<PlanSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('teacher_plans')
    .select('id, title, content, updated_at')
    .eq('teacher_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, title: p.title, content: p.content, updatedAt: p.updated_at }));
}

export async function getPlan(id: string): Promise<PlanSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('teacher_plans').select('id, title, content, updated_at').eq('id', id).maybeSingle();
  return data ? { id: data.id, title: data.title, content: data.content, updatedAt: data.updated_at } : null;
}
