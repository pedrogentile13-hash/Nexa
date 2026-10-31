'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, GraduationCap, Layers, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SchoolOnboardingFlow } from './school-onboarding';
import { VestibularOnboardingFlow } from './vestibular-onboarding';
import type { Journey } from '../schemas';
import type { CatalogSubject } from '../types';
import type { SubjectArea } from '@/types/database.types';

/**
 * A porta de entrada do Nexa.
 *
 * A primeira pergunta não é o nome — é QUAL NEXA a pessoa veio usar. Um
 * vestibulando de cursinho e um aluno do 8º ano não precisam do mesmo app, e
 * descobrir isso na quinta tela (depois de já ter pedido série e grade
 * escolar) é tarde demais: ou o app já perguntou coisa que não se aplica, ou
 * já escondeu o que a pessoa procurava.
 *
 * Por isso esta tela vem antes de qualquer campo, e a escolha aqui troca o
 * fluxo INTEIRO — não esconde alguns campos do mesmo formulário.
 */

interface Props {
  catalog: [SubjectArea, CatalogSubject[]][];
  coreSubjectIds: string[];
  defaultName: string;
  fallbackTimezone: string;
  exams: { id: string; name: string; organization: string | null }[];
  /** Com o vestibular desligado, só existe um caminho — e perguntar seria cruel. */
  vestibularEnabled: boolean;
}

const OPTIONS: {
  value: Journey;
  title: string;
  tagline: string;
  points: string[];
  gradient: string;
  Icon: typeof GraduationCap;
  badge?: string;
}[] = [
  {
    value: 'school',
    title: 'Nexa Estudos',
    tagline: 'Para quem está na escola',
    points: ['Matérias, lições e notas em um só lugar', 'Resumos, simulados e revisões', 'NexaAI para tirar dúvidas'],
    gradient: 'from-violet-600 via-indigo-600 to-blue-600',
    Icon: GraduationCap,
  },
  {
    value: 'vestibular',
    title: 'Nexa Vestibular',
    tagline: 'Para quem vai prestar prova',
    points: ['Plano de estudo até a data da prova', 'Banco de questões e central de erros', 'Correção de redação no modelo ENEM'],
    gradient: 'from-teal-600 via-cyan-600 to-sky-600',
    Icon: Target,
  },
  {
    value: 'both',
    title: 'Os dois',
    tagline: 'Escola agora, vestibular logo ali',
    points: ['Alterne entre os dois pelo logo', 'Tudo que você faz fica guardado', 'Ideal para o Ensino Médio'],
    gradient: 'from-fuchsia-600 via-violet-600 to-teal-600',
    Icon: Layers,
    badge: 'Ensino Médio',
  },
];

export function OnboardingFlow({
  catalog,
  coreSubjectIds,
  defaultName,
  fallbackTimezone,
  exams,
  vestibularEnabled,
}: Props) {
  const [journey, setJourney] = useState<Journey | null>(vestibularEnabled ? null : 'school');

  if (journey === 'school') {
    return (
      <SchoolOnboardingFlow
        catalog={catalog}
        coreSubjectIds={coreSubjectIds}
        defaultName={defaultName}
        fallbackTimezone={fallbackTimezone}
      />
    );
  }

  if (journey === 'vestibular' || journey === 'both') {
    return (
      <VestibularOnboardingFlow
        journey={journey}
        exams={exams}
        defaultName={defaultName}
        fallbackTimezone={fallbackTimezone}
        onBack={() => setJourney(null)}
      />
    );
  }

  return (
    <div className="pt-safe pb-safe from-brand-soft/60 via-bg to-bg flex min-h-dvh flex-col bg-gradient-to-b">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-10"
      >
        <div className="mb-8 text-center md:mb-10">
          <p className="text-brand-text mb-2 text-sm font-semibold tracking-wide">Bem-vindo ao Nexa</p>
          <h1 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl">Como você quer estudar?</h1>
          <p className="text-muted mx-auto mt-3 max-w-md text-sm leading-relaxed md:text-base">
            Escolha o Nexa que combina com o seu momento. Você pode trocar quando quiser, no perfil — nada do que você fizer é perdido.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map(({ value, title, tagline, points, gradient, Icon, badge }) => (
            <button
              key={value}
              type="button"
              onClick={() => setJourney(value)}
              className="bg-surface border-border group relative flex flex-col overflow-hidden rounded-[28px] border text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-brand focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className={cn('relative flex items-center gap-4 bg-gradient-to-br px-5 py-5 text-white md:flex-col md:items-start md:gap-6 md:py-7', gradient)}>
                <span aria-hidden className="absolute -top-8 -right-8 size-28 rounded-full bg-white/10" />
                <span aria-hidden className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                  <Icon className="size-6" />
                </span>
                <span className="relative min-w-0">
                  <span className="block text-xl font-semibold tracking-tight">{title}</span>
                  <span className="block text-sm opacity-90">{tagline}</span>
                </span>
                {badge && <span className="absolute top-4 right-4 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">{badge}</span>}
              </span>
              <span className="flex flex-1 flex-col gap-4 p-5">
                <ul className="text-muted space-y-2 text-sm">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <span className="bg-brand-soft text-brand-text group-hover:bg-brand group-hover:text-brand-fg mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors">
                  Escolher <ArrowRight className="size-4" aria-hidden />
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
