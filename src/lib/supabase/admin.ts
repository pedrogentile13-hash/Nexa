import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import type { Database } from '@/types/database.types';

/**
 * Cliente com a `service_role` key — ignora RLS por completo.
 *
 * Uso restrito a operações de servidor que por definição precisam agir sobre
 * dados de OUTROS usuários: hoje, só o envio de push (`src/lib/push/send.ts`
 * lê `push_subscriptions` de uma lista de ids, coisa que a policy
 * `push_subscriptions_all_own` nunca deixaria pela chave anônima). Nunca
 * importar isto de um Client Component nem devolver o resultado ao navegador.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` é opcional em tempo de execução, como
 * `GROQ_API_KEY` — sem ela, quem chamar isto recebe `null` e o recurso que
 * depende dela (push) vira no-op em vez de derrubar a Server Action inteira.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
