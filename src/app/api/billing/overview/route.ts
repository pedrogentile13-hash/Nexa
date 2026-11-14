import { createClient } from '@/lib/supabase/server';
import { loadOverview } from '@/features/billing/server/overview';
import { getPlanInfo } from '@/features/billing/server/entitlements';

export const dynamic = 'force-dynamic';
const json = (obj: unknown, status = 200) => Response.json(obj, { status, headers: { 'Cache-Control': 'no-store' } });

/** Assinatura da pessoa logada: plano, próxima cobrança e faturas. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ message: 'Entre para continuar.' }, 401);
  if (!(await getPlanInfo()).billingVisible) return json({ message: 'Sua conta é de uma escola.' }, 403);

  const overview = await loadOverview(user.id);
  return json({ overview });
}
