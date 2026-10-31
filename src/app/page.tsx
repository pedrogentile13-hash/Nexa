import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenCheck, GraduationCap, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant/server';

export const metadata: Metadata = {
  title: 'Nexa Study — estude com inteligência',
  description:
    'Nexa Study reúne resumos, simulados, revisões e uma assistente de IA para estudantes da escola e do vestibular, com acompanhamento para escolas.',
};

export const dynamic = 'force-dynamic';

const FEATURES = [
  { Icon: BookOpenCheck, title: 'Resumos, simulados e revisões', text: 'Conteúdo organizado por matéria, com revisão espaçada do que você errou para fixar de verdade.' },
  { Icon: Sparkles, title: 'NexaAI, sua assistente de estudos', text: 'Tire dúvidas, peça um resumo ou um simulado a partir dos seus próprios PDFs e fotos do caderno.' },
  { Icon: Target, title: 'Nexa Vestibular', text: 'Plano de estudo até a data da prova, banco de questões, central de erros e correção de redação no modelo ENEM.' },
  { Icon: GraduationCap, title: 'Para escolas', text: 'Cada escola tem o seu endereço, turmas, comunicados e acompanhamento para professores, coordenação e direção.' },
];

/**
 * Página inicial pública do Nexa padrão. Quem já entrou segue para o app; no endereço de uma escola
 * (que tem entrada própria) vai direto ao login.
 */
export default async function RootPage() {
  if (await getCurrentUser()) redirect('/hoje');
  if (await getTenant()) redirect('/login');

  return (
    <div className="bg-bg min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve */}
          <img src="/brand/logo-mark.webp" alt="" aria-hidden className="size-8" />
          Nexa Study
        </span>
        <Link href="/login" className="bg-brand text-brand-fg inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold">
          Entrar
        </Link>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pt-8 pb-14 text-center md:pt-16">
          <h1 className="mx-auto max-w-2xl text-4xl leading-tight font-bold tracking-tight md:text-5xl">Estude com mais foco, em qualquer lugar.</h1>
          <p className="text-muted mx-auto mt-4 max-w-xl text-base leading-relaxed md:text-lg">
            Resumos, simulados, revisões e uma assistente de inteligência artificial feitos para quem está na escola e para quem vai prestar vestibular.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="bg-brand text-brand-fg inline-flex h-12 items-center rounded-full px-7 text-sm font-semibold">
              Começar agora
            </Link>
            <Link href="/politica-de-privacidade" className="border-border bg-surface inline-flex h-12 items-center rounded-full border px-7 text-sm font-semibold">
              Como cuidamos dos seus dados
            </Link>
          </div>
        </section>

        <section aria-label="O que você encontra" className="mx-auto grid max-w-5xl gap-4 px-5 pb-16 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, text }) => (
            <article key={title} className="bg-surface border-border rounded-3xl border p-6 shadow-sm">
              <span className="bg-brand-soft text-brand-text mb-4 grid size-11 place-items-center rounded-2xl">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-muted mt-1.5 text-sm leading-relaxed">{text}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-16">
          <div className="bg-surface-2 flex items-start gap-4 rounded-3xl p-6">
            <ShieldCheck className="text-success mt-0.5 size-6 shrink-0" aria-hidden />
            <p className="text-muted text-sm leading-relaxed">
              O Nexa foi pensado para estudantes, incluindo menores de idade: a IA só responde sobre estudos, os conteúdos criados por você são privados e as escolas controlam o que os seus alunos veem.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-border border-t py-6 text-center text-xs">
        <nav className="text-muted flex justify-center gap-5">
          <Link href="/politica-de-privacidade" className="hover:text-text underline-offset-2 hover:underline">Política de privacidade</Link>
          <Link href="/termos-de-uso" className="hover:text-text underline-offset-2 hover:underline">Termos de uso</Link>
        </nav>
        <p className="text-subtle mt-3">© {new Date().getFullYear()} Nexa Study</p>
      </footer>
    </div>
  );
}
