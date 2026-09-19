import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Feature flags do Nexa — cada fase grande (Community: feed, comunidades,
 * chat, IA Creator, eventos, certificados, XP social; Vestibular: a área
 * inteira e o ENEM) nasce desligada em `feature_flags` e é ligada só depois
 * de implementada e verificada. Checar aqui em vez de só confiar na ausência
 * de UI: uma rota/Server Action de uma fase desligada também recusa, então
 * desligar uma flag em produção corta o acesso de verdade, não só esconde o
 * botão.
 */
export const FEATURE_KEYS = [
  'community_enabled',
  'posts_enabled',
  'groups_enabled',
  'chat_enabled',
  'creator_enabled',
  'events_enabled',
  'certificates_enabled',
  'social_xp_enabled',
  'vestibular_enabled',
  'enem_enabled',
] as const;

export type FeatureFlagKey = (typeof FEATURE_KEYS)[number];

/** `cache()`: uma leitura por request, dedupe entre layout/página/Server Action que checam a mesma flag. */
export const getFeatureFlags = cache(async (): Promise<Record<FeatureFlagKey, boolean>> => {
  const flags = Object.fromEntries(FEATURE_KEYS.map((key) => [key, false])) as Record<
    FeatureFlagKey,
    boolean
  >;

  const supabase = await createClient();
  const { data } = await supabase.from('feature_flags').select('key, enabled');
  for (const row of data ?? []) {
    if ((FEATURE_KEYS as readonly string[]).includes(row.key)) {
      flags[row.key as FeatureFlagKey] = row.enabled;
    }
  }
  return flags;
});

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key];
}
