import { getCurrentUser } from '@/lib/supabase/server';
import { DEMO_STAFF_ID, DEMO_USER_ID, demoEnabled } from './flags';

/** A sessão atual é a do aluno fictício (Enzo) do modo demonstração? Sempre falso fora dele. */
export async function isDemoSession(): Promise<boolean> {
  if (!demoEnabled()) return false;
  return (await getCurrentUser())?.id === DEMO_USER_ID;
}

/** A sessão atual é a da coordenação fictícia do painel Escola? */
export async function isDemoStaffSession(): Promise<boolean> {
  if (!demoEnabled()) return false;
  return (await getCurrentUser())?.id === DEMO_STAFF_ID;
}
