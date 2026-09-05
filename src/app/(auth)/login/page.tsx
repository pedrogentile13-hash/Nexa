import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
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
    <main className="pb-safe flex min-h-dvh flex-col">
      {/* Bloco de marca em degradê, como o kit desenha. Ele encosta no topo da
          tela e some sob a barra de status — é o que faz a primeira tela
          parecer app, e não formulário de site. */}
      <header
        className="pt-safe rounded-b-[20px] px-6 pt-6 pb-8"
        style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
      >
        <div className="mx-auto w-full max-w-sm">
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm"
          >
            <GraduationCap className="size-6" />
          </span>

          <h1 className="mt-5 text-3xl leading-none font-semibold tracking-tight">Nexa</h1>
          <p className="mt-2 text-sm leading-relaxed opacity-90">
            Seu sistema operacional acadêmico.
            <br />
            Rotina, notas e material em um lugar.
          </p>
        </div>
      </header>

      <div className="flex-1 px-5 pt-6 pb-8">
        <div className="mx-auto w-full max-w-sm">
          <LoginForm next={next} initialError={params.erro} />

          {/* O kit não põe troca de tema no login. Ela fica aqui embaixo, fora
              do caminho: quem precisa do modo escuro por conforto visual precisa
              dele ANTES de entrar, e o único outro lugar onde ele existe é o
              Perfil — atrás justamente desta tela. */}
          <div className="mt-10 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </main>
  );
}
