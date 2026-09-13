import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Feature flags do Nexa Community — cada fase (feed, comunidades, chat, IA
 * Creator, eventos, certificados, XP social) nasce desligada em
 * `feature_flags` (migração `20260913000100_community_feature_flags.sql`) e
 * é ligada só depois de implementada e verificada. Checar aqui em vez de só
 * confiar na ausência de UI: uma rota/Server Action de uma fase desligada
 * também recusa, então desligar uma flag em produção corta o acesso de
 * verdade, não só esconde o botão.
 */
export const COMMUNITY_FEATURE_KEYS = [
  'community_enabled',
  'posts_enabled',
  'groups_enabled',
  'chat_enabled',
  'creator_enabled',
  'events_enabled',
  'certificates_enabled',
  'social_xp_enabled',
] as const;

export type FeatureFlagKey = (typeof COMMUNITY_FEATURE_KEYS)[number];

/** `cache()`: uma leitura por request, dedupe entre layout/página/Server Action que checam a mesma flag. */
export const getFeatureFlags = cache(async (): Promise<Record<FeatureFlagKey, boolean>> => {
  const flags = Object.fromEntries(COMMUNITY_FEATURE_KEYS.map((key) => [key, false])) as Record<
    FeatureFlagKey,
    boolean
  >;

  const supabase = await createClient();
  const { data } = await supabase.from('feature_flags').select('key, enabled');
  for (const row of data ?? []) {
    if ((COMMUNITY_FEATURE_KEYS as readonly string[]).includes(row.key)) {
      flags[row.key as FeatureFlagKey] = row.enabled;
    }
  }
  return flags;
});

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key];
}
