import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/feature-flags';
import { getPlanInfo } from '@/features/billing/server/entitlements';
import { vestibularAllowed } from './vestibular-rule';

/** Vestibular liberado para a pessoa logada? Uma leitura por request (cache). */
export const isVestibularEnabled = cache(async (): Promise<boolean> => {
  const flags = await getFeatureFlags();
  if (!flags.vestibular_enabled) return false;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return true;
  // "Conta de escola" = Nexa Escolas (plano school). Quem só escolheu uma escola no Perfil segue o Nexa padrão.
  const plan = await getPlanInfo();
  if (plan?.plan !== 'school') return true;
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', auth.user.id)
    .maybeSingle();
  const schoolId = (profile as { school_id?: string | null } | null)?.school_id ?? null;
  if (!schoolId) return true;

  const { data: school, error } = await supabase
    .from('schools')
    .select('vestibular_enabled')
    .eq('id', schoolId)
    .maybeSingle();
  const schoolEnabled = error
    ? null
    : ((school as { vestibular_enabled?: boolean } | null)?.vestibular_enabled ?? null);

  return vestibularAllowed({ globalEnabled: true, schoolAccount: true, schoolEnabled });
});
