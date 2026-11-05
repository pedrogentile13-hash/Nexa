import { createClient } from '@/lib/supabase/server';
import type { PublicationRequestListRow, PublicationStatus, ResourceKind, ResourceVisibility } from '@/types/database.types';

export interface StudyDocumentSummary {
  id: string;
  code: string;
  title: string;
  sourceKind: 'pdf' | 'image' | 'text';
  pages: number | null;
  chars: number;
  createdAt: string;
}

export async function listStudyDocuments(): Promise<StudyDocumentSummary[]> {
  const supabase = await createClient();
  const map = (rows: { id: string; code?: string | null; title: string; source_kind: 'pdf' | 'image' | 'text'; pages: number | null; content: string; created_at: string }[]) =>
    rows.map((d) => ({
      id: d.id,
      code: d.code ?? '',
      title: d.title,
      sourceKind: d.source_kind,
      pages: d.pages,
      chars: d.content.length,
      createdAt: d.created_at,
    }));

  const withCode = await supabase
    .from('study_documents')
    .select('id, code, title, source_kind, pages, content, created_at')
    .order('created_at', { ascending: false })
    .limit(60);
  if (!withCode.error && withCode.data) return map(withCode.data);

  // Antes do SQL das siglas rodar a coluna `code` não existe: lista sem ela.
  const legacy = await supabase
    .from('study_documents')
    .select('id, title, source_kind, pages, content, created_at')
    .order('created_at', { ascending: false })
    .limit(60);
  return legacy.error || !legacy.data ? [] : map(legacy.data);
}

export interface MyCreation {
  id: string;
  kind: ResourceKind;
  title: string;
  subjectName: string;
  visibility: ResourceVisibility;
  questionCount: number;
  createdAt: string;
  /** Estado do último pedido de publicação à escola (null = nunca pediu). */
  publication: { status: PublicationStatus; decisionNote: string | null } | null;
}

/** Conteúdos criados pela IA para o aluno + o estado do pedido de publicação de cada um. */
export async function listMyCreations(): Promise<MyCreation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_my_ai_resources');
  if (error || !data) return [];

  const { data: reqs } = await supabase
    .from('publication_requests')
    .select('resource_id, status, decision_note, created_at')
    .order('created_at', { ascending: false });
  const latest = new Map<string, { status: PublicationStatus; decisionNote: string | null }>();
  for (const r of reqs ?? []) {
    if (!latest.has(r.resource_id)) latest.set(r.resource_id, { status: r.status, decisionNote: r.decision_note });
  }

  return data.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    subjectName: r.subject_name,
    visibility: r.visibility,
    questionCount: r.question_count,
    createdAt: r.created_at,
    publication: latest.get(r.id) ?? null,
  }));
}

export async function listPublicationRequests(status: PublicationStatus | null): Promise<PublicationRequestListRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_publication_requests', { p_status: status });
  return error || !data ? [] : data;
}
