import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeNext } from '@/features/auth/lib/safe-next';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse o Nexa e veja o que você precisa fazer hoje.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col px-5">
      <div className="flex justify-end py-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center pb-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center">
            <span
              aria-hidden
              className="bg-brand text-brand-fg mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-2xl font-bold"
            >
              N
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">Entrar no Nexa</h1>
            <p className="text-muted mt-1.5 text-sm">Sua vida acadêmica organizada em um lugar.</p>
          </div>

          <LoginForm next={next} initialError={params.erro} />
        </div>
      </div>
    </main>
  );
}
