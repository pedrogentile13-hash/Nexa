'use server';

import { requireFullAdmin } from '@/features/admin/server/guard';
import { diagnoseAI, type ProviderDiagnosis } from '@/lib/ai/diagnose';

/** Roda o teste real. Só admin: cada chamada gasta cota do provedor. */
export async function runAIDiagnosis(): Promise<ProviderDiagnosis[]> {
  await requireFullAdmin();
  return diagnoseAI(true);
}
