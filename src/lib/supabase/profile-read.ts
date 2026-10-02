/**
 * Leitura de perfil que tolera coluna nova ainda não existir no banco.
 *
 * Isto existe por causa de um incidente concreto: o código passou a pedir
 * `profiles.journey` antes de a migração rodar, o PostgREST recusou a
 * consulta INTEIRA com 42703 ("column does not exist"), e `supabase-js` NÃO
 * lança nesse caso — devolve `{data: null, error}`. O `try/catch` que existia
 * nunca disparou, `onboarded` virou false e o middleware mandou todo mundo
 * pro /bem-vindo, que devolvia pro /hoje: laço de redirecionamento, app
 * inteiro inacessível.
 *
 * Publicar o código e rodar a migração nunca acontecem no mesmo instante, e
 * esse intervalo não pode derrubar o portão que decide quem entra. Em regime
 * normal é UMA consulta; a segunda só roda no intervalo.
 *
 * Em módulo próprio, e não embutido no middleware, para poder ser testado com
 * um cliente de mentira — que é o que faltava quando o bug passou.
 */

/**
 * O mínimo que estas funções usam do cliente, para o teste poder fingir.
 *
 * `PromiseLike` e não `Promise`: o builder do `supabase-js` é um thenable, não
 * uma Promise de verdade (não tem `catch`/`finally`), então exigir `Promise`
 * aqui tornaria o cliente real não atribuível a esta interface.
 */
export interface ProfileReader {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
}

async function read(
  client: ProfileReader,
  userId: string,
  columns: string,
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
  const result = await client.from('profiles').select(columns).eq('id', userId).maybeSingle();
  return { data: (result.data as Record<string, unknown> | null) ?? null, error: result.error };
}

/**
 * Tenta com as colunas desejadas; se o banco recusar, repete só com as que
 * certamente existem e devolve os padrões para o resto.
 */
export async function readWithFallback<T extends Record<string, unknown>>(
  client: ProfileReader,
  userId: string,
  wanted: string,
  guaranteed: string,
  defaults: T,
): Promise<(T & Record<string, unknown>) | null> {
  try {
    const full = await read(client, userId, wanted);
    if (!full.error && full.data) return { ...defaults, ...full.data };
    if (!full.error && !full.data) return null;

    const fallback = await read(client, userId, guaranteed);
    if (fallback.error || !fallback.data) return null;
    return { ...defaults, ...fallback.data };
  } catch {
    return null;
  }
}

export const ONBOARDING_COLUMNS = { wanted: 'onboarded_at, journey', guaranteed: 'onboarded_at' };

export const SHELL_COLUMNS = {
  wanted: 'full_name, avatar_url, role, journey',
  guaranteed: 'full_name, avatar_url, role',
};
