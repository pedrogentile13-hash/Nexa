import { createClient } from '@/lib/supabase/server';
import type { ResourceKind } from '@/types/database.types';

export interface ContentRow {
  id: string;
  kind: ResourceKind;
  title: string;
  subjectName: string;
  published: boolean;
  questionCount: number;
  updatedAt: string;
}

/** Conteúdo que esta pessoa pode gerir (a RLS recorta: professor = as matérias dele; coordenação = a escola). Nunca o conteúdo de IA dos alunos. */
export async function listContent(filters: { kind?: string; status?: string; q?: string }): Promise<ContentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('resources')
    .select('id, kind, title, is_published, updated_at, subject_catalog(name), questions(count)')
    .eq('ai_generated', false)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (filters.kind) query = query.eq('kind', filters.kind as ResourceKind);
  if (filters.status === 'publicados') query = query.eq('is_published', true);
  if (filters.status === 'rascunhos') query = query.eq('is_published', false);
  if (filters.q) query = query.ilike('title', `%${filters.q}%`);

  const { data } = await query;
  return (data ?? []).map((r) => {
    const subject = r.subject_catalog as unknown as { name: string } | null;
    const count = r.questions as unknown as { count: number }[] | null;
    return {
      id: r.id,
      kind: r.kind,
      title: r.title,
      subjectName: subject?.name ?? '—',
      published: r.is_published,
      questionCount: count?.[0]?.count ?? 0,
      updatedAt: r.updated_at,
    };
  });
}

export interface ContentDetail {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string | null;
  body: string | null;
  subjectName: string;
  published: boolean;
  questions: { id: string; position: number; statement: string }[];
}

export async function getContent(id: string): Promise<ContentDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('resources')
    .select('id, kind, title, description, body, is_published, subject_catalog(name), questions(id, position, statement)')
    .eq('id', id)
    .eq('ai_generated', false)
    .maybeSingle();
  if (!data) return null;
  const subject = data.subject_catalog as unknown as { name: string } | null;
  const questions = (data.questions as unknown as { id: string; position: number; statement: string }[] | null) ?? [];
  return {
    id: data.id,
    kind: data.kind,
    title: data.title,
    description: data.description,
    body: data.body,
    subjectName: subject?.name ?? '—',
    published: data.is_published,
    questions: [...questions].sort((a, b) => a.position - b.position),
  };
}
