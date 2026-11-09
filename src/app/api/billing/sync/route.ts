import { createClient } from '@/lib/supabase/server';
import { getPlanInfo } from '@/features/billing/server/entitlements';
import { syncUserFromStripe } from '@/features/billing/server/sync-user';

export const dynamic = 'force-dynamic';
const json = (obj: unknown, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

/** "Já paguei e o plano não apareceu": confere no Stripe a assinatura desta pessoa e atualiza o plano. */
export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return json({ message: 'Proibido.' }, 403);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ message: 'Entre para continuar.' }, 401);
  if (!(await getPlanInfo()).billingVisible) return json({ message: 'Sua conta é de uma escola.' }, 403);

  const result = await syncUserFromStripe(user.id, user.email ?? null);
  if (result === 'unavailable') return json({ message: 'Não consegui conferir agora. Tente de novo em instantes.' }, 503);
  return json({ result });
}
