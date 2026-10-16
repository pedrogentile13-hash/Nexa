'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Layers, Target } from 'lucide-react';
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
  description: string;
  Icon: typeof GraduationCap;
}[] = [
  {
    value: 'school',
    title: 'Nexa Escolas',
    description: 'Estou na escola. Quero organizar matérias, lições, provas e notas.',
    Icon: GraduationCap,
  },
  {
    value: 'vestibular',
    title: 'Nexa Vestibular',
    description: 'Estou me preparando pra prestar. Quero plano de estudo, questões e redação.',
    Icon: Target,
  },
  {
    value: 'both',
    title: 'Os dois',
    description: 'Estou no ensino médio e já me preparando pro vestibular.',
    Icon: Layers,
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
    <div className="pt-safe pb-safe bg-surface-2/40 flex min-h-dvh flex-col justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-md space-y-6 py-8"
      >
        <div className="space-y-2 text-center">
          <div
            aria-hidden
            className="bg-brand-soft mx-auto grid size-16 place-items-center rounded-3xl"
          >
            <GraduationCap className="text-brand-text size-8" />
          </div>
          <h1 className="text-2xl leading-tight font-bold">Qual é o seu momento?</h1>
          <p className="text-muted text-sm leading-snug">
            Isso muda o Nexa inteiro — as telas, o que ele pergunta e o que ele te mostra todo
            dia. Você pode trocar depois, no seu perfil.
          </p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map(({ value, title, description, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setJourney(value)}
              className={cn(
                'border-border bg-surface hover:border-brand/40 hover:bg-brand-soft/40',
                'group flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition-colors',
              )}
            >
              <span
                aria-hidden
                className="bg-surface-2 group-hover:bg-brand-soft grid size-12 shrink-0 place-items-center rounded-2xl transition-colors"
              >
                <Icon className="text-muted group-hover:text-brand-text size-6 transition-colors" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">{title}</span>
                <span className="text-muted block text-sm leading-snug">{description}</span>
              </span>
              <ArrowRight
                className="text-subtle group-hover:text-brand-text size-5 shrink-0 transition-colors"
                aria-hidden
              />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
