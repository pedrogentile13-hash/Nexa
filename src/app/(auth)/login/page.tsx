import type { Metadata } from 'next';
import { BarChart3, BookOpen, Sparkles } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeNext } from '@/features/auth/lib/safe-next';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse o Nexa Study e veja o que você precisa fazer hoje.',
};

/**
 * O que o app faz, em três blocos — só aparece onde há espaço para eles
 * (desktop). Cada um é algo que já existe de verdade no produto, não uma
 * promessa de mockup: biblioteca de conteúdo, nota automática e NexaAI.
 */
const FEATURES = [
  {
    Icon: BookOpen,
    title: 'Conteúdo completo',
    description: 'Resumos, aulas, exercícios e simulados em um só lugar.',
  },
  {
    Icon: BarChart3,
    title: 'Acompanhamento real',
    description: 'Veja seu progresso e conquiste suas metas.',
  },
  {
    Icon: Sparkles,
    title: 'NexaAI',
    description: 'Tire dúvidas, gere resumos e receba orientações personalizadas.',
  },
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
      {/* Painel de marca. No celular é uma faixa curta com só a logo; no
          desktop ocupa metade da tela e ganha o resto (headline, recursos,
          depoimento) — é o guia de desktop, e faz sentido: numa tela larga
          sobra área, e o que existe para preencher não é decoração, é a
          resposta a "o que é isto?". */}
      <header
        className="pt-safe flex items-center gap-2.5 rounded-b-[20px] px-6 pt-6 pb-6 lg:flex-col lg:items-stretch lg:justify-center lg:gap-0 lg:rounded-none lg:px-16 lg:py-16"
        style={{ background: 'var(--gradient-header)', color: 'var(--gradient-header-fg)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve, não precisa de otimização do next/image */}
        <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-9 shrink-0 lg:hidden" />
        <span className="text-lg font-bold tracking-tight lg:hidden">
          NEXA <span className="font-normal opacity-80">STUDY</span>
        </span>

        <div className="mx-auto hidden w-full max-w-md lg:block">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-11 shrink-0" />
            <span className="text-xl leading-none font-bold tracking-tight">
              NEXA <span className="font-normal opacity-80">STUDY</span>
            </span>
          </div>

          <h1 className="mt-10 text-4xl leading-[1.1] font-semibold tracking-tight">
            Mais que estudos, grandes conquistas.
          </h1>
          <p className="mt-4 text-base leading-relaxed opacity-90">
            O Nexa Study é a sua plataforma completa para aprender, praticar, acompanhar seu
            progresso e evoluir sempre.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm"
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm opacity-80">{description}</p>
                </div>
              </li>
            ))}
          </ul>

          <blockquote className="mt-10 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed backdrop-blur-sm">
            &ldquo;Disciplina hoje, resultados amanhã.&rdquo;
            <footer className="mt-1 text-xs opacity-75">— Nexa Study</footer>
          </blockquote>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center px-5 pt-6 pb-8 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo ao Nexa Study</h2>
          <p className="text-muted mt-1.5 mb-6 text-sm">
            Faça login para continuar sua jornada de aprendizado.
          </p>

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
