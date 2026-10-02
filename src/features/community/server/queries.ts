import { createClient } from '@/lib/supabase/server';
import type { SocialVisibility } from '@/types/database.types';

/**
 * Base do Nexa Community (Fase 0) — só o suficiente pra `social_profiles`
 * existir e ser lido. Feed/comunidades/grupos/etc. ganham seus próprios
 * `queries.ts`/`actions.ts` quando cada fase chegar (ver
 * NEXA_COMMUNITY_MASTER_IMPLEMENTATION_PLAN.md), em vez de acumular tudo
 * neste arquivo.
 */

export interface SocialProfile {
  id: string;
  username: string | null;
  bio: string | null;
  bannerUrl: string | null;
  visibility: SocialVisibility;
}

const DEFAULT_VISIBILITY: SocialVisibility = 'school';

/**
 * Perfil social de um usuário — `null` quando ele não configurou ainda,
 * NUNCA quando é só invisível pra quem pediu (RLS já filtra isso antes:
 * uma linha bloqueada por visibilidade simplesmente não aparece na busca,
 * indistinguível de "não existe" pra quem não tem acesso).
 */
export async function getSocialProfile(userId: string): Promise<SocialProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('social_profiles')
    .select('id, username, bio, banner_url, visibility')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    bio: data.bio,
    bannerUrl: data.banner_url,
    visibility: data.visibility,
  };
}

/** Perfil social do usuário logado, com os defaults que ele veria antes de salvar pela primeira vez. */
export async function getMySocialProfile(): Promise<SocialProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: '', username: null, bio: null, bannerUrl: null, visibility: DEFAULT_VISIBILITY };

  const existing = await getSocialProfile(user.id);
  return existing ?? { id: user.id, username: null, bio: null, bannerUrl: null, visibility: DEFAULT_VISIBILITY };
}
