import { createClient } from '@/lib/supabase/server';

export interface ErrorReport {
  id: string;
  origin: 'client' | 'server';
  message: string;
  stack: string | null;
  pathname: string | null;
  digest: string | null;
  userAgent: string | null;
  userName: string | null;
  createdAt: string;
}

/** Vazio quando a migração ainda não rodou — a tela mostra o estado vazio. */
export async function listRecentErrors(limit = 100): Promise<ErrorReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('recent_error_reports', { p_limit: limit });
  if (error || !data) return [];

  return data.map((e) => ({
    id: e.id,
    origin: e.origin,
    message: e.message,
    stack: e.stack,
    pathname: e.pathname,
    digest: e.digest,
    userAgent: e.user_agent,
    userName: e.user_name,
    createdAt: e.created_at,
  }));
}
