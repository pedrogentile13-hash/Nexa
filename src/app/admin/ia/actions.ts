'use server';

import { requireAdmin } from '@/features/admin/server/guard';
import { diagnoseAI, type ProviderDiagnosis } from '@/lib/ai/diagnose';

/** Roda o teste real. Só admin: cada chamada gasta cota do provedor. */
export async function runAIDiagnosis(): Promise<ProviderDiagnosis[]> {
  await requireAdmin();
  return diagnoseAI(true);
}
