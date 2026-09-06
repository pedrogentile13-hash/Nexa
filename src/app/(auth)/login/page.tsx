import type { Metadata } from 'next';
import { Check, GraduationCap } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeNext } from '@/features/auth/lib/safe-next';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse o Nexa e veja o que você precisa fazer hoje.',
};

/** O que o app faz, em três linhas — só aparece onde há espaço para elas. */
const HIGHLIGHTS = [
  'Foco do dia ranqueado por prioridade',
  'Simulador de notas em tempo real',
  'Trilha de estudo por matéria',
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <main className="pb-safe flex min-h-dvh flex-col lg:flex-row">
      {/* Painel de marca.
          No celular ele é uma faixa curta no topo; no desktop ocupa metade da
          tela e ganha as três linhas do que o app faz — é o guia de desktop, e
          faz sentido: numa tela larga sobra área, e o que existe para preencher
          não é decoração, é a resposta a "o que é isto?". */}
      <header
        className="pt-safe rounded-b-[20px] px-6 pt-6 pb-8 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:rounded-none lg:px-16 lg:py-16"
        style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
      >
        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md">
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm lg:size-14"
          >
            <GraduationCap className="size-6 lg:size-7" />
          </span>

          <h1 className="mt-5 text-3xl leading-none font-semibold tracking-tight lg:mt-8 lg:text-5xl">
            Nexa
          </h1>
          <p className="mt-2 text-sm leading-relaxed opacity-90 lg:mt-4 lg:text-lg">
            Seu sistema operacional acadêmico. Rotina, notas e material de estudo em um só lugar.
          </p>

          <ul className="mt-8 hidden space-y-3 lg:block">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm opacity-90">
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15"
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center px-5 pt-6 pb-8 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="mb-6 hidden text-2xl font-semibold tracking-tight lg:block">
            Bem-vindo de volta
          </h2>

          <LoginForm next={next} initialError={params.erro} />

          {/* O kit não põe troca de tema no login. Ela fica aqui embaixo, fora
              do caminho: quem precisa do modo escuro por conforto visual precisa
              dele ANTES de entrar, e o único outro lugar onde ela existe é o
              Perfil — atrás justamente desta tela. */}
          <div className="mt-10 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </main>
  );
}
