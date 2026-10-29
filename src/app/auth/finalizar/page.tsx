import type { Metadata } from 'next';
import { FinishSignIn } from '@/features/auth/components/finish-sign-in';
import { safeNext } from '@/features/auth/lib/safe-next';

export const metadata: Metadata = { title: 'Entrando…', robots: { index: false } };

/**
 * Último recurso da volta de autenticação.
 *
 * O template de e-mail antigo do Supabase devolve os tokens no fragmento da
 * URL (`#access_token=…`), e fragmento não é enviado ao servidor — nenhuma
 * rota consegue ler. Só o browser vê, então só o browser pode terminar.
 */
export default async function FinishSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <FinishSignIn next={safeNext(params.next)} />
    </main>
  );
}
